#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Usage:
  ./scan_media_to_json.sh [-v] <root_folder> [output.json]

Options:
  -v    Verbose mode
  -h    Help

What it does:
  - Scans media folders under root_folder
  - Writes final JSON to output.json
  - Stores cache files beside this script
  - Reuses unchanged folder JSON from cache
EOF
}

verbose=false

log() {
    if [[ "$verbose" == true ]]; then
        printf '[INFO] %s\n' "$*" >&2
    fi
}

json_escape() {
    local s=$1
    s=${s//\\/\\\\}
    s=${s//\"/\\\"}
    s=${s//$'\n'/\\n}
    s=${s//$'\r'/\\r}
    s=${s//$'\t'/\\t}
    s=${s//$'\f'/\\f}
    s=${s//$'\b'/\\b}
    printf '%s' "$s"
}

format_duration() {
    local total=$1
    local h=$((total / 3600))
    local m=$(((total % 3600) / 60))
    local s=$((total % 60))

    if (( h > 0 )); then
        printf '%dh %dm %ds' "$h" "$m" "$s"
    elif (( m > 0 )); then
        printf '%dm %ds' "$m" "$s"
    else
        printf '%ds' "$s"
    fi
}

make_snippet_path() {
    local folder=$1
    local checksum
    local base
    checksum=$(printf '%s' "$folder" | cksum | awk '{print $1}')
    base=$(basename "$folder" | tr -cs '[:alnum:]._-' '_')
    printf '%s/%s_%s.json' "$SNIPPET_DIR" "$checksum" "$base"
}

finalize_folder() {
    [[ -z "${curr_folder:-}" ]] && return 0

    local snippet_path
    snippet_path=$(make_snippet_path "$curr_folder")

    local old_sig
    old_sig="${OLD_SIG[$curr_folder]-}"

    local curr_sig
    curr_sig="${curr_count}|${curr_size}|${curr_mtime}"

    local reused_this=false

    if [[ -n "$old_sig" ]] && [[ "$old_sig" == "$curr_sig" ]] && [[ -f "${OLD_SNIPPET[$curr_folder]-}" ]]; then
        snippet_path="${OLD_SNIPPET[$curr_folder]}"
        reused_this=true
        ((reused_count += 1))
        log "Reused: $curr_folder"
    else
        {
            printf '    {\n'
            printf '      "folder_name": "%s",\n' "$(json_escape "$(basename "$curr_folder")")"
            printf '      "folder_path": "%s",\n' "$(json_escape "$curr_folder")"
            printf '      "file_count": %d,\n' "$curr_count"
            printf '      "folder_size_bytes": %d,\n' "$curr_size"
            printf '      "latest_mtime": %d,\n' "$curr_mtime"
            printf '      "files": [\n'
            cat "$curr_files_tmp"
            printf '\n'
            printf '      ]\n'
            printf '    }\n'
        } > "$snippet_path"

        ((rescanned_count += 1))
        log "Scanned: $curr_folder"
    fi

    if [[ "$first_output_folder" == true ]]; then
        first_output_folder=false
    else
        printf ',\n' >> "$OUTPUT_TMP"
    fi
    cat "$snippet_path" >> "$OUTPUT_TMP"

    printf '%s\x1f%s\x1f%s\x1f%s\x1f%s\n' \
        "$curr_folder" "$curr_count" "$curr_size" "$curr_mtime" "$snippet_path" >> "$INDEX_TMP"

    if [[ "$first_cache_folder" == true ]]; then
        first_cache_folder=false
    else
        printf ',\n' >> "$CACHE_JSON_TMP"
    fi

    printf '    {"folder_path":"%s","file_count":%d,"folder_size_bytes":%d,"latest_mtime":%d,"reused":%s,"snippet_file":"%s"}' \
        "$(json_escape "$curr_folder")" \
        "$curr_count" \
        "$curr_size" \
        "$curr_mtime" \
        "$reused_this" \
        "$(json_escape "$snippet_path")" >> "$CACHE_JSON_TMP"

    ((folder_count += 1))

    rm -f "$curr_files_tmp"
    curr_folder=""
    curr_count=0
    curr_size=0
    curr_mtime=0
    curr_files_tmp=""
    curr_first_file=true
}

while getopts ":vh" opt; do
    case "$opt" in
        v) verbose=true ;;
        h)
            usage
            exit 0
            ;;
        \?)
            echo "Unknown option: -$OPTARG" >&2
            usage >&2
            exit 1
            ;;
    esac
done

shift $((OPTIND - 1))

if [[ $# -lt 1 || $# -gt 2 ]]; then
    usage >&2
    exit 1
fi

ROOT=$1
if [[ ! -d "$ROOT" ]]; then
    echo "Directory does not exist: $ROOT" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT="${2:-$SCRIPT_DIR/media_index.json}"

CACHE_DIR="$SCRIPT_DIR/.scan_media_cache"
SNIPPET_DIR="$CACHE_DIR/snippets"
INDEX_FILE="$CACHE_DIR/cache.index"
CACHE_JSON="$SCRIPT_DIR/.scan_media_cache_folders.json"

mkdir -p "$SNIPPET_DIR"

start_time=$(date +%s)

log "Root folder: $ROOT"
log "Output JSON: $OUTPUT"
log "Cache JSON: $CACHE_JSON"
log "Cache index: $INDEX_FILE"

declare -A OLD_SIG=()
declare -A OLD_SNIPPET=()

first_run=true
if [[ -f "$INDEX_FILE" ]]; then
    first_run=false
    log "Cache found. Incremental scan mode."
    while IFS=$'\x1f' read -r folder count size mtime snippet; do
        [[ -z "${folder:-}" ]] && continue
        OLD_SIG["$folder"]="${count}|${size}|${mtime}"
        OLD_SNIPPET["$folder"]="$snippet"
    done < "$INDEX_FILE"
else
    log "Cache not found. First run: full scan mode."
fi

OUTPUT_TMP=$(mktemp)
INDEX_TMP=$(mktemp)
CACHE_JSON_TMP=$(mktemp)
trap 'rm -f "$OUTPUT_TMP" "$INDEX_TMP" "$CACHE_JSON_TMP" "${curr_files_tmp:-}"' EXIT

generated_at=$(date +%s)
folder_count=0
reused_count=0
rescanned_count=0

first_output_folder=true
first_cache_folder=true

{
    printf '{\n'
    printf '  "root": "%s",\n' "$(json_escape "$(realpath "$ROOT")")"
    printf '  "generated_at": %d,\n' "$generated_at"
    printf '  "first_run": %s,\n' "$first_run"
    printf '  "folders": [\n'
} > "$OUTPUT_TMP"

{
    printf '{\n'
    printf '  "root": "%s",\n' "$(json_escape "$(realpath "$ROOT")")"
    printf '  "generated_at": %d,\n' "$generated_at"
    printf '  "first_run": %s,\n' "$first_run"
    printf '  "folders": [\n'
} > "$CACHE_JSON_TMP"

curr_folder=""
curr_count=0
curr_size=0
curr_mtime=0
curr_files_tmp=""
curr_first_file=true

log "Scanning media files..."

while IFS=$'\x1f' read -r -d '' folder name size mtime fullpath; do
    if [[ "$folder" != "$curr_folder" ]]; then
        finalize_folder
        curr_folder="$folder"
        curr_count=0
        curr_size=0
        curr_mtime=0
        curr_files_tmp=$(mktemp)
        curr_first_file=true
        log "Processing folder: $curr_folder"
    fi

    ((curr_count += 1))
    ((curr_size += size))
    if (( mtime > curr_mtime )); then
        curr_mtime=$mtime
    fi

    if [[ "$curr_first_file" == true ]]; then
        curr_first_file=false
    else
        printf ',\n' >> "$curr_files_tmp"
    fi

    printf '        {"name": "%s", "path": "%s", "size": %d, "thumbnail": "", "date": %d, "mimetype": "%s"}' \
        "$(json_escape "$name")" \
        "$(json_escape "$fullpath")" \
        "$size" \
        "$mtime" \
        "$(file --mime-type -b "$fullpath")" >> "$curr_files_tmp"

done < <(
    find "$ROOT" -type f \( \
        -iname "*.jpg"  -o -iname "*.jpeg" -o -iname "*.png"  -o \
        -iname "*.gif"  -o -iname "*.bmp"  -o -iname "*.webp" -o \
        -iname "*.tiff" -o -iname "*.mp4" \
    \) -printf '%h\037%f\037%s\037%Ts\037%p\0' \
    | sort -z -t $'\x1f' -k1,1 -k5,5
)

finalize_folder

{
    printf '\n'
    printf '  ]\n'
    printf '}\n'
} >> "$OUTPUT_TMP"

{
    printf '\n'
    printf '  ]\n'
    printf '}\n'
} >> "$CACHE_JSON_TMP"

mv "$OUTPUT_TMP" "$OUTPUT"
mv "$INDEX_TMP" "$INDEX_FILE"
mv "$CACHE_JSON_TMP" "$CACHE_JSON"

end_time=$(date +%s)
duration=$((end_time - start_time))

if [[ "$first_run" == true ]]; then
    echo "First run completed."
else
    echo "Incremental scan completed."
fi

echo "JSON saved to $OUTPUT"
echo "Cache JSON saved to $CACHE_JSON"
echo "Folders total: $folder_count"
echo "Folders reused: $reused_count"
echo "Folders rescanned: $rescanned_count"
echo "Execution time: $(format_duration "$duration")"
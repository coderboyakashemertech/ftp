#!/bin/bash

# Configuration
INPUT_JSON_FILE="/home/coderboy/projects/ftp/api/gallery.json"
OUTPUT_JSON_FILE="/home/coderboy/projects/ftp/api/gallery.json"
THUMBNAIL_DIRECTORY="/mnt/c/Users/akash/Downloads/.thumbnails"
LOG_FILE="/home/coderboy/projects/ftp/ffmpeg_generation_$(date +%s).log"

mkdir -p "$THUMBNAIL_DIRECTORY"

if [ ! -f "$INPUT_JSON_FILE" ]; then
    echo "Error: Input file not found."
    exit 1
fi

echo "Processing videos only (ignoring all images)..."

# 1. Strict JSON mapping
# Logic: Only add a thumbnail path if mimetype is video/ AND name does NOT end in .jpg/.jpeg/.png
updated_json=$(jq --arg thumb_dir "$THUMBNAIL_DIRECTORY" '
  .folders |= map(
    .files |= map(
      if (.mimetype | startswith("video/")) and (.name | test("\\.(jpg|jpeg|png|webp)$"; "i") | not) then
        .thumbnail = ($thumb_dir + "/" + (.date // (now | floor) | tostring) + ".png")
      else
        .
      end
    )
  ) | .first_run = false | .generated_at = '$(date +%s)'
' "$INPUT_JSON_FILE")

# 2. Extraction & Generation
# We only pipe items that actually received a .thumbnail path in step 1
echo "$updated_json" | jq -r '.folders[].files[] | select(.thumbnail != null and .thumbnail != "") | .path + "|" + .thumbnail' | while IFS="|" read -r video_path thumb_path; do
    
    # Final sanity check: skip if the source path somehow ends in an image extension
    if [[ "$video_path" =~ \.(jpg|jpeg|png|webp)$ ]]; then
        continue
    fi

    if [ ! -f "$thumb_path" ]; then
        if [ -f "$video_path" ]; then
            echo "Generating: $(basename "$thumb_path")"
            {
                echo "--------------------------------------------------"
                echo "TIME: $(date)"
                echo "VIDEO: $video_path"
                echo "THUMB: $thumb_path"
                echo "COMMAND: ffmpeg -y -ss 00:00:02 -i \"$video_path\" -vframes 1 -q:v 2 -vf \"scale=480:-1\" \"$thumb_path\""
                echo "OUTPUT:"
                ffmpeg -y -ss 00:00:02 -i "$video_path" -vframes 1 -q:v 2 -vf "scale=480:-1" "$thumb_path" 2>&1
                FFMPEG_EXIT_CODE=$?
                echo "EXIT CODE: $FFMPEG_EXIT_CODE"
            } >> "$LOG_FILE"
            
            if [ $FFMPEG_EXIT_CODE -ne 0 ]; then
                echo "Warning: Failed to process $video_path (See $LOG_FILE for details)"
            fi
        fi
    fi
done

# 3. Save
cp "$INPUT_JSON_FILE" "${INPUT_JSON_FILE%.json}_backup_$(date +%s).json"
echo "$updated_json" > "$OUTPUT_JSON_FILE"
echo "Done. Processed videos from $INPUT_JSON_FILE"
echo "Log file saved to: $LOG_FILE"
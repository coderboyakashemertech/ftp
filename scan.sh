#!/bin/bash

# Usage:
# ./scan_media_to_json.sh /path/to/media output.json

ROOT="$1"
OUTPUT="$2"

if [ -z "$ROOT" ] || [ -z "$OUTPUT" ]; then
    echo "Usage: $0 <root_folder> <output.json>"
    exit 1
fi

if [ ! -d "$ROOT" ]; then
    echo "Directory does not exist"
    exit 1
fi

echo "{" > "$OUTPUT"
echo "  \"folders\": [" >> "$OUTPUT"

first_folder=true

find "$ROOT" -type f \( \
-iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o \
-iname "*.gif" -o -iname "*.bmp" -o -iname "*.webp" -o \
-iname "*.tiff" -o -iname "*.mp4" \
\) -printf '%h\n' | sort -u | while read folder
do

    files=$(find "$folder" -maxdepth 1 -type f \( \
    -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o \
    -iname "*.gif" -o -iname "*.bmp" -o -iname "*.webp" -o \
    -iname "*.tiff" -o -iname "*.mp4" \
    \))

    count=$(echo "$files" | wc -l)

    if [ "$count" -eq 0 ]; then
        continue
    fi

    folder_name=$(basename "$folder")

    if [ "$first_folder" = true ]; then
        first_folder=false
    else
        echo "," >> "$OUTPUT"
    fi

    echo "    {" >> "$OUTPUT"
    echo "      \"folder_name\": \"$folder_name\"," >> "$OUTPUT"
    echo "      \"folder_path\": \"$folder\"," >> "$OUTPUT"
    echo "      \"file_count\": $count," >> "$OUTPUT"
    echo "      \"files\": [" >> "$OUTPUT"

    first_file=true

    while read file
    do
        name=$(basename "$file")

        if [ "$first_file" = true ]; then
            first_file=false
        else
            echo "," >> "$OUTPUT"
        fi

        echo -n "        {\"name\":\"$name\",\"path\":\"$file\"}" >> "$OUTPUT"

    done <<< "$files"

    echo "" >> "$OUTPUT"
    echo "      ]" >> "$OUTPUT"
    echo -n "    }" >> "$OUTPUT"

done

echo "" >> "$OUTPUT"
echo "  ]" >> "$OUTPUT"
echo "}" >> "$OUTPUT"

echo "JSON saved to $OUTPUT"
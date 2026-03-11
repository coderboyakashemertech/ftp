#!/bin/bash

# Define the root folder where the thumbnails will be saved
THUMBNAIL_FOLDER="/home/coderboy/projects/ftp/api/thumbnails"

# Input JSON file and output JSON file
INPUT_JSON="/home/coderboy/projects/ftp/api/gallery.json"
OUTPUT_JSON="/home/coderboy/projects/ftp/api/gallery2.json"

# Temporary file to hold updated JSON
TEMP_JSON="/tmp/updated_json.tmp"

# Function to generate a thumbnail for a video file
generate_thumbnail() {
    local video_path=$1
    local thumbnail_folder=$2
    local video_filename=$(basename "$video_path")
    local thumbnail_filename="${video_filename%.*}_thumb.jpg"
    local thumbnail_path="$thumbnail_folder/$thumbnail_filename"

    # Generate a thumbnail using FFmpeg (capture first frame after 1 second)
    ffmpeg -i "$video_path" -ss 00:00:01 -vframes 1 "$thumbnail_path" 2>/dev/null

    # Return the thumbnail path
    echo "$thumbnail_path"
}

# Process JSON to find video files and update thumbnails
process_json() {
    jq -r '.folders[].files[] | select(.mimetype | contains("video")) | .path' "$INPUT_JSON" | while read video_path; do
        # Generate thumbnail for each video
        thumbnail_path=$(generate_thumbnail "$video_path" "$THUMBNAIL_FOLDER")

        # Use jq to update the thumbnail path in the JSON
        jq --arg video_path "$video_path" --arg thumbnail_path "$thumbnail_path" \
           '(.folders[].files[] | select(.path == $video_path)) |= . + {thumbnail: $thumbnail_path}' \
           "$INPUT_JSON" > "$TEMP_JSON" && mv "$TEMP_JSON" "$INPUT_JSON"
    done
}

# Run the script to process the JSON and update it
process_json

# Copy the updated JSON to the output file
cp "$INPUT_JSON" "$OUTPUT_JSON"

echo "Thumbnails have been generated and JSON updated successfully."
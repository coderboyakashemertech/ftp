const express = require("express");
const fs = require("fs");
const path = require("path");
const { getDrives, ROOT_DIR_DEFAULT } = require("../utils/drives");
const fsPromises = require("fs").promises;

const router = express.Router();

const MEDIA_EXTENSIONS = new Set([
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", // Images
    ".mp4", ".mov", ".webm", ".avi", ".mkv"         // Videos
]);


/**
 * Helper function to recursively find all media files in a directory.
 */
async function findMediaFiles(dir, rootDir, driveName, resultList, visited = new Set(), depth = 0, context = { count: 0, maxFiles: 1000, startTime: Date.now() }) {
    // Limits to prevent freezing / infinite loops
    if (depth > 8) return;
    if (context.count >= context.maxFiles) return;
    if (Date.now() - context.startTime > 15000) return; // 15 seconds max total time

    try {
        const realDir = await fsPromises.realpath(dir).catch(() => null);
        if (!realDir || visited.has(realDir)) return;
        visited.add(realDir);

        const files = await fsPromises.readdir(dir, { withFileTypes: true }).catch(() => []);

        for (const file of files) {
            if (context.count >= context.maxFiles) break;
            if (Date.now() - context.startTime > 15000) break;

            if (file.name.startsWith(".") || file.name === "node_modules") continue;

            const filePath = path.join(dir, file.name);

            if (file.isDirectory()) {
                await findMediaFiles(filePath, rootDir, driveName, resultList, visited, depth + 1, context);
            } else if (file.isFile()) {
                const ext = path.extname(file.name).toLowerCase();
                if (MEDIA_EXTENSIONS.has(ext)) {
                    try {
                        const stat = await fsPromises.stat(filePath);
                        const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
                        // Use empty string for root directory to avoid "." 
                        let folderPath = path.dirname(relativePath).replace(/\\/g, '/');
                        if (folderPath === '.') folderPath = '';

                        resultList.push({
                            name: file.name,
                            path: relativePath,
                            folderPath: folderPath,
                            drive: driveName,
                            extension: ext,
                            size: stat.size,
                            modifiedAt: stat.mtime.toISOString(),
                        });
                        context.count++;
                    } catch (err) {
                        // Ignore
                    }
                }
            }
        }
    } catch (err) {
        console.error(`[GALLERY] Error reading directory ${dir}:`, err.message);
    }
}

/**
 * GET /api/gallery
 * Returns images/videos from the selected drive.
 * Query Params:
 *   - drive (optional): the name of the drive
 */
router.get("/", async (req, res) => {
    try {
        const drives = getDrives();
        const resolvedDrives = (drives || []).map(d => ({
            name: d.name,
            absPath: d.path ? path.resolve(d.path) : null
        })).filter(d => d.absPath);

        const mediaFiles = [];
        const galleryJsonPath = path.join(__dirname, "../../gallery.json");

        if (fs.existsSync(galleryJsonPath)) {
            const data = JSON.parse(await fsPromises.readFile(galleryJsonPath, "utf8"));

            const folders = Array.isArray(data) ? data : (data.folders || []);

            for (const folderObj of folders) {
                if (!folderObj || typeof folderObj !== 'object') continue;

                const files = folderObj.files || folderObj.images || [];
                if (!Array.isArray(files)) continue;

                for (const img of files) {
                    if (!img || !img.path || !img.name) continue;

                    const absPath = img.path;
                    let matchedDrive = null;
                    let rootDirForMatched = null;

                    for (const d of resolvedDrives) {
                        if (absPath.startsWith(d.absPath)) {
                            if (!matchedDrive || d.absPath.length > rootDirForMatched.length) {
                                matchedDrive = d.name;
                                rootDirForMatched = d.absPath;
                            }
                        }
                    }

                    if (!matchedDrive) continue;

                    try {
                        const relativePath = path.relative(rootDirForMatched, absPath).replace(/\\/g, '/');
                        let folderPath = path.dirname(relativePath).replace(/\\/g, '/');
                        if (folderPath === '.') folderPath = '';

                        const ext = path.extname(img.name).toLowerCase();

                        let thumbRelPath = null;
                        if (img.thumbnail && typeof img.thumbnail === 'string' && img.thumbnail.trim() !== "") {
                            try {
                                thumbRelPath = path.relative(rootDirForMatched, img.thumbnail).replace(/\\/g, '/');
                            } catch (e) {
                                // Ignore
                            }
                        }

                        mediaFiles.push({
                            name: img.name,
                            path: relativePath,
                            folderPath: folderPath,
                            folderName: folderObj.folder_name || path.basename(folderPath) || "Root",
                            drive: matchedDrive,
                            extension: ext,
                            size: img.size || 0,
                            absPath: absPath,
                            thumbnail: thumbRelPath,
                            modifiedAt: img.date ? new Date(img.date * 1000).toISOString() : new Date().toISOString()
                        });
                    } catch (err) {
                        // Skip individual malformed paths
                    }
                }
            }
        }

        const { folderPath, page, limit } = req.query;
        const pageInt = parseInt(page) || 1;
        const limitInt = parseInt(limit) || 50;
        const startIndex = (pageInt - 1) * limitInt;
        const endIndex = pageInt * limitInt;

        // 1. Gather all folders for the frontend to show the folder list
        const foldersMap = new Map();
        mediaFiles.forEach(file => {
            const fPath = file.folderPath ? `/${file.folderPath}` : "/";
            if (!foldersMap.has(fPath)) {
                // Create a clone of the preview to safely delete absPath later or modify it
                const previewClone = { ...file };
                delete previewClone.absPath;
                foldersMap.set(fPath, {
                    name: file.folderName || fPath,
                    path: fPath,
                    count: 1,
                    preview: previewClone
                });
            } else {
                const folderData = foldersMap.get(fPath);
                folderData.count++;
                // If the current preview doesn't have a thumbnail, but this file does, swap it out
                if (!folderData.preview.thumbnail && file.thumbnail) {
                    const previewClone = { ...file };
                    delete previewClone.absPath;
                    folderData.preview = previewClone;
                }
            }
        });

        // 2. Filter files by folder if requested
        let filteredFiles = mediaFiles;
        if (folderPath) {
            filteredFiles = mediaFiles.filter(file => {
                const fPath = file.folderPath ? `/${file.folderPath}` : "/";
                return fPath === folderPath;
            });
        }

        const total = filteredFiles.length;
        const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

        for (const file of paginatedFiles) {
            // Remove absPath from response to keep it clean
            delete file.absPath;
        }

        res.json({
            files: paginatedFiles,
            folders: Array.from(foldersMap.values()),
            total,
            page: pageInt,
            limit: limitInt,
            totalPages: Math.ceil(total / limitInt)
        });
    } catch (err) {
        console.error("[GALLERY] Error generating gallery:", err);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
});

module.exports = router;

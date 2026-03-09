const express = require("express");
const fs = require("fs");
const path = require("path");
const { resolveRootDir } = require("../utils/drives");

const router = express.Router();

const MEDIA_EXTENSIONS = new Set([
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", // Images
    ".mp4", ".mov", ".webm", ".avi", ".mkv"         // Videos
]);

const fsPromises = require("fs").promises;

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
        const { getDrives, ROOT_DIR_DEFAULT } = require("../utils/drives");
        const drives = getDrives();
        const resolvedDrives = drives.map(d => ({ name: d.name, absPath: path.resolve(d.path) }));

        const mediaFiles = [];
        const galleryJsonPath = path.join(__dirname, "../../gallery.json");

        if (fs.existsSync(galleryJsonPath)) {
            const data = JSON.parse(await fsPromises.readFile(galleryJsonPath, "utf8"));

            const folders = Array.isArray(data) ? data : (data.folders || []);

            for (const folderObj of folders) {
                for (const img of folderObj.files || folderObj.images || []) {
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

                    if (!matchedDrive) {
                        continue;
                    }

                    const relativePath = path.relative(rootDirForMatched, absPath).replace(/\\/g, '/');
                    let folderPath = path.dirname(relativePath).replace(/\\/g, '/');
                    if (folderPath === '.') folderPath = '';

                    const ext = path.extname(img.name).toLowerCase();

                    mediaFiles.push({
                        name: img.name,
                        path: relativePath,
                        folderPath: folderPath,
                        folderName: folderObj.folder_name || path.basename(folderPath) || "Root",
                        drive: matchedDrive,
                        extension: ext,
                        size: 0,
                        modifiedAt: new Date().toISOString()
                    });
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
                foldersMap.set(fPath, {
                    name: file.folderName || fPath,
                    path: fPath,
                    count: 1,
                    preview: file
                });
            } else {
                foldersMap.get(fPath).count++;
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
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

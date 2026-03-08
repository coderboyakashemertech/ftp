const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const ROOT_DIR = path.resolve(process.env.ROOT_DIR || "./files");

/**
 * GET /api/files
 * Query Params:
 *   - path (optional): relative sub-path inside ROOT_DIR
 *
 * Response:
 *   { path, files: [{ name, size, extension, modifiedAt }] }
 */
router.get("/", (req, res) => {
    try {
        const relativePath = req.query.path || "";
        const targetDir = path.resolve(ROOT_DIR, relativePath);

        // Path traversal protection
        if (!targetDir.startsWith(ROOT_DIR)) {
            return res.status(403).json({
                error: "Forbidden: Access outside the root directory is not allowed.",
            });
        }

        if (!fs.existsSync(targetDir)) {
            return res.status(404).json({
                error: `Directory not found: ${relativePath || "/"}`,
            });
        }

        const stat = fs.statSync(targetDir);
        if (!stat.isDirectory()) {
            return res.status(400).json({
                error: `Path is not a directory: ${relativePath}`,
            });
        }

        const entries = fs.readdirSync(targetDir, { withFileTypes: true });

        const files = entries
            .filter((entry) => entry.isFile())
            .map((entry) => {
                const fileStat = fs.statSync(path.join(targetDir, entry.name));
                return {
                    name: entry.name,
                    extension: path.extname(entry.name).slice(1) || null,
                    size: fileStat.size,
                    modifiedAt: fileStat.mtime,
                };
            });

        return res.json({
            path: relativePath ? `/${relativePath}` : "/",
            files,
        });
    } catch (err) {
        console.error("Error listing files:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/files/serve
 * Query Params:
 *   - path: relative path to the file inside ROOT_DIR (e.g. "Movies/clip.mp4")
 *
 * Streams the file with proper Content-Type, supports Range requests for video.
 */
router.get("/serve", (req, res) => {
    try {
        const relativePath = req.query.path || "";
        if (!relativePath) {
            return res.status(400).json({ error: "Missing 'path' query parameter" });
        }

        const targetFile = path.resolve(ROOT_DIR, relativePath);

        // Path traversal protection
        if (!targetFile.startsWith(ROOT_DIR)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!fs.existsSync(targetFile)) {
            return res.status(404).json({ error: "File not found" });
        }

        const stat = fs.statSync(targetFile);
        if (!stat.isFile()) {
            return res.status(400).json({ error: "Not a file" });
        }

        // Determine MIME type from extension
        const ext = path.extname(targetFile).slice(1).toLowerCase();
        const MIME_MAP = {
            // images
            jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
            gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
            bmp: "image/bmp", ico: "image/x-icon", avif: "image/avif",
            tiff: "image/tiff",
            // videos
            mp4: "video/mp4", webm: "video/webm", ogg: "video/ogg",
            mov: "video/quicktime", avi: "video/x-msvideo",
            mkv: "video/x-matroska", m4v: "video/x-m4v",
            flv: "video/x-flv", wmv: "video/x-ms-wmv",
        };
        const contentType = MIME_MAP[ext] || "application/octet-stream";

        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            // Handle byte-range for video seeking
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize,
                "Content-Type": contentType,
            });
            fs.createReadStream(targetFile, { start, end }).pipe(res);
        } else {
            res.writeHead(200, {
                "Content-Length": fileSize,
                "Content-Type": contentType,
                "Accept-Ranges": "bytes",
            });
            fs.createReadStream(targetFile).pipe(res);
        }
    } catch (err) {
        console.error("Error serving file:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/files/download
 * Query Params:
 *   - path: relative path to the file inside ROOT_DIR
 */
router.get("/download", (req, res) => {
    try {
        const relativePath = req.query.path || "";
        if (!relativePath) {
            return res.status(400).json({ error: "Missing 'path' query parameter" });
        }

        const targetFile = path.resolve(ROOT_DIR, relativePath);

        // Path traversal protection
        if (!targetFile.startsWith(ROOT_DIR)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!fs.existsSync(targetFile)) {
            return res.status(404).json({ error: "File not found" });
        }

        const stat = fs.statSync(targetFile);
        if (!stat.isFile()) {
            return res.status(400).json({ error: "Not a file" });
        }

        // res.download() sets Content-Disposition to "attachment"
        res.download(targetFile, path.basename(targetFile), (err) => {
            if (err) {
                console.error("Download failed:", err);
                if (!res.headersSent) {
                    res.status(500).json({ error: "Download failed" });
                }
            }
        });
    } catch (err) {
        console.error("Error downloading file:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

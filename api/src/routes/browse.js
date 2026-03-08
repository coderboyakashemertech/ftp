const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const ROOT_DIR_DEFAULT = path.resolve(process.env.ROOT_DIR || "./files");
const { getDrives, resolveRootDir } = require("../utils/drives");

/**
 * GET /api/browse/drives
 * Returns the list of available drives.
 */
router.get("/drives", (req, res) => {
    const drives = getDrives();
    res.json(drives);
});

/**
 * GET /api/browse
 * Query Params:
 *   - path (optional): relative sub-path inside the drive root
 *   - drive (optional): the name of the drive (from drives.json)
 *
 * Response:
 *   { path, folders: string[], files: [{ name, extension, size, modifiedAt }] }
 */
router.get("/", (req, res) => {
    try {
        const relativePath = req.query.path || "";
        const driveName = req.query.drive;

        const rootDir = resolveRootDir(driveName);
        const targetDir = path.resolve(rootDir, relativePath);

        // Path traversal protection
        if (!targetDir.startsWith(rootDir)) {
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

        const folders = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);

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
            folders,
            files,
        });
    } catch (err) {
        console.error("Error browsing directory:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

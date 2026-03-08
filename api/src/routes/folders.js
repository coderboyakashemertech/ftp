const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Resolve the root directory from env (absolute or relative to project root)
const ROOT_DIR = path.resolve(process.env.ROOT_DIR || "./files");

/**
 * GET /api/folders
 * Query Params:
 *   - path (optional): relative sub-path inside ROOT_DIR to list folders in
 *
 * Response:
 *   { path: string, folders: string[] }
 */
router.get("/", (req, res) => {
    try {
        const relativePath = req.query.path || "";

        // Resolve the target directory safely
        const targetDir = path.resolve(ROOT_DIR, relativePath);

        // --- Path Traversal Protection ---
        // Ensure the resolved path is still within ROOT_DIR
        if (!targetDir.startsWith(ROOT_DIR)) {
            return res.status(403).json({
                error: "Forbidden: Access outside the root directory is not allowed.",
            });
        }

        // Check if the target directory exists
        if (!fs.existsSync(targetDir)) {
            return res.status(404).json({
                error: `Directory not found: ${relativePath || "/"}`,
            });
        }

        // Check if it is actually a directory
        const stat = fs.statSync(targetDir);
        if (!stat.isDirectory()) {
            return res.status(400).json({
                error: `Path is not a directory: ${relativePath}`,
            });
        }

        // Read directory contents and filter only subdirectories
        const entries = fs.readdirSync(targetDir, { withFileTypes: true });
        const folders = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);

        return res.json({
            path: relativePath ? `/${relativePath}` : "/",
            rootDir: ROOT_DIR,
            folders,
        });
    } catch (err) {
        console.error("Error listing folders:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

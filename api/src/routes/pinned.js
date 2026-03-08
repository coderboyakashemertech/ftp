const express = require("express");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * GET /api/pinned
 * Returns all pinned folders for the authenticated user.
 */
router.get("/", authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const pinned = db.prepare("SELECT * FROM pinned_folders WHERE user_id = ? ORDER BY created_at DESC").all(userId);
        res.json(pinned);
    } catch (err) {
        console.error("Error fetching pinned folders:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * POST /api/pinned
 * Adds a new pinned folder.
 */
router.post("/", authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const { name, path, drive } = req.body;

        if (!name || !path) {
            return res.status(400).json({ error: "Name and path are required" });
        }

        // Avoid duplicates for the same user, path, and drive
        const existing = db.prepare("SELECT * FROM pinned_folders WHERE user_id = ? AND path = ? AND drive = ?")
            .get(userId, path, drive || null);

        if (existing) {
            return res.status(400).json({ error: "Folder already pinned" });
        }

        const info = db.prepare("INSERT INTO pinned_folders (user_id, name, path, drive) VALUES (?, ?, ?, ?)")
            .run(userId, name, path, drive || null);

        res.status(201).json({ id: info.lastInsertRowid, name, path, drive });
    } catch (err) {
        console.error("Error adding pinned folder:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * DELETE /api/pinned/:id
 * Removes a pinned folder.
 */
router.delete("/:id", authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const pinnedId = req.params.id;

        const info = db.prepare("DELETE FROM pinned_folders WHERE id = ? AND user_id = ?").run(pinnedId, userId);

        if (info.changes === 0) {
            return res.status(404).json({ error: "Pinned folder not found or unauthorized" });
        }

        res.json({ message: "Pinned folder removed" });
    } catch (err) {
        console.error("Error removing pinned folder:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * DELETE /api/pinned/path
 * Removes a pinned folder by its path and drive (useful for the toggle in UI).
 */
router.delete("/", authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const { path, drive } = req.body;

        if (!path) {
            return res.status(400).json({ error: "Path is required" });
        }

        const info = db.prepare("DELETE FROM pinned_folders WHERE user_id = ? AND path = ? AND drive = ?")
            .run(userId, path, drive || null);

        if (info.changes === 0) {
            return res.status(404).json({ error: "Pinned folder not found" });
        }

        res.json({ message: "Pinned folder removed" });
    } catch (err) {
        console.error("Error removing pinned folder by path:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

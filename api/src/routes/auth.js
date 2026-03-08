const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otplib = require("otplib");
const qrcode = require("qrcode");
const db = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "yoursecretkeyhere";

// Register
router.post("/register", async (req, res) => {
    const { username, password, name, email } = req.body;

    if (!username || !password || !name || !email) {
        return res.status(400).json({ error: "All fields (name, email, username, password) are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const insert = db.prepare("INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)");
        insert.run(username, hashedPassword, name, email);
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        if (err.code === "SQLITE_CONSTRAINT") {
            return res.status(400).json({ error: "Username already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to register user" });
    }
});

// Login (Step 1: Password)
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        // Use COLLATE NOCASE for case-insensitive lookup
        const user = db.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE").get(username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // If 2FA not enabled, generate secret for setup
        if (!user.two_factor_enabled) {
            let secret = user.two_factor_secret;
            if (!secret) {
                secret = otplib.generateSecret();
                db.prepare("UPDATE users SET two_factor_secret = ? WHERE id = ?").run(secret, user.id);
            }

            const otpauth = otplib.generateURI({ label: user.username, issuer: "FTP Drive", secret: secret });
            const qrCodeUrl = await qrcode.toDataURL(otpauth);

            return res.json({
                two_factor_required: true,
                setup_required: true,
                username: user.username, // Send back the correctly cased username
                qrCode: qrCodeUrl,
                secret: secret
            });
        }

        // 2FA is enabled, just require the code
        res.json({
            two_factor_required: true,
            setup_required: false,
            username: user.username
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Failed to login" });
    }
});

// Verify 2FA and Issue JWT
router.post("/2fa/verify", async (req, res) => {
    const { username, code } = req.body;

    if (!username || !code) {
        return res.status(400).json({ error: "Username and 2FA code are required" });
    }

    try {
        const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
        if (!user || !user.two_factor_secret) {
            return res.status(401).json({ error: "Invalid session" });
        }

        const isValid = otplib.verifySync({ token: code, secret: user.two_factor_secret });
        if (!isValid) {
            return res.status(401).json({ error: "Invalid 2FA code" });
        }

        // If it was first time setup, enable it now
        if (!user.two_factor_enabled) {
            db.prepare("UPDATE users SET two_factor_enabled = 1 WHERE id = ?").run(user.id);
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
            expiresIn: "24h",
        });

        res.json({ token, username: user.username, name: user.name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Verification failed" });
    }
});

module.exports = router;

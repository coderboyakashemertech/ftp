require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRouter = require("./src/routes/auth");
const foldersRouter = require("./src/routes/folders");
const filesRouter = require("./src/routes/files");
const browseRouter = require("./src/routes/browse");
const galleryRouter = require("./src/routes/gallery");
const userRouter = require("./src/routes/user");
const pinnedRouter = require("./src/routes/pinned");
const authenticateToken = require("./src/middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);

// Protected Routes (require auth)
app.use("/api/folders", authenticateToken, foldersRouter);
app.use("/api/files", authenticateToken, filesRouter);
app.use("/api/browse", authenticateToken, browseRouter);
app.use("/api/gallery", authenticateToken, galleryRouter);
app.use("/api/user", userRouter);
app.use("/api/pinned", authenticateToken, pinnedRouter);

// Serve static files from the root directory
// NOTE: Ideally, static files should also be protected or served via a route that checks auth
app.use("/api/static", express.static(process.env.ROOT_DIR || "./files"));


// Health check
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "FTP Folder Browser API is running" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`ROOT_DIR: ${process.env.ROOT_DIR || "./files"}`);
});

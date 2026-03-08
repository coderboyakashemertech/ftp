require("dotenv").config();
const express = require("express");
const cors = require("cors");
const foldersRouter = require("./src/routes/folders");
const filesRouter = require("./src/routes/files");
const browseRouter = require("./src/routes/browse");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/folders", foldersRouter);
app.use("/api/files", filesRouter);
app.use("/api/browse", browseRouter);

// Serve static files from the root directory so the UI can fetch images
app.use("/api/static", express.static(process.env.ROOT_DIR || "./files"));

// Health check
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "FTP Folder Browser API is running" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`ROOT_DIR: ${process.env.ROOT_DIR || "./files"}`);
});

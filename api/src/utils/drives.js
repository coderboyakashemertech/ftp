const fs = require("fs");
const path = require("path");

const ROOT_DIR_DEFAULT = path.resolve(process.env.ROOT_DIR || "./files");
const DRIVES_PATH = path.join(__dirname, "../../drives.json");

function getDrives() {
    try {
        if (fs.existsSync(DRIVES_PATH)) {
            return JSON.parse(fs.readFileSync(DRIVES_PATH, "utf8"));
        }
    } catch (err) {
        console.error("Error reading drives.json:", err);
    }
    return [];
}

function resolveRootDir(driveName) {
    if (!driveName) return ROOT_DIR_DEFAULT;

    const drives = getDrives();
    const selectedDrive = drives.find(d => d.name === driveName);
    if (selectedDrive) {
        return path.resolve(selectedDrive.path);
    }

    return ROOT_DIR_DEFAULT;
}

module.exports = {
    getDrives,
    resolveRootDir,
    ROOT_DIR_DEFAULT
};

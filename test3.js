const req = { query: { folderPath: '/$RECYCLE.BIN/S-1-5-21-3992176829-416311048-2800814239-1001/$R2OJY76/Videos' } };
const path = require('path');
const fs = require('fs');

const data = require('./api/gallery.json');
const mediaFiles = [];

const resolvedDrives = [{ name: 'Seagate 2TB', absPath: '/mnt/seagate-2tb' }];

for (const folderObj of data.folders) {
    const files = folderObj.files || folderObj.images || [];
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

        const relativePath = path.relative(rootDirForMatched, absPath).replace(/\\/g, '/');
        let folderPath = path.dirname(relativePath).replace(/\\/g, '/');
        if (folderPath === '.') folderPath = '';

        let thumbRelPath = null;
        if (img.thumbnail && typeof img.thumbnail === 'string' && img.thumbnail.trim() !== "") {
            thumbRelPath = path.relative(rootDirForMatched, img.thumbnail).replace(/\\/g, '/');
        }

        mediaFiles.push({
            name: img.name,
            folderPath: folderPath,
            thumbnail: thumbRelPath,
            drive: matchedDrive
        });
    }
}

// 2. Filter files by folder if requested
let filteredFiles = mediaFiles;
if (req.query.folderPath) {
    filteredFiles = mediaFiles.filter(file => {
        const fPath = file.folderPath ? `/${file.folderPath}` : "/";
        return fPath === req.query.folderPath;
    });
}

console.log(`Matched files count: ${filteredFiles.length}`);
if (filteredFiles.length > 0) {
    console.log(`First file: name=${filteredFiles[0].name}, folderPath=${filteredFiles[0].folderPath}, thumbnail=${filteredFiles[0].thumbnail}`);
} else {
    // try to find what folderPath the files actually got!
    const example = mediaFiles.find(f => f.name === '20220504_223752.mp4');
    console.log("Example file folderPath was instead:", example ? (example.folderPath ? `/${example.folderPath}` : "/") : "Not found!");
}

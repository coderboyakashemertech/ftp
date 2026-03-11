const fs = require('fs');
const path = require('path');
const data = require('./api/gallery.json');

const drives = [{ name: 'Seagate 2TB', absPath: '/mnt/seagate-2tb' }];

for (const folderObj of data.folders) {
    if (folderObj.folder_path && folderObj.folder_path.includes('$R2OJY76/Videos')) {
        for (const img of folderObj.files) {
            if (img.thumbnail) {
                const absPath = img.path;
                let matchedDrive = 'Seagate 2TB';
                let rootDirForMatched = '/mnt/seagate-2tb';
                
                const relativePath = path.relative(rootDirForMatched, absPath).replace(/\\/g, '/');
                let thumbRelPath = null;
                if (img.thumbnail && typeof img.thumbnail === 'string' && img.thumbnail.trim() !== "") {
                    try {
                        thumbRelPath = path.relative(rootDirForMatched, img.thumbnail).replace(/\\/g, '/');
                    } catch (e) {
                        // Ignore
                    }
                }
                
                console.log(JSON.stringify({
                    name: img.name,
                    path: relativePath,
                    thumbnail: thumbRelPath,
                    origThumb: img.thumbnail
                }, null, 2));
                break;
            }
        }
        break;
    }
}

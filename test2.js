const d = require('./api/gallery.json');
const folder = d.folders.find(f => f.folder_path && f.folder_path.includes('$R2OJY76/Videos'));
if(folder) {
  const vids = folder.files.filter(f => f.thumbnail);
  if(vids.length > 0) {
    console.log("Found thumbnail for:", vids[0].name);
    console.log("Thumbnail:", vids[0].thumbnail);
  } else {
    console.log("Found folder but no thumbnails inside.");
  }
} else {
  console.log("Folder not found.");
}

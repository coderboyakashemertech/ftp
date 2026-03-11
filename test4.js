const http = require('http');
// Need a valid token. Let's see if we can just register or login ? No, let's just use the router directly !
const express = require('express');
const galleryRouter = require('./api/src/routes/gallery');

const app = express();
app.use(express.static('.'));

app.use('/api/gallery', galleryRouter); // bypass auth

const server = app.listen(0, async () => {
    const port = server.address().port;
    const url = `http://localhost:${port}/api/gallery?page=1&limit=50&folderPath=/%24RECYCLE.BIN/S-1-5-21-3992176829-416311048-2800814239-1001/%24R2OJY76/Videos`;
    
    const res = await fetch(url);
    const json = await res.json();
    console.log(JSON.stringify(json.files[0], null, 2));
    server.close();
});

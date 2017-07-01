const express = require('express');
const path = require('path');
const databases = require('./app/scripts/databases.js');

let app = express();

let isProduction = process.env.NODE_ENV === 'production';
let port = isProduction ? process.env.PORT : 3000;
let publicPath = path.resolve(__dirname, 'dist');

let getTrack = id => databases.tracks.get(id);
let getArtist = id => databases.artists.get(id);
let getAlbum = id => databases.albums.get(id);

// We only want to run the workflow when not in production
if (!isProduction) {
  let bundle = require('./server/bundle.js');
  bundle();
}

app.get('/', (req, res) =>
{
    res.sendFile(path.resolve(publicPath, 'index.html'));
});

app.get('/script', (req, res) =>
{
    res.sendFile(path.resolve(publicPath, 'build.js'));
});

app.get('/track/:id', (req, res, next) =>
{
    getTrack(req.params.id).then(track =>
    {
        // TODO: Use template for showing track page
        res.send(
            `<h1>${track.name}</h1>
            <audio controls="controls" src="/play/${track._id}"></audio>`
        );
    });
});

app.get('/play/:id', (req, res) =>
{
    getTrack(req.params.id).then(file =>
    {
        res.sendFile(file.location);
    });
});

app.listen(port, function () {
  console.log('Server running on port ' + port);
});

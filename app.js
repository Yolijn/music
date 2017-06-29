const express = require('express');
const databases = require('./scripts/databases.js');

let app = express();
let getTrack = id => databases.tracks.get(id);
let getArtist = id => databases.artists.get(id);
let getAlbum = id => databases.albums.get(id);

app.get('/', (req, res) =>
{
    res.sendFile(__dirname + '/dist/index.html');
});

app.get('/script', (req, res) =>
{
    res.sendFile(__dirname + '/dist/client.js')
})

app.get('/track/:id', (req, res, next) =>
{
    getTrack(req.params.id).then(track =>
    {
        res.send(
            `<h1>${track.name}</h1>
            <audio controls="controls" src="/play/${track._id}"></audio>`
        );
    })
});

app.get('/play/:id', (req, res) =>
{
    getTrack(req.params.id).then(file =>
    {
        res.sendFile(file.location)
    })
});

app.listen(3000);

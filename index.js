const express = require('express');
const path = require('path');
const data = require('./mock.json');

let app = express();

// app.use('/play', express.static(data.root));

app.get('/play/:id', (req, res) =>
{
    let track = data.tracks[req.params.id];
    let file = path.resolve(data.root, track.path);

    res.sendFile(file);
});

app.get('/', (req, res) =>
{
    res.sendFile(__dirname + '/index.html');
});

app.get('/track/:id', (req, res, next) =>
{
    let track = data.tracks[req.params.id];

    res.send(
        `<h1>${track.title}</h1>
        <audio controls="controls" src="/play/${track._id}"></audio>`
    );
});

app.listen(3000);

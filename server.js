const express = require('express');
const path = require('path');
const httpProxy = require('http-proxy');
const databases = require('./app/scripts/databases.js');

let proxy = httpProxy.createProxyServer();
let app = express();

let isProduction = process.env.NODE_ENV === 'production';
let port = isProduction ? process.env.PORT : 3000;
let publicPath = path.resolve(__dirname, 'dist');

let getTrack = id => databases.tracks.get(id);
let getArtist = id => databases.artists.get(id);
let getAlbum = id => databases.albums.get(id);

// We only want to run the workflow when not in production
if (!isProduction) {

  // We require the bundler inside the if block because
  // it is only needed in a development environment. Later
  // you will see why this is a good idea
  let bundle = require('./server/bundle.js');
  bundle();

  // Any requests to localhost:3000/build is proxied
  // to webpack-dev-server
  app.all('/build/*', (req, res) =>
  {
      proxy.web(req, res, {
          target: 'http://localhost:8080'
      });
  });
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

// It is important to catch any errors from the proxy or the
// server will crash. An example of this is connecting to the
// server when webpack is bundling
proxy.on('error', function(e) {
  console.log('Could not connect to proxy, please try again...');
});

app.listen(port, function () {
  console.log('Server running on port ' + port);
});

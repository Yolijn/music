const Database = require('./Database.js');

exports.tracks = new Database('tracks');
exports.artists = new Database('artists');
exports.albums = new Database('albums');

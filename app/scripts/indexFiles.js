const path = require('path');
const Queue = require('promise-queue');
const gfs = require('graceful-fs');

const { log, handleError } = require('./helperfn.js');
const { AUDIO_REGEXP, MAX_FOLDER_REQUESTS, MAX_DATA_REQUESTS, MAX_QUEUE, rootDirs } = require('../config.json');
const { tracks, artists, albums } = require('./databases.js');
const { getAllMetadata } = require('./getAllMetadata.js');

const audioRegexp = new RegExp(AUDIO_REGEXP, 'i');

// Create folderQueue FIFO queue with callback function
const folderQueue = new Queue(MAX_FOLDER_REQUESTS, MAX_QUEUE);
const musicQueue = new Queue(MAX_DATA_REQUESTS, MAX_QUEUE);

// TODO: Get root paths from CouchDB config database
let roots = rootDirs.map(root => path.resolve(path.normalize(root)));

/** */
function readDir(dirPath)
{
    log('processing started', dirPath);

    gfs.readdir(dirPath, function (err, contents)
    {
        let contentPaths = contents.map(item => path.join(dirPath, item));
        let folders = contentPaths.filter(content => gfs.statSync(content).isDirectory());
        let files = contentPaths.filter(content => gfs.statSync(content).isFile());
        let musicFiles = files.filter(content => audioRegexp.test(content));

        handleError(err);

        folders.map(handleFolder);
        musicFiles.map(handleMusicFile);
    });
}

/** */
function handleFolder(folderPath)
{
    folderQueue.add(() => readDir(folderPath))
        .catch(handleError);
}

/** */
function handleMusicFile(filePath)
{
    musicQueue.add(() => getAllMetadata(filePath))
        .then(saveMusicData, handleError)
        .catch(handleError);
}

/** */
function saveMusicData(data)
{
    // console.log(data);
    tracks.save(data.track);
    albums.save(data.album);

    data.artists.forEach(artist => artists.save(artist));
}

roots.forEach(handleFolder);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

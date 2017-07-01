const path = require('path');
const createQueue = require('concurrent-queue');
const gfs = require('graceful-fs');

const { log, handleError, responseToPromise } = require('./helperfn.js');
const { AUDIO_REGEXP, rootDirs } = require('../config.json');
const { tracks, artists, albums } = require('./databases.js');
const { getTrackMetadata } = require('./getAllMetadata.js');

const audioRegexp = new RegExp(AUDIO_REGEXP, 'i');

// Create folderQueue FIFO queue with callback function
const folderQueue = createQueue();
const musicQueue = createQueue();

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
    folderQueue(folderPath)
        .then(readDir)
        .catch(handleError);
}

/** */
function handleMusicFile(filePath)
{
    musicQueue(filePath)
        .then(getTrackMetadata)
        .then(data =>
        {
            tracks.save(data);
            return data;
        });
}

roots.forEach(handleFolder);
folderQueue.process(responseToPromise);
musicQueue.process(responseToPromise);

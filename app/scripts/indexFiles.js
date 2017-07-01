const helperFunctions = require('./helperfn.js');
const config = require('../config.json');
const path = require('path');
const createQueue = require('concurrent-queue');
const gfs = require('graceful-fs');
const databases = require('./databases.js');
const getAllMetadata = require('./getAllMetadata.js');

const AUDIO_REGEXP = new RegExp(config.AUDIO_REGEXP, 'i');

// Create folderQueue FIFO queue with callback function
const folderQueue = createQueue();
const musicQueue = createQueue();

// TODO: Get root paths from CouchDB config database
let roots = config.roots.map(root => path.resolve(path.normalize(root)));

/** */
function readDir(dirPath)
{
    helperFunctions.log('processing started', dirPath);

    gfs.readdir(dirPath, function (err, contents)
    {
        let contentPaths = contents.map(item => path.join(dirPath, item));
        let folders = contentPaths.filter(content => gfs.statSync(content).isDirectory());
        let files = contentPaths.filter(content => gfs.statSync(content).isFile());
        let musicFiles = files.filter(content => AUDIO_REGEXP.test(content));

        helperFunctions.handleError(err);

        folders.map(handleFolder);
        musicFiles.map(handleMusicFile);
    });
}

/** */
function addToLibrary(track)
{
    // TODO: save tracks, albums, artists
    databases.tracks.save(track);
}

/** */
function handleFolder(folderPath)
{
    folderQueue(folderPath)
        .then(readDir)
        .catch(helperFunctions.handleError);
}

/** */
function handleMusicFile(filePath)
{
    musicQueue(filePath)
        .then(getAllMetadata)
        .then(addToLibrary);
}

roots.forEach(handleFolder);
folderQueue.process(helperFunctions.responseToPromise);
musicQueue.process(helperFunctions.responseToPromise);

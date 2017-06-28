const helperFunctions = require('./helperFunctions.js');
const config = require('./config/indexFiles.json');
const yargs = require('yargs');
const path = require('path');
const createQueue = require('concurrent-queue');
const gfs = require('graceful-fs');
const db = require('./db.js');
const getAllMetadata = require('./getAllMetadata.js');

const AUDIO_REGEXP = new RegExp(config.AUDIO_REGEXP, 'i');
const IMAGE_REGEXP = new RegExp(config.IMAGE_REGEXP, 'i');

// Create folderQueue FIFO queue with callback function
const folderQueue = createQueue();
const musicQueue = createQueue();

// TODO: Use a LIFO Stack to save and retrieve image files
let imageFilePaths = [];

let yargsConfig = {
    type:    'array',
    desc:    'Lists the path for one or more root directories',
    example: 'script --root /Users/user/Music'
};

// Use CLI arguments for root file paths
let args = yargs.option('root', yargsConfig)
                .demandOption(['root'], 'Provide root directory path(s), if a path contains whitespace: use quotes')
                .coerce(['root'], a => a.map(b => path.resolve(path.normalize(b))))
                .argv;

let roots = args.root;

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
        let imageFiles = files.filter(content => IMAGE_REGEXP.test(content));

        helperFunctions.handleError(err);

        folders.map(handleFolder);
        musicFiles.map(handleMusicFile);
        imageFiles.map(handleImageFile);
    });
}

/** */
function addToLibrary(track)
{
    db.saveTrack(track);
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

/** */
function handleImageFile(filePath)
{
    imageFilePaths.push(filePath);
}

roots.forEach(handleFolder);
folderQueue.process(helperFunctions.responseToPromise);
musicQueue.process(helperFunctions.responseToPromise);

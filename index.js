'use strict';

const config = require('./config.json');
const yargs = require('yargs');
const path = require('path');
const createQueue = require('concurrent-queue');
const gfs = require('graceful-fs');
const musicmd = require('musicmetadata');
const acoustid = require('acoustid');

const PouchDB = require('pouchdb');

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
                .coerce(['root'], a => a.map(b => path.resolve(b)))
                .argv;

let roots = args.root;

// Setup database for permanent storage of medadata
let musicDB = new PouchDB('http://127.0.0.1:5984/music_db', {
    auth: {
        username: config.DB_USER,
        password: config.DB_PASS
    }
});

/** */
function handleError(err, handlerFn)
{
    if (handlerFn && err)
    {
        handlerFn(err);
    }
    else if (err)
    {
        throw err;
    }
}

/** */
function processTask(task)
{
    return new Promise((resolve, reject) =>
    {
        resolve(task);
    });
}

/** */
function readDir(dirPath)
{
    console.log('processing started', dirPath);

    gfs.readdir(dirPath, function (err, contents)
    {
        let contentPaths = contents.map(item => path.join(dirPath, item));
        let folders = contentPaths.filter(content => gfs.statSync(content).isDirectory());
        let files = contentPaths.filter(content => gfs.statSync(content).isFile());
        let musicFiles = files.filter(content => AUDIO_REGEXP.test(content));
        let imageFiles = files.filter(content => IMAGE_REGEXP.test(content));

        handleError(err);

        folders.map(handleFolder);
        musicFiles.map(handleMusicFile);
        imageFiles.map(handleImageFile);
    });
}

/** */
function handleFolder(folderPath)
{
    folderQueue(folderPath)
        .then(readDir);
}

/** */
function handleMusicFile(filePath)
{
    musicQueue(filePath)
        .then(getMetaAcoustid)
        .then(console.log);
        // .then(addToLibrary);
}

/** */
function handleImageFile(filePath)
{
    imageFilePaths.push(filePath);
}

/** */
function getMusicMetadata(filePath)
{
    let readableStream = gfs.createReadStream(filePath);

    return new Promise((resolve, reject) =>
        musicmd(readableStream, (err, results) =>
        {
            handleError(err, reject);
            resolve(results);
            readableStream.close();
        })
    );
}

/** */
function getMetaAcoustid(filePath)
{
    return new Promise((resolve, reject) =>
        acoustid(filePath, { key: config.ACOUSTIC_API.MYMUSICPLAYER }, (err, result) =>
        {
            handleError(err, reject);

            let track = {
                file:    filePath,
                name:    result[0].recordings[0].title,
                artists: result[0].recordings[0].artists,
            };

            /*
                albumName: '',
                year: '',
                genre: '',
                track: '',
                albumArtistName: '',
            */

            resolve(track);
        })
    );
}

roots.forEach(handleFolder);
folderQueue.process(processTask);
musicQueue.process(processTask);

'use strict';

const config = require('./config.js');
const yargs = require('yargs');
const path = require('path');
const cq = require('concurrent-queue');
const gfs = require('graceful-fs');
const musicmd = require('musicmetadata');
const acoustid = require('acoustid');

const MusicLibraryIndex = require('music-library-index');
const PouchDB = require('pouchdb');

// Create folderQueue FIFO queue with callback function
const folderQueue = cq();
const musicQueue = cq();

// TODO: Use a LIFO Stack to save and retrieve image files
let imageFilePaths = [];

// Use CLI arguments for root file paths
let args = yargs.option('root', {
    type:    'array',
    desc:    'Lists the path for one or more root directories',
    example: 'script --root /Users/user/Music'
});

let paths = args.demandOption(['root'], 'Provide root directory path(s), if a path contains whitespace: use quotes')
           .coerce(['root'], a => a.map(b => path.resolve(b)))
           .argv
           .root;

// Setup library for storing and sorting metadata
let library = new MusicLibraryIndex();

// Setup database for permanent storage of medadata
let musicDB = new PouchDB('http://127.0.0.1:5984/music_db', {
    auth: {
        username: config.DB_USER,
        password: config.DB_PASS
    }
});

/** */
function processQueue(task)
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
        if(err)
        {
            throw err;
        }

        let contentPaths = contents.map(item => path.join(dirPath, item));
        let folders = contentPaths.filter(content => gfs.statSync(content).isDirectory());
        let files = contentPaths.filter(content => gfs.statSync(content).isFile());
        let musicFiles = files.filter(content => config.AUDIO_REGEXP.test(content));
        let imageFiles = files.filter(content => config.IMAGE_REGEXP.test(content));

        folders.map(queueFolder);
        musicFiles.map(queueMusicFile);
        imageFiles.map(logImageFile);
    });
}

/** */
function queueFolder(folderPath)
{
    folderQueue(folderPath);
}

/** */
function queueMusicFile(filePath)
{
    musicQueue(filePath);
}

/** */
function logImageFile(filePath)
{
    imageFilePaths.push(filePath);
}

/** */
function getMetadata(filePath)
{
    // let readableStream = gfs.createReadStream(filePath);
    // let getData = new Promise((resolve, reject) =>
    // {
    //     musicmd(readableStream, (err, data) =>
    //     {
    //         if (err)
    //         {
    //             reject(err);
    //         }

    //         readableStream.close();
    //         resolve(data);
    //     });
    // });

    // getData.then(data => console.log(data));

    /** */
    function getData(err, results)
    {
        if (err)
        {
            throw err;
        }

        console.dir(results);
    }

    acoustid(filePath, { key: config.ACOUSTIC_API.MYMUSICPLAYER }, getData);
}

paths.forEach(queueFolder);

folderQueue.process(processQueue);
folderQueue.processingStarted(processing => readDir(processing.item));

musicQueue.process(processQueue);
musicQueue.processingStarted(processing => getMetadata(processing.item));

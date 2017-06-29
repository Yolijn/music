const gfs = require('graceful-fs');
const musicmd = require('musicmetadata');
const acoustid = require('acoustid');
const helperFunctions = require('./helperFunctions.js');
const handleError = helperFunctions.handleError;
const responseToPromise = helperFunctions.responseToPromise;
const config = require('./config/acoustid.json');

/** */
function getAllMetadata(filePath)
{
    return Promise.all([getMetaAcoustid(filePath), getMusicMetadata(filePath)])
        .then(results => results.reduce((allData, data) => Object.assign(allData, data), { location: filePath }));
}

/** */
function getMusicMetadata(filePath)
{
    let readableStream = gfs.createReadStream(filePath);

    return new Promise((resolve, reject) =>
    {
        musicmd(readableStream, (err, results) =>
        {
            handleError(err, reject);

            let info = {
                album: {
                    title:   results.album,
                    year:    results.year,
                    artists: results.albumartist,
                    genres:  results.genre,
                    disks:   results.disk,
                    image:   results.picture,
                },
                duration: results.duration
            };

            resolve(info);
            readableStream.close();
        });
    });
}

/** */
function getMetaAcoustid(filePath)
{
    return new Promise((resolve, reject) =>
        acoustid(filePath, { key: config.MYMUSICPLAYER }, (err, result) =>
        {
            handleError(err, reject);

            let track = {
                _id:      result[0].recordings[0].id,
                name:     result[0].recordings[0].title,
                artists:  result[0].recordings[0].artists
            };

            resolve(track);
        })
    );
}

module.exports = getAllMetadata;

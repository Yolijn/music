const gfs = require('graceful-fs');
const musicmd = require('musicmetadata');
const acoustid = require('acoustid');
const helperFunctions = require('./helperFunctions.js');
const handleError = helperFunctions.handleError;
const responseToPromise = helperFunctions.responseToPromise;
const config = require('./config/acoustid.json');


class Track {
    constructor(filePath)
    {
        this.file = filePath;
    }

    getMetadata()
    {
        return new Promise((resolve, reject) =>
        {
            getMetaAcoustid(this.file)
                .then(metadata =>
                {
                    getMusicMetadata(this.file)
                        .then(musicmetadata =>
                            Object.assign({}, acoustidData, musicmetadata)
                        )
                        .then(result =>
                        {
                            this._id = result._id;
                            this.name = result.name;
                            this.artists = result.artists;
                            this.duration = result.duration;
                            this.album = result.album;
                        })
                        .then(console.log(this))
                        .catch(err => handleError(err, reject));
                });
        });
    }
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

module.exports = Track;

const gfs = require('graceful-fs');
const musicmd = require('musicmetadata');
const acoustid = require('acoustid');
const checkSimilarity = require('./checkSimilarity.js');
const uuid = require('uuid/v4');

const { ACOUSTID_KEY } = require('../config.json');
const { handleError } = require('./helperfn.js');

/** */
exports.getAllMetadata = filePath =>
{
    let getArtistRefs = (md) =>  md.artists.map(artist => artist.id);

    return getMusicMetadata(filePath)
        .then(fileData =>
        {
            return getMetaAcoustid(filePath, fileData);
        }, handleError)
        .then(metadata => {
            return {
                track:
                {
                    _id: metadata.id || uuid(),
                    musicBrainzID: metadata.id,
                    title: metadata.title,
                    album_id: metadata.album.id,
                    artist_ids: getArtistRefs(metadata),
                    location: filePath,
                    duration: metadata.duration
                },
                album:
                {
                    _id: metadata.album.id || uuid(),
                    musicBrainzID: metadata.album.id,
                    title: metadata.album.title,
                    artist_ids: getArtistRefs(metadata)
                },
                artists: metadata.artists.map(artist =>
                {
                    return {
                        _id: artist.id || uuid(),
                        musicBrainzID: artist.id,
                        name: artist.name
                    };
                })
            };
        }, handleError)
        .catch(handleError);
};

/** */
function getMusicMetadata(filePath)
{
    let readableStream = gfs.createReadStream(filePath);

    return new Promise((resolve, reject) =>
    {
        musicmd(readableStream, (err, results) =>
        {
            readableStream.close();
            handleError(err, reject);
            if (results)
            {
                let info = {
                    title: results.title,
                    track: results.track.no,
                    album: {
                        title:   results.album,
                        year:    results.year,
                        artists: results.albumartist,
                        disks:   results.disk
                    },
                    duration: Number(results.duration).toFixed()
                };

                resolve(info);
            }
            else
            {
                reject(results);
            }
        });
    });
}

/** */
function getMetaAcoustid(filePath, {title, album, duration})
{
    return new Promise((resolve, reject) =>
        acoustid(filePath, { key: ACOUSTID_KEY }, (err, results) =>
        {
            handleError(err, reject);

            let bestResult = results.map(result => checkSimilarity(title, result.recordings, (input) => input.title))
                .reduce((a, b) => [...a, ...b])
                .filter(result => result.score >= 0.8)
                .map(result => result.data)
                .map(result =>
                {
                    let similarScores = checkSimilarity(album.title, result.releasegroups, (release) => release.title);

                    let group = similarScores.filter(releaseGroup => releaseGroup.score >= 0.8)
                        .sort((a, b) => (a.score ? a.score : 0) - (b.score ? b.score : 0))
                        .map(releaseGroup => releaseGroup.data);

                    delete(result.releasegroups);
                    result.album = group[0];

                    return result;
                })
                // FIXME: To avoid multiple results, I need to reduce the results to 1 based on differences between file and acoustid data
                // For now I choose to assume the sources parameter equals 'best result' score
                .reduce((a, b) => a.sources > b.sources ? a : b, 0);

            if (bestResult)
            {
                delete(bestResult.sources);

                if (bestResult && bestResult.album)
                {
                    bestResult.album.releases = bestResult.album.releases
                        .filter(release => parseInt(release.date.year, 10) === parseInt(album.year, 10));
                }
                else
                {
                    bestResult.album = album;
                    bestResult.album.releases = { year: album.year };
                }

                bestResult.duration = duration;
            }

            resolve(bestResult);
        })
    );
}

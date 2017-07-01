import { tracks, artists, albums } from './databases.js';

/** */
function initApp()
{
    let getFiles = tracks.getAll();
    let app = document.getElementById('app');

    console.log(app);

    /** */
    function showTrack(item)
    {
        console.log(item);
        let output = document.createElement('div');
        let performers = document.createElement('h2');
        let track = document.createElement('p');
        let tracklink = document.createElement('a');

        let getArtists = results => results ? results.map(artist => artist.name).join(' & ') : '';

        tracklink.setAttribute('href', `/track/${item._id}`);
        tracklink.textContent = `${item.name}`;

        track.appendChild(tracklink);

        performers.textContent = `${getArtists(item.artists)}`;

        output.appendChild(performers);
        output.appendChild(track);

        app.appendChild(output);
    }

    // TODO: show files based on URL
    getFiles.then(files =>
    {
        files.map(showTrack);
    });
}

document.addEventListener('DOMContentLoaded', initApp);

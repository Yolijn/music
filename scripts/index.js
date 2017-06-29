import db from './db.js';

/** */
function initApp()
{
    let getFiles = db.getAll();
    let app = document.getElementById('app');

    console.log(app);

    /** */
    function showTrack(item)
    {
        let output = document.createElement('div');
        let artists = document.createElement('h2');
        let track = document.createElement('p');
        let tracklink = document.createElement('a');

        let getArtists = artists => artists ? artists.map(artist => artist.name).join(' & ') : '';

        tracklink.setAttribute('href', `/track/${item._id}`);
        tracklink.textContent = `${item.title}`;

        track.appendChild(tracklink);

        artists.textContent = `${getArtists(item.artists)}`;

        output.appendChild(artists);
        output.appendChild(track);

        app.appendChild(output);
    }

    getFiles.then(tracks =>
    {
        tracks.map(showTrack);
    });
}

document.addEventListener('readystatechange', evt =>
{
    if (evt.target.readyState === 'complete')
    {
        initApp();
    }
}, false);

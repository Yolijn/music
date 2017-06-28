const couchDB = require('./config/couchDB.json');
const PouchDB = require('pouchdb');
const helperFunctions = require('./helperFunctions.js');

// Setup database for permanent storage of medadata
PouchDB.plugin(require('pouchdb-find'));

let db = {};

let database = new PouchDB(couchDB.URL, {
    auth: {
        username: couchDB.USER,
        password: couchDB.PASSWORD
    }
});

database.createIndex({
    index: {
        fields: ['type', '_id', 'name', 'url']
    }
}).then(result => console.log('DB Indexes are created'))
.catch(helperFunctions.handleError);

db.delete = () =>
{
    console.log('deleting db');
    database.destroy()
        .then(helperFunctions.logSuccess)
        .catch(helperFunctions.handleError);
};


db.saveTrack = track =>
{
    database.find({ selector: { _id: track._id } })
    .then((response, err) =>
    {
        helperFunctions.handleError(err);
        helperFunctions.handleWarning(response.warning);

        return response.docs.length > 0;
    })
    .then(exists =>
    {
        if (!exists)
        {
            database.put(track)
                .then(console.log('saved', track._id))
                .catch(helperFunctions.handleError);
        }
        else
        {
            console.log('already exists', track._id);
        }
    });
};

module.exports = db;

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
}).then(result => helperFunctions.log('DB Indexes are created'))
.catch(helperFunctions.handleError);

db.getAll = () =>
    database.allDocs({ 'include_docs': true })
        .then(docs => docs.rows.filter(item => !/^_design/.test(item.id)))
        .then(docs => docs.map(item => item.doc));

db.get = id =>
    database.get(id)
        .catch(helperFunctions.handleError);

db.delete = () =>
{
    helperFunctions.log('deleting db');
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
                .then(helperFunctions.log('saved', track._id))
                .catch(helperFunctions.handleError);
        }
        else
        {
            helperFunctions.log('already exists', track._id);
        }
    });
};

module.exports = db;

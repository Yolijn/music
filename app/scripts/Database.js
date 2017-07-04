const PouchDB = require('pouchdb');
const path = require('path');

const { log, handleError, handleWarning } = require('./helperfn.js');
const { COUCH_URL, COUCH_USER, COUCH_PASSWORD } = require('../config.json');

// Setup database for permanent storage of medadata
PouchDB.plugin(require('pouchdb-find'));

class Database
{
    constructor(name)
    {
        this.database = new PouchDB(COUCH_URL + name, {
            auth: {
                username: COUCH_USER,
                password: COUCH_PASSWORD
            }
        });

        this.database.createIndex({
            index: {
                fields: ['musicBrainzID', 'name', 'location']
            }
        })
        .then(log(`Database "${name}" created`), handleError)
        .catch(handleError);
    }

    getAll()
    {
        return this.database.allDocs({ 'include_docs': true })
            .then(docs => docs.rows.filter(item => !/^_design/.test(item.id)), handleError)
            .then(docs => docs.map(item => item.doc), handleError);
    }

    get(id)
    {
        return this.database.get(id)
            .catch(handleError);
    }

    save(document)
    {
        this.getAll()
        .then(documents => documents.filter(doc => doc.musicBrainzID === document.musicBrainzID))
        .then(dbDoc =>
        {
            if (dbDoc.length === 0)
            {
                this.database.put(document)
                    .then(log('saved', document._id))
                    .catch(handleError);
            }
            else if (dbDoc.length > 1)
            {
                console.log('Warning: Multiple documents with the same musicBrainzID:', document.musicBrainzID);
            }
            else
            {
                document._rev = dbDoc._rev;

                // this.database.put(document)
                //     .then(log('updated', document._id))
                //     .catch(handleError);
            }
        });
    }

    delete(id)
    {
        this.get(id).then(this.database.remove)
            .then(log('removed', id), handleError);
    }

    destroy()
    {
        log('deleting db');
        this.database.destroy()
            .then(response => log('success', response), handleError);
    }
}

module.exports = Database;

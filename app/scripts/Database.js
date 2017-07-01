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
                fields: ['_id', 'name', 'location']
            }
        })
        .then(log(`Database "${name}" created`))
        .catch(handleError);
    }

    getAll()
    {
        return this.database.allDocs({ 'include_docs': true })
            .catch(handleError)
            .then(docs => docs.rows.filter(item => !/^_design/.test(item.id)))
            .then(docs => docs.map(item => item.doc));
    }

    get(id)
    {
        return this.database.get(id)
            .catch(handleError);
    }

    save(document)
    {
        this.database.find({ selector: { _id: document._id } })
            .then((response, err) =>
            {
                handleError(err);
                handleWarning(response.warning);

                return response.docs.length > 0;
            })
            .then(exists =>
            {
                if (!exists)
                {
                    this.database.put(document)
                        .then(log('saved', document._id))
                        .catch(handleError);
                }
                else
                {
                    log('already exists', document._id);
                }
            });
    }

    delete(id)
    {
        this.get(id).then(this.database.remove)
            .then(log('removed', id))
            .catch(handleError);
    }

    destroy()
    {
        log('deleting db');
        this.database.destroy()
            .then(response => log('success', response))
            .catch(handleError);
    }
}

module.exports = Database;

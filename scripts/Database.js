const couchDB = require('./config/couchDB.json');
const PouchDB = require('pouchdb');
const helperFunctions = require('./helperFunctions.js');
const path = require('path');

// Setup database for permanent storage of medadata
PouchDB.plugin(require('pouchdb-find'));

class Database
{
    constructor(name)
    {
        this.database = new PouchDB(couchDB.URL + name, {
            auth: {
                username: couchDB.USER,
                password: couchDB.PASSWORD
            }
        });

        this.database.createIndex({
            index: {
                fields: ['_id', 'name', 'location']
            }
        })
        .then(helperFunctions.log(`Database "${name}" created`))
        .catch(helperFunctions.handleError);
    }

    getAll()
    {
        return this.database.allDocs({ 'include_docs': true })
            .catch(helperFunctions.handleError)
            .then(docs => docs.rows.filter(item => !/^_design/.test(item.id)))
            .then(docs => docs.map(item => item.doc));
    }

    get(id)
    {
        return this.database.get(id)
            .catch(helperFunctions.handleError);
    }

    save(document)
    {
        this.database.find({ selector: { _id: document._id } })
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
                    this.database.put(document)
                        .then(helperFunctions.log('saved', document._id))
                        .catch(helperFunctions.handleError);
                }
                else
                {
                    helperFunctions.log('already exists', document._id);
                }
            });
    }

    delete(id)
    {
        this.get(id).then(this.database.remove)
            .then(helperFunctions.log('removed', id))
            .catch(helperFunctions.handleError);
    }

    destroy()
    {
        helperFunctions.log('deleting db');
        this.database.destroy()
            .then(helperFunctions.logSuccess)
            .catch(helperFunctions.handleError);
    }
}

module.exports = Database;

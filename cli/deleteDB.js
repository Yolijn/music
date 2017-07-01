const databases = require('./app/scripts/databases.js');
const yargs = require('yargs');

let yargsConfig = {
    type:    'array',
    desc:    'Lists the name or names of the databases to delete',
    example: 'script --delete tracks artists' // removes the tracks and artists database
};

// Use CLI arguments for names of databases to delete
let args = yargs.option('delete', yargsConfig)
                .demandOption(['delete'], 'Provide one or more names of databases to delete')
                .argv;

args.delete.map(database =>
{
    let db = databases[database];

    if (db)
    {
        db.destroy();
    }
    else
    {
        console.log('could not find database', database);
    }
});
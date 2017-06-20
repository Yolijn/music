'use strict';
const yargs = require('yargs');
const path = require('path');
const cq = require('concurrent-queue');
const gfs = require('graceful-fs');


// Get and set CLI options
let rootDirOption = {
    type:    'array',
    desc:    'Lists the path for one or more root directories',
    example: 'script --root /Users/user/Music'
};

let args = yargs.option('root', rootDirOption)
                .demandOption(['root'], 'Please provide this function with at least one root directory path')
                .coerce(['root'], a => a.map(b => path.resolve(b)))
                .argv;

let FindMusicFiles = cq();

console.log(args.root);
console.log(FindMusicFiles);

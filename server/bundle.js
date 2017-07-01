let webpack = require('webpack');
let webpackConfig = require('./../webpack.config.js');
let path = require('path');
let fs = require('fs');
let mainPath = path.resolve(__dirname, '..', 'app', 'scripts', 'main.js');
let helperFunctions = require('../app/scripts/helperfn.js');
let watchOptions = {
    aggregateTimeout: 300,
    poll:             1000,
    ignored:          /^node_modules/
};

module.exports = () =>
{
    // First we fire up Webpack an pass in the configuration we
    // created
    let bundleStart = null;
    let compiler = webpack(webpackConfig);

    // We give notice in the terminal when it starts bundling and
    // set the time it started
    compiler.plugin('compile', () =>
    {
        console.log('Bundling...');
        bundleStart = Date.now();
    });

    // We also give notice when it is done compiling, including the
    // time it took. Nice to have
    compiler.plugin('done', () =>
    {
        console.log('Bundled in ' + (Date.now() - bundleStart) + 'ms!');
    });

    compiler.watch(watchOptions, (err, stats) =>
    {
        helperFunctions.handleError(err);
        console.log('Watching...');
    });
};

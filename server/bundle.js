const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const mainPath = path.resolve(__dirname, '..', 'app', 'scripts', 'main.js');
const webpackConfig = require('./../webpack.config.js');

const { log, handleError } = require('../app/scripts/helperfn.js');

const watchOptions = {
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
        log('Bundling...');
        bundleStart = Date.now();
    });

    // We also give notice when it is done compiling, including the
    // time it took. Nice to have
    compiler.plugin('done', () =>
    {
        log('Bundled in ' + (Date.now() - bundleStart) + 'ms!');
    });

    compiler.watch(watchOptions, (err, stats) =>
    {
        handleError(err);
        log('Watching...');
    });
};

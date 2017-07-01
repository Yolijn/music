let { SHOW_WARNINGS, SHOW_LOGS } = require('../config.json');

exports.handleError = (err, errorCallback) =>
{
    if (errorCallback && err)
    {
        errorCallback(err);
    }
    else if (err)
    {
        throw err;
    }
};

exports.handleWarning = (warning, warningCallback) =>
{
    if (warningCallback && warning)
    {
        warningCallback(warning);
    }
    else if (SHOW_WARNINGS && warning)
    {
        console.warn(warning);
    }
};

exports.responseToPromise = response => new Promise((resolve, reject) => resolve(response));

exports.log = (...msg) =>
{
    if (SHOW_LOGS)
    {
        console.log(...msg);
    }
};

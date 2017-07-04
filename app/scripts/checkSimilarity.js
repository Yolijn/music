/**
 * @param {string} query
 * @param {Array<?> | Object<?>} dataSet
 * @param {Function?} getValue
 * @return {Object}
 */
module.exports = (query, dataSet, getValue) =>
{
    let getString = getValue || (value => String(value));
    let sum = (a, b) => a + b;

    let getScore = (string, data) =>
    {
        let queryArr = query.split(/\W+/).sort().filter(Boolean).map(word => word.toLowerCase());
        let matchArr = string.split(/\W+/).sort().filter(Boolean).map(word => word.toLowerCase());

        let matchCount = queryArr.map(word =>
        {
            let matchingIndex = matchArr.indexOf(word);
            let match = matchingIndex >= 0;

            if (match)
            {
                // Remove this match from matchArr to avoid false positives later on
                matchArr.splice(matchingIndex, 1);
            }

            return match ? 1 : 0;
        }).reduce(sum, 0);

        return matchCount / queryArr.length;
    };



    return dataSet.filter(data => getValue(data))
        .map(data =>
        {
            return {
                score:  getScore(getString(data), data),
                data:   data
            };
        });
};

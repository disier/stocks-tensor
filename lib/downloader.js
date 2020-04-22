const http = require('follow-redirects').http;
const fs = require('fs');

let downloadedBytes = 0;


module.exports = {

    /**
     *
     * @param {String} sticker
     * @return {Promise<Number>}
     */
    downloadData(sticker) {
        // https://query1.finance.yahoo.com/v7/finance/download/TEF?period1=1555182857&period2=1586805257&interval=1d&events=history

        // from web
        // https://query1.finance.yahoo.com/v7/finance/download/TEF?period1=946684800&period2=1587340800&interval=1d&events=history
        // from app
        // https://query1.finance.yahoo.com/v7/finance/download/TEF?period1=946681200&period2=1587389779&interval=1d&events=history
        return new Promise(function (resolve, reject) {
            const period1 = new Date(2000, 0, 1).getTime().toString().slice(0, -3);
            const period2 = new Date().getTime().toString().slice(0, -3);
            const interval = '1d';
            const events = 'history';

            const url = 'http://query1.finance.yahoo.com/v7/finance/download/' + sticker + '?period1='
                + period1 + '&period2=' + period2 + '&interval=' + interval + '&events=' + events;

            console.log('Downloading from URL: ' + url);
            const destinationFile = '.\\files\\' + sticker + '.csv';
            const file = fs.createWriteStream(destinationFile);
            downloadedBytes = 0;

            http.get(url, function (response) {
                switch (response.statusCode) {
                    case 200:
                    case 202:
                        response.pipe(file);
                        response.on('data', function (chunk) {
                            downloadedBytes += chunk.length;
                        });
                        file.on('finish', function () {
                            file.close();  // close() is async, call cb after close completes.
                            resolve(downloadedBytes)
                        });
                        break;

                    default:
                        reject('Response ' + response.statusCode);
                        break;
                }

            }).on('error', function (err) { // Handle errors
                fs.unlink(destinationFile); // Delete the file async. (But we don't check the result)
                reject(err.message);
            });
        });

    }

};

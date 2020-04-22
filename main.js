const files = require('./lib/files');
const database = require('./lib/database');
const downloader = require('./lib/downloader');
const excel = require('./lib/excel');

let stockData = null;

/**
 *
 * @param {Object}object
 * @return {number}
 */
function roughSizeOfObject( object ) {

    let objectList = [];
    let stack = [ object ];
    let bytes = 0;

    while ( stack.length ) {
        let value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( let i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
}

/**
 *
 * @param {String} sticker
 */
function listStockDetails(sticker) {
    database.getStock(sticker)
        .then(
            function onStockData(stock) {
                console.log('STOCK DETAILS');

                console.log('id:'.padEnd(15) + stock['id'].toString().padEnd(20));
                console.log('Sticker:'.padEnd(15) + stock['sticker'].padEnd(20));
                console.log('Name:'.padEnd(15) + stock['name'].padEnd(20));
                console.log('Last Update:'.padEnd(15) + stock['lastUpdate'].padEnd(20));

                if (!files.checkStockFileExists(stock['sticker'])) {
                    console.log('Data file:'.padEnd(15) + 'NOT PRESENT');
                } else {
                    files.getStockFileDetails(stock['sticker'])
                        .then(
                            /**
                             *
                             * @param {Object} fileInformation
                             */
                            function onSuccess(fileInformation) {
                                console.log('File name:'.padEnd(15) + fileInformation.fileName.padEnd(20) + 'Rows:'.padEnd(15) + fileInformation.rows.toString().padEnd(10));
                                console.log('Creation:'.padEnd(15) + new Date(fileInformation.creationTime).toLocaleString('es-ES').padEnd(20) + 'Update:'.padEnd(15) + fileInformation.updateTime.toLocaleString('es-ES').padEnd(10));
                                console.log('Size in:'.padEnd(15) + fileSize(fileInformation.fileSizeInBytes).padEnd(20));
                            },
                            /**
                             *
                             * @param {String} error
                             */
                            function onError(error) {
                                console.error('Error retrieving details: ' + error);
                            }
                        )

                }
            },
            function onStockNotFound(error) {
                console.error(error);
            });

}

/**
 *
 * @param {Number} b - Size in Bytes
 * @return {string}
 */
function fileSize(b) {
    let u = 0, s = 1024;
    while (b >= s || -b >= s) {
        b /= s;
        u++;
    }
    return (u ? b.toFixed(1) + ' ' : b) + ' KMGTPEZY'[u] + 'B';
}


/**
 *
 * @param {String} sticker
 */
function downloadPrices(sticker) {
    database.getStock(sticker)
        .then(
            /**
             *
             * @param {Object} stock
             */
            function onGetStockSuccess(stock) {
                downloader.downloadData(sticker)
                    .then(
                        /**
                         * @param {Number} downloadedBytes
                         */
                        function onSuccess(downloadedBytes) {
                            console.log('File downloaded in ' + fileSize(downloadedBytes));

                            database.updateStock(stock)
                                .then(
                                    function onSaveSucccess() {
                                        console.log('Stock updated on database');
                                    },
                                    function onSaveError(err) {
                                        console.error('Error saving on database: ' + err);
                                    });
                        },
                        /**
                         *
                         * @param error
                         */
                        function onError(error) {
                            console.error('Error downloading data: ' + error);
                        }
                    )
            }
        )


}

/**
 *
 * @param {Array} csvArray
 * @return {[]}
 */
function convertStringArrayToArray(csvArray) {
    let processedArray = [];
    for (let row of csvArray) {
        let newRow = {
            Date: row['Date'],
            Open: parseFloat(row['Open']),
            High: parseFloat(row['High']),
            Low: parseFloat(row['Low']),
            Close: parseFloat(row['Close']),
            Volume: parseFloat(row['Volume'])
        };
        processedArray.push(newRow);
    }
    return processedArray
}

/**
 *
 * @param {String} sticker
 */
function processStock(sticker) {
    database.checkStockExists(sticker)
        .then(
            function onSuccess(exists) {
                if (!exists) {
                    console.error('Stock ' + sticker + ' does not exist');
                    return;
                }

                database.getStock(sticker)
                    .then(
                        function processFileData(stock) {
                            files.getFileData(stock['sticker'])
                                /**
                                 * @param {Array} data
                                 */
                                .then(
                                    function fileReaden(data) {
                                        stockData = convertStringArrayToArray(data);
                                        console.log(
                                            'Loaded ' + stockData.length.toLocaleString('es-ES') +
                                            ' prices in ' + fileSize(roughSizeOfObject(stockData)) + ' from ' +
                                            fileSize(files.getStockCSVFileSize(sticker)) + ' file.');
                                        excel.exportArrayToExcel(stock['sticker'], stockData);
                                        console.log('Generated ' +   fileSize(files.getStockExcelFileSize(sticker)) + ' Excel file.')
                                    },
                                    function onFileError(error) {
                                        console.error('Error rerading file: ' + error)
                                    })
                        },
                        function onError(error) {
                            console.error('Error: ' + error);
                        }
                    )
            },
            function onError(error) {
                console.error('Error: ' + error);
            }
        )
}

function main() {
    console.log('===============================================================================');
    console.log(' Stocks Tensor 0.1.0');
    console.log('===============================================================================');

    const arguments = process.argv.slice(2);
    switch (arguments[0]) {
        case 'list':
            database.listAvailableStocks();
            break;

        case 'detail':
            if (arguments[1]) {
                listStockDetails(arguments[1]);
            } else {
                console.log('You must indicate a stock sticker');
            }
            break;

        case 'download':
            if (arguments[1]) {
                downloadPrices(arguments[1]);
            } else {
                console.log('You must indicate a stock sticker');
            }
            break;

        case 'process':
            if (arguments[1]) {
                processStock(arguments[1]);
            } else {
                console.log('You must indicate a stock sticker');
            }
            break;

        case 'help':
            console.log('  Available commands: ');
            console.log('     list                : List all existing stocks');
            console.log('     detail \<sticker\>  : Display stock details');
            console.log('     load \<sticker\>    : Load stocks and indicators on memory');

            break;

        default:
            console.log('Invalid command: ' + arguments[0]);
            console.log('Run command "help" for available commands');


    }

}


main();
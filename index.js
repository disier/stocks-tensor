const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

const files = require('./lib/files');
const database = require('./lib/database');
const downloader = require('./lib/downloader');

clear();

console.log(
    chalk.yellow(
        figlet.textSync('Stocks Tensor', {horizontalLayout: 'full'})
    )
);
database.init();


/**
 *
 * @param sticker{String}
 */
function displayStockData(sticker) {
    // Clean stock name
    sticker = sticker.replace('\n', '').replace('\'', '').replace('"', '');


    let stock = database.getStockInformation(sticker)
        .then(
            function (stock) {
                clear();
                console.log('##############################################################');
                console.log('Sticker: ' + stock.sticker + '\tName: ' + stock.name + '\tLast update: ' + stock.lastUpdate);
                console.log('file ' + stock.sticker + '.csv exists: ' + (files.checkStockFileExists(stock.sticker) ? 'Yes' : 'No'));
                console.log('Select operation: ');
                console.log('1) Download data');
                console.log('2) Display stats');
                console.log('3) Generate signals');
                getUserInput()
                    .then(
                        /**
                         *
                         * @param {String}selectedText
                         */
                        function onSuccess(selectedText) {
                            switch (selectedText) {
                                case '1':
                                    clear();
                                    console.log('Downloading file for sticker ' + stock.sticker);
                                    downloader.downloadData(stock.sticker)
                                        .then(
                                            function onSuccess(){
                                                console.log('File downloaded');
                                            },
                                            function onError(errorMessage){
                                                console.error('Error downloading: ' + errorMessage);
                                            }
                                        );
                                    break;

                                case '2':
                                    break;

                                case '3':
                                    break;

                                default:
                                    displayStockData(sticker);
                                    break;
                            }
                        },
                        function onRejected(err) {
                            console.error('Exiting on error: ' + err);
                            process.exit();
                        })
            },
            function (error) {
                clear();
                console.error(error);
            });

}

function createNewStock() {

}


/**
 *
 * @return {Promise<unknown>}
 */
function getUserInput() {
    return new Promise(function (resolve, reject) {

        try {
            let standard_input = process.stdin;
            // Set input character encoding.
            standard_input.setEncoding('utf-8');
            standard_input.removeListener('data', mainMenuInputRead);

            console.log('Select option or "exit":');

            // When user input data and click enter key.
            standard_input.on('data', function (data) {

                // User input exit.
                if (data === 'exit\n') {
                    // Program exit.
                    console.log("User input complete, program exit.");
                    process.exit();
                } else {
                    resolve(data)
                }
            });
        } catch (e) {
            reject(e.message);
        }

    });
}

function mainMenuInputRead(data){

        // User input exit.
        if (data === 'exit\n') {
            // Program exit.
            console.log("User input complete, program exit.");
            process.exit();
        } else {

            if (!data.length) {

            } else {
                console.log('Selected Stock: ' + data);

                displayStockData(data);
            }
            // Print user input in console.
        }
}

function mainScreen() {
    console.log('##############################################################');
    console.log('Select stock you want to work with:');

    database.listAvailableStocks()
        .then(function () {
            let standard_input = process.stdin;
            // Set input character encoding.
            standard_input.setEncoding('utf-8');

            console.log('Or press ENTER to create new');

            // When user input data and click enter key.
            standard_input.on('data', mainMenuInputRead);

        });

}




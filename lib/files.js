const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

module.exports = {
    getCurrentDirectoryBase: () => {
        return path.basename(process.cwd());
    },

    directoryExists: (filePath) => {
        return fs.existsSync(filePath);
    },

    /**
     *
     * @param {String} sticker
     */
    checkStockFileExists(sticker) {
        return fs.existsSync('.\\files\\' + sticker + '.csv');
    },

    /**
     * @param {String} sticker
     * @return {number}
     */
    getStockCSVFileSize(sticker){
        const stats = fs.statSync('.\\files\\' + sticker + '.csv');
        return stats.size;
    },

    /**
     * @param {String} sticker
     * @return {number}
     */
    getStockExcelFileSize(sticker){
        const stats = fs.statSync('.\\files\\' + sticker + '.xlsx');
        return stats.size;
    },

    /**
     *
     * @param {String} sticker
     * @return {Object}
     */
    getStockFileDetails(sticker) {
        return new Promise(function (resolve, reject) {
            try {
                const stats = fs.statSync('.\\files\\' + sticker + '.csv');
                let fileInfo = {
                    fileName: '.\\files\\' + sticker + '.csv',
                    rows: 0,
                    creationTime: new Date(stats.ctime),
                    updateTime: new Date(stats.mtime),
                    fileSizeInBytes: stats.size
                };
                fs.createReadStream('.\\files\\' + sticker + '.csv')
                    .pipe(csv())
                    .on('data', (row) => {
                        // console.log(row);
                        fileInfo.rows++;
                    })
                    .on('error', () => {
                        reject('Error reading file')
                    })
                    .on('end', () => {
                        // console.log('CSV file successfully processed');
                        resolve(fileInfo);
                    });
            } catch (e) {
                reject(e.message);
            }

        });
    },

    /**
     *
     * @param {String} sticker
     * @return Promise<Array>
     */
    getFileData(sticker) {
        return new Promise(function (resolve, reject) {
            try {
                const results = [];
                fs.createReadStream('.\\files\\' + sticker + '.csv')
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', () => {
                        resolve(results)
                        // console.log(results);
                        // [
                        //   { NAME: 'Daffy Duck', AGE: '24' },
                        //   { NAME: 'Bugs Bunny', AGE: '22' }
                        // ]
                    });
            } catch (e) {
                reject(e);
            }

        });
    }


};
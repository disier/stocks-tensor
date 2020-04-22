const sqlite3 = require('sqlite3').verbose();

let db = null;

function openDatabase() {
    return new Promise(function (resolve, reject) {
        db = new sqlite3.Database('.\\db\\stocks-tensor.db3', (err) => {
            if (err) {
                return reject(err.message);
            }
            resolve(db);
        });
    });
};


module.exports = {

    closeDatabase() {
        return new Promise(function (resolve, reject) {

            db.close((err) => {
                if (err) {
                    return reject(err.message);
                }
                resolve(true);
            });
        });
    },

    /**
     *
     * @param stock
     */
    updateStock(stock) {
        return new Promise(function (resolve, reject) {
            openDatabase()
                .then(
                    function onConnect(db) {
                        const data = [stock['sticker'], stock['name'], new Date().toISOString().slice(0, 19).replace('T', ' '), stock['sticker']];
                        const sql =
                            `UPDATE STOCKS SET
                               STICKER = ?
                                 ,NAME = ?
                           ,LASTUPDATE = ?
                                WHERE STICKER = ?`;
                        db.run(sql, data, function (err) {
                            if (err) {
                                return reject(err.message);
                            }
                            resolve(true);

                        });

                    })
        });
    },


    /**
     *
     * @param {String} sticker
     * @return {Promise<Boolean>}
     */
    checkStockExists(sticker) {
        return new Promise(function (resolve, reject) {
            openDatabase()
                .then(
                    function onConnect(db) {
                        db.serialize(() => {
                            const sql = 'SELECT * FROM STOCKS WHERE STICKER = \'' + sticker + '\'';

                            db.get(sql, [], (err, row) => {
                                if (err) {
                                    reject(err);
                                }
                                if (!row) {
                                    return resolve(false);
                                }
                                resolve(true);

                            });
                        });
                    },
                    function onErrorConnecting(errorMessage) {
                        console.error(errorMessage);
                    });
        });
    },


    /**
     *
     * @param {String} sticker
     * @return {Promise<Object>}
     */
    getStock(sticker) {
        return new Promise(function (resolve, reject) {
            openDatabase()
                .then(
                    function onConnect(db) {
                        db.serialize(() => {
                            const sql = 'SELECT * FROM STOCKS WHERE STICKER = \'' + sticker + '\' ORDER BY NAME LIMIT 1';

                            db.get(sql, [], (err, row) => {
                                if (err) {
                                    reject(err);
                                }
                                if (!row) {
                                    return reject('Stock ' + sticker + ' not found');
                                }

                                const stock = {
                                    id: row.ID,
                                    sticker: row.STICKER,
                                    name: row.NAME,
                                    lastUpdate: row.LASTUPDATE
                                };

                                resolve(stock);

                            });
                        });
                    },
                    function onErrorConnecting(errorMessage) {
                        console.error(errorMessage);
                    });


        });
    },

    listAvailableStocks() {
        openDatabase()
            .then(
                function onConnect(db) {
                    db.serialize(() => {
                        // display headers
                        console.log('===============================================================================');
                        console.log('Sticker'.padEnd(20) + 'Name'.padEnd(30) + 'Updated'.padEnd(20));
                        // open the database
                        let sql = 'SELECT STICKER, NAME, LASTUPDATE FROM STOCKS ORDER BY NAME';

                        db.each(sql, [], (err, row) => {
                            if (err) {
                                console.error(err);
                                return;
                            }

                            console.log(row.STICKER.padEnd(20) + row.NAME.padEnd(30) + row.LASTUPDATE.padEnd(20));

                        });

                    });

                    closeDatabase();

                },
                function onErrorConnecting(errorMessage) {
                    console.error(errorMessage);
                });
    },

    /**
     *
     * @param {String} sticker
     * @return {Promise}
     */
    getStockInformation(sticker) {
        return new Promise(function (resolve, reject) {
            openDatabase();
            db.serialize(() => {

                let sql = 'SELECT * FROM STOCKS WHERE STICKER = \'' + sticker + '\' ORDER BY NAME LIMIT 1';

                db.get(sql, [], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    if (!row) {
                        return reject('Stock ' + sticker + ' not found');
                    }

                    const stock = {
                        id: row.ID,
                        sticker: row.STICKER,
                        name: row.NAME,
                        lastUpdate: row.LASTUPDATE
                    };

                    resolve(stock);

                });

            });
        });
    }

};
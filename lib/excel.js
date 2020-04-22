const xl = require('excel4node');

/**
 *
 * @param {String} textDate - Date in YYYY-MM-DD format
 * @constructor
 */
function YYYYMMDDtoDate(textDate) {
    try {
        let year = parseInt(textDate.split('-')[0]);
        let month = parseInt(textDate.split('-')[1]) - 1;
        let day = parseInt(textDate.split('-')[2]);
        return new Date(year, month, day);
    } catch (e) {
        throw new Error('Invalid date string: ' + textDate);
    }

}


module.exports = {

    /**
     * @param {String} sticker
     * @param {Array} data
     */
    exportArrayToExcel(sticker, data) {
        try {
            let wb = new xl.Workbook();

            let ws = wb.addWorksheet('Sheet 1', {});

            // Create styles
            let headerStyle = wb.createStyle({
                font: {
                    bold: true
                },
                alignment: {
                    wrapText: true,
                    horizontal: 'center',
                },
            });

            let dateStyle = wb.createStyle({
                font: {},
                alignment: {
                    wrapText: true,
                    horizontal: 'center',
                },
                numberFormat: 'dd/mm/yyyy',

            });

            let euroStyle = wb.createStyle({
                font: {
                    color: '#000000'
                },
                numberFormat: '#.##0,0000€; -#.##0,0000€; -',
            });


            // Create headers based on first fow
            let firstRow = data.shift();
            let colNum = 1;
            let rowNum = 1;
            for (let prop in firstRow) {
                if (!firstRow.hasOwnProperty(prop)) {
                    continue;
                }
                let colName = prop.toString();
                ws.cell(rowNum, colNum++)
                    .string(colName)
                    .style(headerStyle);
            }

            // Write data
            for (let row of data) {
                rowNum++;
                colNum = 1;
                for (let prop in row) {
                    if (!row.hasOwnProperty(prop)) {
                        continue;
                    }
                    let colName = prop.toString();

                    switch (colName) {
                        case 'Open':
                        case 'Close':
                        case 'Low':
                        case 'High':
                            ws.cell(rowNum, colNum++)
                                .number(row[colName])
                                .style(euroStyle);
                            break;

                        case 'Date':
                            let date = YYYYMMDDtoDate(row[colName]);
                            ws.cell(rowNum, colNum++)
                                .number(xl.getExcelTS(date))
                                .style(dateStyle);
                            break;

                        default:
                            ws.cell(rowNum, colNum++)
                                .number(row[colName]);
                            break;
                    }

                }
            }

            wb.write('.\\files\\' + sticker + '.xlsx', function(error){
                if(error){
                    switch(error.code){
                        case 'EBUSY':
                            console.error('Could now write Excel file because file is open');
                            break;

                        default:
                            break;
                    }
                }

            });

        } catch (e) {
            console.error('Error parsing to Excel file: ' + e.message);
        }


    }
};

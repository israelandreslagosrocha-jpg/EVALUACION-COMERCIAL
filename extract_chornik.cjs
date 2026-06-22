const XLSX = require('xlsx');
const fs = require('fs');

const file = './src/assets/F15-Formato Evaluación Comercial Casas 4.0.xlsm';
const workbook = XLSX.readFile(file);
const sheet = workbook.Sheets['Hoja1'];
const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

const chornik = {};

// Rows 1 to 9 correspond to A to I (index 1 to 9 in json)
// json[0] is header (years 0 to 70)
for (let i = 1; i <= 9; i++) {
    const row = json[i];
    if (!row) continue;
    const clase = row[0]; // A, B, C, etc.
    const values = [];
    for (let col = 1; col <= 71; col++) {
        let val = row[col];
        if (val === undefined) val = 0;
        // The values might be decimals (e.g. 1 for 100%, 0.99 for 99%)
        values.push(val);
    }
    chornik[clase] = values;
}

const fileContent = `export const chornikTable = ${JSON.stringify(chornik, null, 2)};

export const getDepreciation = (clase, age) => {
  const years = Math.min(Math.max(0, parseInt(age) || 0), 70);
  const classData = chornikTable[clase?.toUpperCase()];
  if (!classData) return 1; // Default no depreciation
  return classData[years];
};
`;

fs.writeFileSync('./src/logic/chornik.js', fileContent);
console.log('chornik.js generated');

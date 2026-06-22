const XLSX = require('xlsx');
const fs = require('fs');

const file1 = './src/assets/F15-Formato Evaluación Comercial Casas 4.0.xlsm';

function summarizeExcel(filename) {
    if (!fs.existsSync(filename)) {
        console.error(`File not found: ${filename}`);
        return;
    }
    const workbook = XLSX.readFile(filename, { cellFormula: true, cellDates: true });
    
    console.log(`\n=== File: ${filename} ===`);
    console.log(`Sheets: ${workbook.SheetNames.join(', ')}`);
    
    workbook.SheetNames.forEach(sheetName => {
        // Skip some standard config sheets if any
        if (sheetName === 'Listas' || sheetName === 'Datos') return;
        
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const worksheet = workbook.Sheets[sheetName];
        
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        
        // Print first 50 rows to understand the structure
        for (let i = 0; i < Math.min(50, json.length); i++) {
            const row = json[i];
            if (row && row.length > 0 && row.some(cell => cell !== undefined && cell !== '')) {
                console.log(`Row ${i + 1}:`, row.map(c => c === undefined ? '' : c).join(' | '));
            }
        }
    });
}

summarizeExcel(file1);

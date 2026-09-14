import * as XLSX from 'xlsx';

const workbook = XLSX.readFile('2026.xls');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

console.log('Total rows:', excelData.length);

let currentTeacherOrClass = '';
const excelStudents: any[] = [];

for (let r = 0; r < excelData.length; r++) {
  const row = excelData[r];
  if (!row || row.length === 0) continue;

  // Check if row has student data or headers or class info
  const strRow = row.map(cell => String(cell ?? '').trim());
  
  // Print non-empty rows that might be headers or titles
  const nonEmpties = strRow.filter(c => c !== '');
  if (nonEmpties.length === 1 && isNaN(Number(nonEmpties[0]))) {
    // might be teacher name or class section header
    currentTeacherOrClass = nonEmpties[0];
    console.log(`[Line ${r}] Header/Section:`, nonEmpties[0]);
  } else if (nonEmpties.includes('სახელი') || nonEmpties.includes('გვარი') || nonEmpties.includes('პირადი ნომერი')) {
    console.log(`[Line ${r}] Header row:`, JSON.stringify(row));
  } else if (nonEmpties.length >= 3) {
    // check if row contains a personal number (11 digits or string)
    const pidCandidate = strRow.find(c => /^\d{11}$/.test(c));
    if (pidCandidate || (r < 30 && nonEmpties.length >= 3)) {
      // sample student row
      if (excelStudents.length < 5) {
        console.log(`[Line ${r}] Student row sample:`, strRow);
      }
      excelStudents.push({ line: r, row: strRow, section: currentTeacherOrClass });
    }
  }
}

console.log(`Extracted approx ${excelStudents.length} student rows from Excel.`);

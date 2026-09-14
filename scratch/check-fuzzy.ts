import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch/comparison_result.json', 'utf-8'));

const inExcel: any[] = data.inExcelNotInDb;
const inDb: any[] = data.inDbNotInExcel;

function cleanStr(s: string): string {
  return (s || '').replace(/[\s\-_]+/g, '').toLowerCase();
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

console.log('Checking fuzzy matches between the 30 Excel students and 282 DB students...');

const possibleMatches: any[] = [];

for (const es of inExcel) {
  const eClean = cleanStr(es.fullName);
  for (const ds of inDb) {
    const dClean = cleanStr(ds.fullName);
    const dist = levenshtein(eClean, dClean);
    // If edit distance <= 2 or PIDs match partially
    const pidDist = (es.pid && ds.pid) ? levenshtein(cleanStr(es.pid), cleanStr(ds.pid)) : 999;
    
    if (dist <= 2 || pidDist <= 2) {
      possibleMatches.push({
        excelStudent: es.fullName,
        excelPid: es.pid,
        excelSection: es.section,
        dbStudent: ds.fullName,
        dbPid: ds.pid,
        nameDistance: dist,
        pidDistance: pidDist
      });
    }
  }
}

console.log('Possible fuzzy/close matches found:', possibleMatches.length);
console.log(JSON.stringify(possibleMatches, null, 2));

import * as XLSX from 'xlsx';
import { MongoClient } from 'mongodb';
import * as fs from 'fs';

const uri = process.env.MONGODB_URI || "mongodb+srv://kakhiweinrooneykakhidze_db_user:TVuOu5jYYo0gX7vy@cluster0.a1whxsi.mongodb.net/school?retryWrites=true&w=majority";

function normalize(str: any): string {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, ' ').toLowerCase();
}

function cleanPid(pidVal: any): string {
  if (!pidVal) return '';
  let str = String(pidVal).trim();
  if (/^\d{10}$/.test(str)) {
    str = '0' + str;
  }
  return str;
}

function isGrade13OrAbove(className: string): boolean {
  if (!className) return false;
  const match = className.match(/^(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return num >= 13;
  }
  return false;
}

async function runComparison() {
  console.log('Reading 2026.xls...');
  const workbook = XLSX.readFile('2026.xls');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const excelRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  let currentTeacherOrClass = '';
  interface ExcelStudent {
    rowIndex: number;
    name: string;
    surname: string;
    fullName: string;
    pid: string;
    excelClass?: string;
    teacherOrSection: string;
  }

  const excelStudents: ExcelStudent[] = [];
  
  for (let r = 0; r < excelRows.length; r++) {
    const row = excelRows[r];
    if (!row || row.length === 0) continue;

    const strRow = row.map(c => c !== null && c !== undefined ? String(c).trim() : '');
    const nonEmpties = strRow.filter(c => c !== '');
    if (nonEmpties.length === 0) continue;

    if (nonEmpties.length === 1 && isNaN(Number(nonEmpties[0]))) {
      currentTeacherOrClass = nonEmpties[0];
      continue;
    }

    if (strRow.includes('სახელი') || strRow.includes('გვარი') || strRow.includes('პირადი ნომერი')) {
      continue;
    }

    let pid = '';
    let name = '';
    let surname = '';
    let excelClass = '';

    const pidItem = strRow.find(c => /^\d{10,11}$/.test(c) || (/^\d+$/.test(c) && c.length >= 10));

    if (pidItem) {
      pid = cleanPid(pidItem);
      const pidIdx = strRow.indexOf(pidItem);
      if (pidIdx >= 2) {
        name = strRow[pidIdx - 2];
        surname = strRow[pidIdx - 1];
        if (pidIdx + 1 < strRow.length && strRow[pidIdx + 1]) {
          excelClass = strRow[pidIdx + 1];
        }
      }
    } else {
      const nonNum = nonEmpties.filter(x => isNaN(Number(x)));
      if (nonNum.length >= 2) {
        name = nonNum[0];
        surname = nonNum[1];
      }
    }

    if (name && surname && name !== 'სახელი' && surname !== 'გვარი') {
      // Check if excelClass or section indicates grade 13+
      if (isGrade13OrAbove(excelClass) || isGrade13OrAbove(currentTeacherOrClass)) {
        continue; // Exclude grade 13+
      }

      const fullName = `${name} ${surname}`;
      excelStudents.push({
        rowIndex: r + 1,
        name,
        surname,
        fullName,
        pid,
        excelClass,
        teacherOrSection: currentTeacherOrClass
      });
    }
  }

  console.log(`Parsed ${excelStudents.length} students from 2026.xls (excluding 13+ grade).`);

  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('school');

  // Fetch classes from 'class' collection!
  const dbClassesRaw = await db.collection('class').find({}, {
    projection: { classname: 1, name: 1, ID: 1 }
  }).toArray();

  const classMap = new Map<string, string>();
  for (const c of dbClassesRaw) {
    classMap.set(c._id.toString(), c.ID || c.classname || c.name || '');
  }

  // Fetch students
  const dbStudentsRaw = await db.collection('students').find({}, {
    projection: { name: 1, surname: 1, ID: 1, user_ID: 1, class_id: 1 }
  }).toArray();

  interface DbStudent {
    _id: string;
    ID: string;
    user_ID?: string;
    name: string;
    surname: string;
    fullName: string;
    pid: string;
    className: string;
  }

  let totalDbStudentsCount = dbStudentsRaw.length;
  let db13PlusCount = 0;

  const dbStudents: DbStudent[] = [];

  for (const s of dbStudentsRaw) {
    const className = classMap.get(s.class_id?.toString()) || '';
    if (isGrade13OrAbove(className)) {
      db13PlusCount++;
      continue; // Exclude grade 13+
    }

    const p1 = cleanPid(s.ID);
    const p2 = cleanPid(s.user_ID);
    const pid = /^\d{10,11}$/.test(p1) ? p1 : (/^\d{10,11}$/.test(p2) ? p2 : p1 || p2);

    dbStudents.push({
      _id: s._id.toString(),
      ID: s.ID || '',
      user_ID: s.user_ID || '',
      name: s.name || '',
      surname: s.surname || '',
      fullName: `${s.name || ''} ${s.surname || ''}`.trim(),
      pid,
      className
    });
  }

  console.log(`Fetched total ${totalDbStudentsCount} DB students.`);
  console.log(`Filtered out ${db13PlusCount} students who are in Grade 13+ (13, 14, 15).`);
  console.log(`Active DB Students (Grade 1 to 12): ${dbStudents.length}`);

  // Indexes for fast lookup
  const dbByPid = new Map<string, DbStudent>();
  const dbByName = new Map<string, DbStudent[]>();
  const dbByReverseName = new Map<string, DbStudent[]>();

  for (const s of dbStudents) {
    if (s.pid && s.pid.length >= 8) {
      dbByPid.set(s.pid, s);
    }
    const normName = normalize(s.fullName);
    if (!dbByName.has(normName)) dbByName.set(normName, []);
    dbByName.get(normName)!.push(s);

    const normRev = normalize(`${s.surname} ${s.name}`);
    if (!dbByReverseName.has(normRev)) dbByReverseName.set(normRev, []);
    dbByReverseName.get(normRev)!.push(s);
  }

  const excelByPid = new Map<string, ExcelStudent>();
  const excelByName = new Map<string, ExcelStudent[]>();
  const excelByReverseName = new Map<string, ExcelStudent[]>();

  for (const s of excelStudents) {
    if (s.pid && s.pid.length >= 8) {
      excelByPid.set(s.pid, s);
    }
    const normName = normalize(s.fullName);
    if (!excelByName.has(normName)) excelByName.set(normName, []);
    excelByName.get(normName)!.push(s);

    const normRev = normalize(`${s.surname} ${s.name}`);
    if (!excelByReverseName.has(normRev)) excelByReverseName.set(normRev, []);
    excelByReverseName.get(normRev)!.push(s);
  }

  // 1. In Excel but NOT in DB (Grades 1-12)
  const inExcelNotInDb: any[] = [];
  for (const es of excelStudents) {
    let matched = false;

    if (es.pid && dbByPid.has(es.pid)) {
      matched = true;
    } else if (dbByName.has(normalize(es.fullName))) {
      matched = true;
    } else if (dbByReverseName.has(normalize(es.fullName))) {
      matched = true;
    }

    if (!matched) {
      inExcelNotInDb.push({
        fullName: es.fullName,
        name: es.name,
        surname: es.surname,
        pid: es.pid,
        excelClass: es.excelClass,
        section: es.teacherOrSection,
        excelRow: es.rowIndex
      });
    }
  }

  // 2. In DB (Grades 1-12) but NOT in Excel
  const inDbNotInExcel: any[] = [];
  for (const ds of dbStudents) {
    let matched = false;

    if (ds.pid && excelByPid.has(ds.pid)) {
      matched = true;
    } else if (excelByName.has(normalize(ds.fullName))) {
      matched = true;
    } else if (excelByReverseName.has(normalize(ds.fullName))) {
      matched = true;
    }

    if (!matched) {
      inDbNotInExcel.push({
        _id: ds._id,
        fullName: ds.fullName,
        name: ds.name,
        surname: ds.surname,
        pid: ds.pid || ds.ID || ds.user_ID,
        className: ds.className || 'კლასის გარეშე'
      });
    }
  }

  const resultData = {
    excelCount: excelStudents.length,
    dbCountTotal: totalDbStudentsCount,
    db13PlusFiltered: db13PlusCount,
    dbCountActive1to12: dbStudents.length,
    inExcelNotInDbCount: inExcelNotInDb.length,
    inDbNotInExcelCount: inDbNotInExcel.length,
    inExcelNotInDb,
    inDbNotInExcel
  };

  fs.writeFileSync('scratch/comparison_result.json', JSON.stringify(resultData, null, 2), 'utf-8');

  // Generate TXT report
  let txtContent = '';
  txtContent += `================================================================================\n`;
  txtContent += `      მოსწავლეთა სიის შედარების რეპორტი (2026.xls vs საიტი - 1-12 კლასები)\n`;
  txtContent += `================================================================================\n\n`;

  txtContent += `📊 ზოგადი სტატისტიკა (მე-13 და ზედა კლასების გამოკლებით):\n`;
  txtContent += `--------------------------------------------------------------------------------\n`;
  txtContent += `• სულ მოსწავლე ექსელის ფაილში (2026.xls): ${excelStudents.length}\n`;
  txtContent += `• სულ მოსწავლე საიტის ბაზაში (1-12 კლასებში): ${dbStudents.length} (ამოღებულია ${db13PlusCount} მოსწავლე, რომლებიც მე-13, 14, 15 კლასებში იყვნენ)\n`;
  txtContent += `• ექსელში არის, მაგრამ საიტზე არ არის (1-12 კლასები): ${inExcelNotInDb.length} მოსწავლე\n`;
  txtContent += `• საიტზე არის (1-12 კლასებში), მაგრამ ექსელში არ არის: ${inDbNotInExcel.length} მოსწავლე\n`;
  txtContent += `--------------------------------------------------------------------------------\n\n`;

  txtContent += `================================================================================\n`;
  txtContent += `1. მოსწავლეები, რომლებიც არიან ექსელში (2026.xls), მაგრამ არ არიან საიტზე (${inExcelNotInDb.length} მოსწავლე)\n`;
  txtContent += `(სტატუსი: ექსელში ირიცხებიან, მაგრამ საიტის 1-12 კლასების ბაზაში არ მოიძებნენ)\n`;
  txtContent += `================================================================================\n\n`;

  inExcelNotInDb.forEach((s: any, idx: number) => {
    const lineNo = String(idx + 1).padStart(2, ' ');
    const pidStr = s.pid ? s.pid : 'არ აქვს პირადი №';
    const sectionStr = s.section ? s.section : 'სექციის გარეშე';
    txtContent += `${lineNo}. ${s.fullName.padEnd(28, ' ')} | პირადი №: ${pidStr.padEnd(12, ' ')} | დამრიგებელი/სექცია: ${sectionStr} (სტრიქონი: ${s.excelRow})\n`;
  });

  txtContent += `\n================================================================================\n`;
  txtContent += `2. მოსწავლეები, რომლებიც არიან საიტზე (1-12 კლასებში), მაგრამ არ არიან ექსელში (2026.xls) (${inDbNotInExcel.length} მოსწავლე)\n`;
  txtContent += `(სტატუსი: 1-12 კლასებში ირიცხებიან საიტზე, თუმცა 2026.xls ფაილში არ ფიგურირებენ)\n`;
  txtContent += `================================================================================\n\n`;

  inDbNotInExcel.forEach((s: any, idx: number) => {
    const lineNo = String(idx + 1).padStart(3, ' ');
    const pidStr = s.pid ? s.pid : 'არ აქვს პირადი №';
    const classStr = s.className ? s.className : 'კლასის გარეშე';
    txtContent += `${lineNo}. ${s.fullName.padEnd(30, ' ')} | პირადი №: ${pidStr.padEnd(12, ' ')} | კლასი საიტზე: ${classStr}\n`;
  });

  fs.writeFileSync('მოსწავლეთა_შედარება_2026.txt', txtContent, 'utf-8');

  console.log('\n========================================');
  console.log(`NEW SUMMARY RESULT (Excluding Grade 13+):`);
  console.log(`Total Students in 2026.xls: ${excelStudents.length}`);
  console.log(`Total Active DB Students (Grades 1-12): ${dbStudents.length}`);
  console.log(`Filtered Grade 13+ Students from DB: ${db13PlusCount}`);
  console.log(`In Excel but NOT on Website: ${inExcelNotInDb.length}`);
  console.log(`On Website (Grades 1-12) but NOT in Excel: ${inDbNotInExcel.length}`);
  console.log('========================================\n');

  await client.close();
  process.exit(0);
}

runComparison().catch(err => {
  console.error(err);
  process.exit(1);
});

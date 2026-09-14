import * as XLSX from 'xlsx';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://kakhiweinrooneykakhidze_db_user:TVuOu5jYYo0gX7vy@cluster0.a1whxsi.mongodb.net/school?retryWrites=true&w=majority";

async function compare() {
  // 1. Read Excel file
  const workbook = XLSX.readFile('2026.xls');
  console.log('Sheet names:', workbook.SheetNames);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  console.log('Total rows in Excel:', excelData.length);
  console.log('First 10 rows:');
  excelData.slice(0, 10).forEach((row, i) => console.log(`Row ${i}:`, row));

  // 2. Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('school');
  
  const dbStudents = await db.collection('students').find({}).toArray();
  console.log('Total students in DB:', dbStudents.length);
  if (dbStudents.length > 0) {
    console.log('DB Student sample:', JSON.stringify(dbStudents[0], null, 2));
  }

  await client.close();
}

compare().catch(console.error);

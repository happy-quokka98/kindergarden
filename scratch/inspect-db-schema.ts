import * as XLSX from 'xlsx';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://kakhiweinrooneykakhidze_db_user:TVuOu5jYYo0gX7vy@cluster0.a1whxsi.mongodb.net/school?retryWrites=true&w=majority";

async function inspectDbStudents() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('school');
  
  const dbStudents = await db.collection('students').find({}).toArray();
  console.log('Total students in DB:', dbStudents.length);
  if (dbStudents.length > 0) {
    console.log('DB Student 0:', JSON.stringify(dbStudents[0], null, 2));
    console.log('DB Student 1:', JSON.stringify(dbStudents[1], null, 2));
  }

  // Let's also check classes collection to map class_id to class name if needed
  const classes = await db.collection('classes').find({}).toArray();
  console.log('Total classes in DB:', classes.length);
  console.log('Sample class:', JSON.stringify(classes[0], null, 2));

  await client.close();
}

inspectDbStudents().catch(console.error);

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://kakhiweinrooneykakhidze_db_user:TVuOu5jYYo0gX7vy@cluster0.a1whxsi.mongodb.net/school?retryWrites=true&w=majority";

async function inspectDbStudents() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('school');
  
  const dbStudents = await db.collection('students').find({}).toArray();
  console.log('Total students in DB:', dbStudents.length);
  for (let i = 0; i < Math.min(5, dbStudents.length); i++) {
    console.log(`DB Student ${i}:`, dbStudents[i]);
  }

  // Also check classes to understand class mapping if any
  const classes = await db.collection('classes').find({}).toArray();
  console.log('Classes count:', classes.length);
  if (classes.length > 0) {
    console.log('Sample classes:', classes.slice(0, 3));
  }

  await client.close();
}

inspectDbStudents().catch(console.error);

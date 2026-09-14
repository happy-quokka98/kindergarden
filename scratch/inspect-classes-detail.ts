import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://kakhiweinrooneykakhidze_db_user:TVuOu5jYYo0gX7vy@cluster0.a1whxsi.mongodb.net/school?retryWrites=true&w=majority";

async function inspectClasses() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('school');

  const classes = await db.collection('classes').find({}).toArray();
  console.log(`Total classes in DB: ${classes.length}`);
  classes.forEach((c: any) => {
    console.log(`ID: ${c._id}, classname: "${c.classname}", ID_str: "${c.ID}"`);
  });

  // Check students and their class_id
  const dbStudents = await db.collection('students').find({}, { projection: { name: 1, surname: 1, class_id: 1, ID: 1 } }).toArray();
  const classIdCountMap: Record<string, number> = {};
  dbStudents.forEach((s: any) => {
    const cId = s.class_id ? s.class_id.toString() : 'null';
    classIdCountMap[cId] = (classIdCountMap[cId] || 0) + 1;
  });

  console.log('\nStudent count per class_id:');
  for (const [cId, cnt] of Object.entries(classIdCountMap)) {
    const cls = classes.find(c => c._id.toString() === cId);
    const clsName = cls ? (cls.classname || cls.ID) : 'UNKNOWN/NULL';
    console.log(`class_id: ${cId} (${clsName}): ${cnt} students`);
  }

  await client.close();
}

inspectClasses().catch(console.error);

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://kakhiweinrooneykakhidze_db_user:TVuOu5jYYo0gX7vy@cluster0.a1whxsi.mongodb.net/school?retryWrites=true&w=majority";

async function inspectClasses() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('school');

  const classes = await db.collection('class').find({}).toArray();
  console.log(`Total classes in 'class': ${classes.length}`);
  
  const classMap = new Map<string, string>();
  classes.forEach((c: any) => {
    const name = c.ID || c.classname || c.name || '';
    classMap.set(c._id.toString(), name);
    console.log(`_id: ${c._id}, ID/classname: "${name}"`);
  });

  // Now inspect students with their actual class name mapped from 'class'
  const students = await db.collection('students').find({}, { projection: { name: 1, surname: 1, ID: 1, user_ID: 1, class_id: 1 } }).toArray();
  
  const classStudentCounts: Record<string, number> = {};
  students.forEach((s: any) => {
    const cId = s.class_id ? s.class_id.toString() : 'null';
    const cName = classMap.get(cId) || 'UNKNOWN_CLASS';
    classStudentCounts[cName] = (classStudentCounts[cName] || 0) + 1;
  });

  console.log('\nStudent counts by Class Name:');
  Object.entries(classStudentCounts).sort().forEach(([cName, cnt]) => {
    console.log(`Class "${cName}": ${cnt} students`);
  });

  await client.close();
}

inspectClasses().catch(console.error);

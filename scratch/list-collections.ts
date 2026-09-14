import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://kakhiweinrooneykakhidze_db_user:TVuOu5jYYo0gX7vy@cluster0.a1whxsi.mongodb.net/school?retryWrites=true&w=majority";

async function listCollections() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('school');

  const collections = await db.listCollections().toArray();
  console.log('Collections in school db:');
  collections.forEach(c => console.log(' -', c.name));

  // Let's check if there's a collection named 'class' or 'classes' or similar
  for (const c of collections) {
    if (c.name.toLowerCase().includes('class') || c.name.toLowerCase().includes('grade')) {
      const cnt = await db.collection(c.name).countDocuments();
      console.log(`Collection "${c.name}" count: ${cnt}`);
      if (cnt > 0) {
        const sample = await db.collection(c.name).findOne({});
        console.log(`Sample from "${c.name}":`, sample);
      }
    }
  }

  await client.close();
}

listCollections().catch(console.error);

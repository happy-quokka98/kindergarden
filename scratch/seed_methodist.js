const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:TVuOu5jYYo0gX7vy@cluster0.a1whxsi.mongodb.net/school?retryWrites=true&w=majority";

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("school");
    const teachers = db.collection("teachers");

    const existing = await teachers.findOne({ $or: [{ ID: "methodist1" }, { user_ID: "methodist1" }] });
    if (existing) {
      console.log("Test methodist methodist1 already exists in DB!");
      return;
    }

    const hashedPassword = await bcrypt.hash("methodist1", 10);
    const doc = {
      name: "მარიამ",
      surname: "მეთოდისტი",
      ID: "methodist1",
      user_ID: "methodist1",
      role: "methodist",
      phone: "599000000",
      classes: [],
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await teachers.insertOne(doc);
    console.log("Successfully seeded test methodist: methodist1 / methodist1");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await client.close();
  }
}

main();

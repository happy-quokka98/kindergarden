import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI || "mongodb+srv://kakhiweinrooneykakhidze_db_user:TVuOu5jYYo0gX7vy@cluster0.a1whxsi.mongodb.net/school?retryWrites=true&w=majority";

async function addAdmin() {
  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    const db = client.db("school");

    const adminsColl = db.collection("admins");
    const usersColl = db.collection("users");

    const userID = "iana-vardmanidze";
    const rawPassword = "iana-vardmanidze123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const adminUser = {
      name: "Iana",
      surname: "Vardmanidze",
      user_ID: userID,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date().toISOString()
    };

    await adminsColl.updateOne(
      { user_ID: userID },
      { $set: adminUser },
      { upsert: true }
    );

    await usersColl.updateOne(
      { user_ID: userID },
      { $set: adminUser },
      { upsert: true }
    );

    console.log(`✅ Successfully added admin user_ID: '${userID}' with password: '${rawPassword}'`);
  } catch (error) {
    console.error("❌ Error adding admin:", error);
  } finally {
    await client.close();
    console.log("Connection closed.");
  }
}

addAdmin();

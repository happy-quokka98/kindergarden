import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const db = await getDb();
    const existing = await db.collection("teachers").findOne({
      $or: [{ ID: "methodist1" }, { user_ID: "methodist1" }]
    });

    if (existing) {
      return NextResponse.json({
        message: "სატესტო მეთოდისტი უკვე არსებობს ბაზაში",
        user_ID: "methodist1",
        password: "methodist1",
        role: "methodist"
      });
    }

    const hashedPassword = await bcrypt.hash("methodist1", 10);
    const testMethodist = {
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

    await db.collection("teachers").insertOne(testMethodist);

    return NextResponse.json({
      message: "სატესტო მეთოდისტი წარმატებით დაემატა ბაზაში",
      user_ID: "methodist1",
      password: "methodist1",
      role: "methodist"
    });
  } catch (error: any) {
    return NextResponse.json({ message: "შეცდომა: " + (error?.message || error) }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}

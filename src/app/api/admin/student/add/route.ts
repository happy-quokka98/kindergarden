import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { name, surname, user_ID, ID, password, class_id, image, payment_due_day, payment_amount, payment_status } = await req.json();

  if (!ObjectId.isValid(class_id)) {
    return NextResponse.json({ message: "კლასის ID-ის ფორმატი არასწორია" }, { status: 400 });
  }

  const studentId = ID || user_ID;
  const hashedPassword = await bcrypt.hash(password || studentId, 10);

  const student = {
    name,
    surname,
    ID: studentId,
    user_ID: studentId,
    role: "student",
    image: image || "",
    password: hashedPassword,
    class_id: new ObjectId(class_id),
    points: [],
    payment_due_day: payment_due_day ? parseInt(String(payment_due_day), 10) : 10,
    payment_amount: payment_amount ? parseFloat(String(payment_amount)) : 150,
    payment_status: payment_status || 'unpaid',
  };

  const db = await getDb();
  const insertResult = await db.collection("students").insertOne(student);

  if (insertResult.insertedId) {
    await db.collection("class").updateOne(
      { _id: student.class_id },
      { $addToSet: { students: insertResult.insertedId } }
    );
  }

  return NextResponse.json({ message: "მოსწავლე წარმატებით დაემატა", ID: studentId, user_ID: studentId });
}

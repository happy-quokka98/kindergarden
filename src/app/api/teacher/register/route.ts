import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const teacher = await req.json();
    const teacherId = (teacher.ID || teacher.user_ID || "").toString().trim();
    const name = (teacher.name || "").toString().trim();
    const surname = (teacher.surname || "").toString().trim();

    if (!teacherId || !name || !surname) {
      return NextResponse.json({ message: "შეავსეთ ყველა აუცილებელი ველი (სახელი, გვარი, პ/ნ)" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("teachers").findOne({
      $or: [{ ID: teacherId }, { user_ID: teacherId }]
    });

    if (existing) {
      return NextResponse.json({ message: "ამ პირადი ნომრით თანამშრომელი უკვე არსებობს" }, { status: 400 });
    }

    const rawPassword = teacher.password || teacherId;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const teacherDoc = {
      name,
      surname,
      ID: teacherId,
      user_ID: teacherId,
      role: teacher.role || "teacher",
      phone: teacher.phone || "",
      classes: teacher.classes || [],
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await db.collection("teachers").insertOne(teacherDoc);
    return NextResponse.json({
      message: "თანამშრომელი წარმატებით დაემატა",
      ID: teacherId,
      user_ID: teacherId
    });
  } catch (error: any) {
    console.error("Register teacher error:", error);
    return NextResponse.json({ message: "დამატების შეცდომა: " + (error?.message || error) }, { status: 500 });
  }
}

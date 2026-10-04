import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const { student_id, month, status } = await req.json();

    if (!student_id || !month) {
      return NextResponse.json({ message: "student_id და month აუცილებელია" }, { status: 400 });
    }

    const newStatus = status || 'paid';
    const db = await getDb();
    const collection = db.collection("students");

    let query: any = { $or: [{ ID: student_id }, { user_ID: student_id }] };
    if (ObjectId.isValid(student_id)) {
      query.$or.push({ _id: new ObjectId(student_id) });
    }

    const fieldKey = `monthly_payments.${month}`;
    const updateDoc: any = {
      $set: {
        [fieldKey]: newStatus,
      }
    };

    const res = await collection.updateOne(query, updateDoc);

    if (res.matchedCount === 0) {
      return NextResponse.json({ message: "მოსწავლე ვერ მოიძებნა" }, { status: 404 });
    }

    return NextResponse.json({
      message: `${month} წარმატებით განახლდა: ${newStatus === 'paid' ? 'გადახდილია' : 'გადაუხდელია'}`,
      month,
      status: newStatus
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "შეცდომა მოხდა" }, { status: 500 });
  }
}

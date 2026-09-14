import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const studentId = searchParams.get("student_id");

    const db = await getDb();
    const query: Record<string, any> = { date };

    if (classId) query.class_id = classId;
    if (studentId) query.student_id = studentId;

    const logs = await db.collection("daily_routine_logs").find(query).toArray();
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ message: "შეცდომა რეჟიმის მონაცემების მიღებისას", error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { logs } = body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ message: "მონაცემები ცარიელია" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("daily_routine_logs");

    const bulkOps = logs.map((log: any) => ({
      updateOne: {
        filter: { student_id: log.student_id, date: log.date },
        update: {
          $set: {
            student_id: log.student_id,
            class_id: log.class_id,
            date: log.date,
            check_in_time: log.check_in_time,
            check_out_time: log.check_out_time,
            mood: log.mood,
            breakfast: log.breakfast,
            lunch: log.lunch,
            snack: log.snack,
            nap: log.nap,
            notes: log.notes,
            present: log.present,
            updatedAt: new Date().toISOString(),
          },
        },
        upsert: true,
      },
    }));

    await collection.bulkWrite(bulkOps);
    return NextResponse.json({ message: "დღის რეჟიმის მონაცემები წარმატებით შენახულია" });
  } catch (err: any) {
    return NextResponse.json({ message: "შეცდომა მონაცემების შენახვისას", error: err.message }, { status: 500 });
  }
}

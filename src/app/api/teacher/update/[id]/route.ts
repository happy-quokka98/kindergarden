import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

async function handleUpdate(req: NextRequest, params: Promise<{ id: string }>) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, surname, user_ID, ID, role } = body;
    const teacherId = ID || user_ID;

    if (!name || !surname || !teacherId) {
      return NextResponse.json({ message: "ყველა ველი აუცილებელია (სახელი, გვარი, პ/ნ)" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("teachers");
    
    const updateFields: any = {
      name,
      surname,
      ID: teacherId,
      user_ID: teacherId,
    };

    if (role) {
      updateFields.role = role;
    }

    const update = { $set: updateFields };

    if (ObjectId.isValid(id)) {
      const res = await collection.updateOne({ _id: new ObjectId(id) }, update);
      if (res.matchedCount > 0) {
        return NextResponse.json({ message: "მონაცემები წარმატებით განახლდა" });
      }
    }

    // Try ID or user_ID
    let result = await collection.updateOne({ $or: [{ ID: id }, { user_ID: id }] }, update);
    if (result.matchedCount > 0) {
      return NextResponse.json({ message: "მონაცემები წარმატებით განახლდა" });
    }

    // Try name+surname
    result = await collection.updateOne({ name, surname }, update);
    if (result.matchedCount > 0) {
      return NextResponse.json({ message: "მონაცემები წარმატებით განახლდა" });
    }

    return NextResponse.json({ message: "თანამშრომელი ვერ მოიძებნა" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ message: "განახლების შეცდომა: " + (error?.message || error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdate(req, params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdate(req, params);
}

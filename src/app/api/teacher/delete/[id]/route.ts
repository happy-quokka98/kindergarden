import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json({ message: "არასწორი ID" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("teachers");

    // 1. Try ObjectId
    if (ObjectId.isValid(id)) {
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount > 0) {
        return NextResponse.json({ message: "წაიშალა წარმატებით" });
      }
    }

    // 2. Try string _id
    let result = await collection.deleteOne({ _id: id as any });
    if (result.deletedCount > 0) {
      return NextResponse.json({ message: "წაიშალა წარმატებით" });
    }

    // 3. Try user_ID
    result = await collection.deleteOne({ user_ID: id });
    if (result.deletedCount > 0) {
      return NextResponse.json({ message: "წაიშალა წარმატებით" });
    }

    // 4. Try ID
    result = await collection.deleteOne({ ID: id });
    if (result.deletedCount > 0) {
      return NextResponse.json({ message: "წაიშალა წარმატებით" });
    }

    return NextResponse.json({ message: "თანამშრომელი ვერ მოიძებნა" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ message: "წაშლის შეცდომა: " + (error?.message || error) }, { status: 500 });
  }
}

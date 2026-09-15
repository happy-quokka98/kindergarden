import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const db = await getDb();
    const user = await db.collection("users").findOne({ user_ID: username });

    if (user && await bcrypt.compare(password, user.password)) {
      return NextResponse.json({ message: "ავტორიზაცია წარმატებით დასრულდა" });
    }

    return NextResponse.json({ message: "მომხმარებლის სახელი ან პაროლი არასწორია" }, { status: 401 });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "სერვერის შეცდომა: " + (error?.message || "მონაცემთა ბაზასთან კავშირი ვერ დამყარდა") },
      { status: 500 }
    );
  }
}

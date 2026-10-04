import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

const DEFAULT_ROUTINE_ITEMS = [
  { time_start: "08:30", time_end: "09:00", icon: "🌅", title: "აღსაზრდელების მიღება & დილის ვარჯიში", description: "დილის გამახურებელი ვარჯიში და მხიარული მუსიკა", day_of_week: 0 },
  { time_start: "09:00", time_end: "09:30", icon: "🍳", title: "საუზმე", description: "ჯანსაღი და გემრიელი საუზმე", day_of_week: 0 },
  { time_start: "09:30", time_end: "10:30", icon: "📚", title: "შემეცნებითი & განმავითარებელი მეცადინეობა", description: "ასაკობრივი ჯგუფის აქტივობები და გაკვეთილები", day_of_week: 0 },
  { time_start: "10:30", time_end: "11:30", icon: "⚽", title: "ეზოში სეირნობა & მოძრავი თამაშები", description: "სუფთა ჰაერზე ფიზიკური აქტივობა", day_of_week: 0 },
  { time_start: "11:30", time_end: "12:30", icon: "🧩", title: "შემოქმედებითი საათი (ხატვა / ძერწვა)", description: "ხელოვნებისა და წვრილი მოტორიკის განვითარება", day_of_week: 0 },
  { time_start: "12:30", time_end: "13:15", icon: "🍲", title: "სადილი", description: "ნოყიერი სადილი", day_of_week: 0 },
  { time_start: "13:30", time_end: "15:30", icon: "😴", title: "შუადღის ძილი & დასვენება", description: "მშვიდი ძილის საათები", day_of_week: 0 },
  { time_start: "16:00", time_end: "16:30", icon: "🍎", title: "სამხარი", description: "ხილი და სამხარი", day_of_week: 0 },
  { time_start: "16:30", time_end: "17:30", icon: "🎨", title: "თავისუფალი თამაში & შინ გაცილება", description: "თამაშები, შეჯამება და მშობლებთან შეხვედრა", day_of_week: 0 }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");
    const dayOfWeek = searchParams.get("day_of_week");

    if (!classId) {
      return NextResponse.json({ message: "class_id აუცილებელია" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("group_routines");

    const query: any = { class_id: classId };
    if (dayOfWeek !== null && dayOfWeek !== undefined) {
      const dayNum = Number(dayOfWeek);
      query.$or = [
        { day_of_week: dayNum },
        { day_of_week: 0 },
        { day_of_week: { $exists: false } },
        { day_of_week: null }
      ];
    }

    const items = await collection.find(query).sort({ time_start: 1 }).toArray();

    const formatted = items.map(item => ({
      ...item,
      _id: item._id.toString(),
      day_of_week: item.day_of_week !== undefined ? item.day_of_week : 0
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "შეცდომა მოხდა" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, class_id, time_start, time_end, title, description, icon, day_of_week } = body;

    if (!class_id) {
      return NextResponse.json({ message: "class_id აუცილებელია" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("group_routines");

    // Action: Seed default routine schedule items
    if (action === "seed_default") {
      await collection.deleteMany({ class_id });
      const docsToInsert = DEFAULT_ROUTINE_ITEMS.map((item, idx) => ({
        class_id,
        time_start: item.time_start,
        time_end: item.time_end,
        icon: item.icon,
        title: item.title,
        description: item.description,
        day_of_week: 0,
        order: idx + 1,
        created_at: new Date().toISOString()
      }));
      await collection.insertMany(docsToInsert);
      return NextResponse.json({ message: "ნაგულისხმევი განრიგი წარმატებით დაემატა", inserted: docsToInsert.length });
    }

    if (!title || !time_start) {
      return NextResponse.json({ message: "სათაური და დაწყების დრო აუცილებელია" }, { status: 400 });
    }

    const newItem = {
      class_id,
      time_start,
      time_end: time_end || time_start,
      title,
      description: description || "",
      icon: icon || "📅",
      day_of_week: day_of_week !== undefined && day_of_week !== null ? Number(day_of_week) : 0,
      created_at: new Date().toISOString()
    };

    const result = await collection.insertOne(newItem);

    return NextResponse.json({
      message: "დღის განრიგის აქტივობა წარმატებით დაემატა",
      item: { ...newItem, _id: result.insertedId.toString() }
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "შეცდომა მოხდა" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, id, time_start, time_end, title, description, icon, day_of_week } = body;
    const itemId = _id || id;

    if (!itemId || !ObjectId.isValid(itemId)) {
      return NextResponse.json({ message: "აქტივობის ID არასწორია" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("group_routines");

    const updateFields: any = {
      updated_at: new Date().toISOString()
    };
    if (time_start !== undefined) updateFields.time_start = time_start;
    if (time_end !== undefined) updateFields.time_end = time_end;
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (icon !== undefined) updateFields.icon = icon;
    if (day_of_week !== undefined) updateFields.day_of_week = day_of_week !== null ? Number(day_of_week) : null;

    const res = await collection.updateOne(
      { _id: new ObjectId(itemId) },
      { $set: updateFields }
    );

    if (res.matchedCount === 0) {
      return NextResponse.json({ message: "აქტივობა ვერ მოიძებნა" }, { status: 404 });
    }

    return NextResponse.json({ message: "დღის განრიგი წარმატებით განახლდა" });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "შეცდომა მოხდა" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id || body._id;
    }

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID არასწორია" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("group_routines");

    const res = await collection.deleteOne({ _id: new ObjectId(id) });

    if (res.deletedCount === 0) {
      return NextResponse.json({ message: "აქტივობა ვერ მოიძებნა" }, { status: 404 });
    }

    return NextResponse.json({ message: "აქტივობა წარმატებით წაიშალა" });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "შეცდომა მოხდა" }, { status: 500 });
  }
}

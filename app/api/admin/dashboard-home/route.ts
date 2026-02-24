import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

type HomeConfig = {
  indices?: Array<{
    name: string;
    value: number;
    change: number;
    changePct: number;
  }>;
  chart?: {
    title?: string;
    points: Array<{ x: string; y: number }>;
  };
  stocks?: Array<{
    symbol: string;
    name?: string;
    ltp: number;
    change: number;
    changePct: number;
  }>;
};

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("ajx_admin");
  return !!adminCookie && adminCookie.value === "ok";
}

export async function GET() {
  try {
    const ok = await requireAdmin();
    if (!ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const settings = db.collection("settings");

    const doc = await settings.findOne<{ value?: HomeConfig }>({
      key: "dashboard_home",
    });

    return NextResponse.json({ config: doc?.value || null });
  } catch (error) {
    console.error("Admin dashboard home get error:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard home" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const ok = await requireAdmin();
    if (!ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { config?: HomeConfig };
    const config = body?.config;

    if (!config) {
      return NextResponse.json(
        { message: "config is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const settings = db.collection("settings");

    await settings.updateOne(
      { key: "dashboard_home" },
      { $set: { value: config, updatedAt: new Date() } },
      { upsert: true },
    );

    return NextResponse.json({ message: "Dashboard home updated" });
  } catch (error) {
    console.error("Admin dashboard home save error:", error);
    return NextResponse.json(
      { message: "Failed to save dashboard home" },
      { status: 500 },
    );
  }
}

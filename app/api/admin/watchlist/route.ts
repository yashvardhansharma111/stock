import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

type WatchlistItem = {
  symbol: string;
  name?: string;
  ltp: number;
  change: number;
  changePct: number;
  details?: {
    about?: string;
    open?: number;
    high?: number;
    low?: number;
    prevClose?: number;
    chart?: Array<{ x: string; y: number }>;
  };
};

type WatchlistConfig = {
  items: WatchlistItem[];
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

    const doc = await settings.findOne<{ value?: WatchlistConfig }>({
      key: "dashboard_watchlist",
    });

    return NextResponse.json({ config: doc?.value || null });
  } catch (error) {
    console.error("Admin watchlist get error:", error);
    return NextResponse.json(
      { message: "Failed to fetch watchlist" },
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

    const body = (await request.json()) as { config?: WatchlistConfig };
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
      { key: "dashboard_watchlist" },
      { $set: { value: config, updatedAt: new Date() } },
      { upsert: true },
    );

    return NextResponse.json({ message: "Watchlist updated" });
  } catch (error) {
    console.error("Admin watchlist save error:", error);
    return NextResponse.json(
      { message: "Failed to save watchlist" },
      { status: 500 },
    );
  }
}

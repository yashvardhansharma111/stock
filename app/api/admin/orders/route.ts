import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

type OrderRow = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  status: "OPEN" | "CLOSED";
  time?: string;
};

type OrdersConfig = {
  summary?: {
    dayPnl: number;
    totalPnl: number;
  };
  orders: OrderRow[];
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

    const doc = await settings.findOne<{ value?: OrdersConfig }>({
      key: "dashboard_orders",
    });

    return NextResponse.json({ config: doc?.value || null });
  } catch (error) {
    console.error("Admin orders get error:", error);
    return NextResponse.json(
      { message: "Failed to fetch orders" },
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

    const body = (await request.json()) as { config?: OrdersConfig };
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
      { key: "dashboard_orders" },
      { $set: { value: config, updatedAt: new Date() } },
      { upsert: true },
    );

    return NextResponse.json({ message: "Orders updated" });
  } catch (error) {
    console.error("Admin orders save error:", error);
    return NextResponse.json(
      { message: "Failed to save orders" },
      { status: 500 },
    );
  }
}

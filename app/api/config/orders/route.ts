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

const defaultConfig: OrdersConfig = {
  summary: {
    dayPnl: 1250,
    totalPnl: -4200,
  },
  orders: [
    {
      id: "1",
      symbol: "RELIANCE",
      side: "BUY",
      qty: 10,
      avgPrice: 2825,
      ltp: 2850,
      pnl: 250,
      status: "OPEN",
      time: "11:05",
    },
    {
      id: "2",
      symbol: "TCS",
      side: "SELL",
      qty: 5,
      avgPrice: 3950,
      ltp: 3920,
      pnl: 150,
      status: "OPEN",
      time: "12:40",
    },
    {
      id: "3",
      symbol: "HDFCBANK",
      side: "BUY",
      qty: 20,
      avgPrice: 1560,
      ltp: 1540,
      pnl: -400,
      status: "CLOSED",
      time: "10:10",
    },
  ],
};

export async function GET() {
  try {
    const db = await getDb();
    const settings = db.collection("settings");

    const doc = await settings.findOne<{ value?: OrdersConfig }>({
      key: "dashboard_orders",
    });

    return NextResponse.json({ config: doc?.value || defaultConfig });
  } catch (error) {
    console.error("Config orders error:", error);
    return NextResponse.json(
      { message: "Failed to load orders" },
      { status: 500 },
    );
  }
}

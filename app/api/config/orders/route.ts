import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { readScopedConfig } from "@/lib/scoped-config";

type OrderSegment = {
  key: string;
  label: string;
};

type OrderRow = {
  id: string;
  segmentKey: string;
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
  segments: OrderSegment[];
  orders: OrderRow[];
};

const defaultConfig: OrdersConfig = {
  summary: {
    dayPnl: 1250,
    totalPnl: -4200,
  },
  segments: [
    { key: "positions", label: "Positions" },
    { key: "openOrders", label: "Open Orders" },
    { key: "baskets", label: "Baskets" },
    { key: "stockSip", label: "Stock SIP" },
    { key: "gtt", label: "GTT" },
  ],
  orders: [
    {
      id: "1",
      segmentKey: "positions",
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
      segmentKey: "openOrders",
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
      segmentKey: "positions",
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
    const user = await getUserFromSession();
    const userId = (user as { _id?: { toString(): string } } | null)?._id?.toString();

    const { config } = await readScopedConfig<OrdersConfig>({
      key: "dashboard_orders",
      userId: userId || null,
      fallback: defaultConfig,
    });

    const orders: OrderRow[] = Array.isArray(config.orders)
      ? config.orders
      : [];

    function computePnl(o: OrderRow) {
      const qty = Number(o.qty || 0);
      const avg = Number(o.avgPrice || 0);
      const ltp = Number(o.ltp || 0);
      if (o.side === "BUY") {
        return (ltp - avg) * qty;
      }
      return (avg - ltp) * qty;
    }

    const derivedSummary = {
      dayPnl: orders.reduce((a, o) => a + computePnl(o), 0),
      totalPnl: orders.reduce((a, o) => a + computePnl(o), 0),
    };

    return NextResponse.json({
      config: {
        ...config,
        summary: derivedSummary,
        segments:
          Array.isArray(config.segments) && config.segments.length > 0
            ? config.segments
            : defaultConfig.segments,
      },
    });
  } catch (error) {
    console.error("Config orders error:", error);
    return NextResponse.json(
      { message: "Failed to load orders" },
      { status: 500 },
    );
  }
}

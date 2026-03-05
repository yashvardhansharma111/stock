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
  market?: string;
  symbol: string;
  side: "BUY" | "SELL";
  productType?: string;
  optionType?: string;
  strikePrice?: number;
  exchange?: string;
  orderTag?: string;
  changePct?: number;
  filledLots?: number;
  totalLots?: number;
  orderPrice?: number;
  qty: number;
  lotSize?: number;
  startDate?: string;
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
      market: "NSE",
      symbol: "RELIANCE",
      side: "BUY",
      productType: "Delivery",
      optionType: "CE",
      strikePrice: 24850,
      exchange: "NSEFO",
      orderTag: "Amo Submitted",
      changePct: 0,
      filledLots: 0,
      totalLots: 1,
      orderPrice: 293.1,
      qty: 10,
      lotSize: 1,
      startDate: "2024-01-01",
      avgPrice: 2825,
      ltp: 2850,
      pnl: 250,
      status: "OPEN",
      time: "11:05",
    },
    {
      id: "2",
      segmentKey: "openOrders",
      market: "NSE",
      symbol: "TCS",
      side: "SELL",
      productType: "Delivery",
      qty: 5,
      lotSize: 1,
      startDate: "2024-01-02",
      avgPrice: 3950,
      ltp: 3920,
      pnl: 150,
      status: "OPEN",
      time: "12:40",
    },
    {
      id: "3",
      segmentKey: "positions",
      market: "NSE",
      symbol: "HDFCBANK",
      side: "BUY",
      productType: "Delivery",
      qty: 20,
      lotSize: 1,
      startDate: "2024-01-03",
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
      const lots = Number(o.qty || 0);
      const lotSize = Number(o.lotSize || 1);
      const qty = lots * lotSize;
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

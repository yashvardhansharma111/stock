import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteScopedConfig, readScopedConfig, upsertScopedConfig } from "@/lib/scoped-config";
import { broadcastEvent } from "@/lib/event-bus";

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
  buyPrice?: number;
  sellPrice?: number;
  lots?: number;
  pnlManual?: boolean;
  pnlPct?: number;
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

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("ajx_admin");
  return !!adminCookie && adminCookie.value === "ok";
}

function getScopeUserId(request: Request) {
  const { searchParams } = new URL(request.url);
  return searchParams.get("scopeUserId");
}

export async function GET(request: Request) {
  try {
    const ok = await requireAdmin();
    if (!ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const scopeUserId = getScopeUserId(request);
    const { config, source } = await readScopedConfig<OrdersConfig>({
      key: "dashboard_orders",
      userId: scopeUserId,
      fallback: {
        summary: { dayPnl: 0, totalPnl: 0 },
        segments: [],
        orders: [],
      },
    });

    // derive summary from rows if present
    const orders: OrderRow[] = Array.isArray(config.orders) ? config.orders : [];
    function computePnl(o: OrderRow) {
      if (o.pnlManual && typeof o.pnl === "number" && Number.isFinite(o.pnl)) {
        return o.pnl;
      }

      const lots = Number(o.lots ?? o.qty ?? 0);
      const buy = Number(o.buyPrice ?? o.avgPrice ?? 0);
      const sell = Number(o.sellPrice ?? o.ltp ?? 0);

      if (o.side === "SELL") {
        return (buy - sell) * lots;
      }
      return (sell - buy) * lots;
    }
    const derivedSummary = {
      dayPnl: orders.reduce((a, o) => a + computePnl(o), 0),
      totalPnl: orders.reduce((a, o) => a + computePnl(o), 0),
    };

    return NextResponse.json({
      config: { ...config, summary: derivedSummary },
      source,
      scopeUserId: scopeUserId || null,
    });
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

    const body = (await request.json()) as {
      config?: OrdersConfig;
      scopeUserId?: string | null;
    };
    const config = body?.config;

    if (!config) {
      return NextResponse.json(
        { message: "config is required" },
        { status: 400 },
      );
    }

    await upsertScopedConfig<OrdersConfig>({
      key: "dashboard_orders",
      userId: body.scopeUserId || null,
      config,
    });

    // notify connected dashboards (development-friendly in-memory broadcast)
    try {
      broadcastEvent({ type: "orders:update", config, scopeUserId: body.scopeUserId || null });
    } catch (err) {
      // don't fail the request if broadcasting fails
      console.error("Broadcast error:", err);
    }

    return NextResponse.json({ message: "Orders updated" });
  } catch (error) {
    console.error("Admin orders save error:", error);
    return NextResponse.json(
      { message: "Failed to save orders" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const ok = await requireAdmin();
    if (!ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const scopeUserId = getScopeUserId(request);
    await deleteScopedConfig({ key: "dashboard_orders", userId: scopeUserId });

    return NextResponse.json({ message: "Orders config deleted" });
  } catch (error) {
    console.error("Admin orders delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete orders" },
      { status: 500 },
    );
  }
}

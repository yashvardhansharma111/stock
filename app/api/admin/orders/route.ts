import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteScopedConfig, readScopedConfig, upsertScopedConfig } from "@/lib/scoped-config";

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

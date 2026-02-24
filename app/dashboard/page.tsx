'use client';

import { useEffect, useMemo, useState } from "react";
import { AiFillHome } from "react-icons/ai";
import { BsBookmarkStarFill } from "react-icons/bs";
import { FaChartBar, FaCoins, FaRegUserCircle } from "react-icons/fa";
import { HiReceiptPercent } from "react-icons/hi2";
import { MdAccountBalanceWallet } from "react-icons/md";
import { PiBankFill } from "react-icons/pi";

type TabKey = "home" | "watchlist" | "orders" | "funds" | "profile";

type DashboardUser = {
  fullName?: string;
  email?: string;
  phone?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  tradingBalance: number;
  margin: number;
};

type FundRequestResponse = {
  message: string;
};

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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrImgFailed, setQrImgFailed] = useState(false);

  const [homeConfig, setHomeConfig] = useState<HomeConfig | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ordersConfig, setOrdersConfig] = useState<OrdersConfig | null>(null);
  const [showIndexPopup, setShowIndexPopup] = useState(false);
  const [activeShortcut, setActiveShortcut] = useState<
    "ipo" | "mutual" | "etf" | "sgb"
  >("ipo");
  const [chartTick, setChartTick] = useState(0);

  const [fundAmount, setFundAmount] = useState("");
  const [fundReference, setFundReference] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [fundMessage, setFundMessage] = useState<string | null>(null);
  const [fundError, setFundError] = useState<string | null>(null);
  const [fundSubmitting, setFundSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const [meRes, qrRes, homeRes, ordersRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/config/fund-qr"),
          fetch("/api/config/dashboard-home"),
          fetch("/api/config/orders"),
        ]);

        if (meRes.status === 401) {
          setError("Please login first.");
          setLoading(false);
          return;
        }

        const meData = await meRes.json();
        if (!meRes.ok) {
          throw new Error(meData.message || "Failed to load user");
        }

        const qrData = await qrRes.json();
        const homeData = await homeRes.json();
        const ordersData = await ordersRes.json();

        setUser({
          fullName: meData.user.fullName,
          email: meData.user.email,
          phone: meData.user.phone,
          panNumber: meData.user.panNumber,
          aadhaarNumber: meData.user.aadhaarNumber,
          tradingBalance: meData.user.tradingBalance ?? 0,
          margin: meData.user.margin ?? 0,
        });
        setQrUrl(qrData.qrUrl || null);
        setQrImgFailed(false);
        setHomeConfig(homeData.config || null);
        setOrdersConfig(ordersData.config || null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    if ((homeConfig?.indices || []).length > 0) {
      setSelectedIndex(0);
    }
  }, [homeConfig]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setChartTick((v) => (v + 1) % 1_000_000);
    }, 2500);
    return () => window.clearInterval(id);
  }, []);

  const money = useMemo(() => {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
  }, []);

  function makeAutoPoints(base: number, wiggle: number, count: number, seed: number) {
    const now = Date.now();

    function mulberry32(a: number) {
      return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const rnd = mulberry32(seed);
    const step = Math.max(1, wiggle / 6);
    let y = base + (rnd() - 0.5) * wiggle;
    const points: Array<{ x: string; y: number }> = [];

    for (let i = 0; i < count; i++) {
      const dir = rnd() > 0.5 ? 1 : -1;
      const jump = (0.35 + rnd() * 0.9) * step;
      y = y + dir * jump;

      const x = new Date(now - (count - 1 - i) * 60 * 60 * 1000)
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        .replace(" ", "");
      points.push({ x, y: Number(y.toFixed(2)) });
    }

    return points;
  }

  function formatSigned(num: number) {
    const sign = num > 0 ? "+" : "";
    return `${sign}${money.format(num)}`;
  }

  function formatSignedPct(num: number) {
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}%`;
  }

  async function handleFundSubmit() {
    setFundSubmitting(true);
    setFundMessage(null);
    setFundError(null);
    try {
      const res = await fetch("/api/funds/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(fundAmount),
          method: "upi",
          reference: fundReference,
          note: fundNote,
        }),
      });
      const data: FundRequestResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit request");
      }

      setFundMessage(data.message);
      setFundAmount("");
      setFundReference("");
      setFundNote("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setFundError(msg);
    } finally {
      setFundSubmitting(false);
    }
  }

  function Chart({ points }: { points: Array<{ x: string; y: number }> }) {
    const values = points.map((p) => p.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const w = 320;
    const h = 110;
    const pad = 10;
    const range = max - min || 1;
    const coords = points.map((p, i) => {
      const x = pad + (i * (w - pad * 2)) / Math.max(points.length - 1, 1);
      const y = pad + (h - pad * 2) * (1 - (p.y - min) / range);
      return { x, y, rawX: p.x, rawY: p.y };
    });

    const d = coords
      .map((p, i) => {
        return `${p.x},${p.y}`;
      })
      .join(" ");

    const area = `${pad},${h - pad} ${d} ${w - pad},${h - pad}`;

    const yTop = Math.round(max);
    const yMid = Math.round((max + min) / 2);
    const yBot = Math.round(min);

    const xLeft = coords[0]?.rawX || "";
    const xMid = coords[Math.floor(coords.length / 2)]?.rawX || "";
    const xRight = coords[coords.length - 1]?.rawX || "";

    const dot = coords[coords.length - 1] || null;

    return (
      <svg viewBox={`0 0 ${w + 70} ${h + 22}`} className="h-40 w-full">
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform={`translate(0,0)`}>
          <polyline
            points={area}
            fill="url(#chartFill)"
            stroke="none"
          />
          <polyline
            points={d}
            fill="none"
            stroke="#0b4ea2"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {dot ? (
            <circle
              cx={dot.x}
              cy={dot.y}
              r="4"
              className="ajx-chart-dot"
              fill="#0b4ea2"
            />
          ) : null}
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e2e8f0" />
        </g>

        <g transform={`translate(${w + 10},${pad})`} className="fill-slate-500">
          <text x="0" y="0" fontSize="10">{money.format(yTop)}</text>
          <text x="0" y={(h - pad * 2) / 2} fontSize="10">{money.format(yMid)}</text>
          <text x="0" y={h - pad * 2} fontSize="10">{money.format(yBot)}</text>
        </g>

        <g transform={`translate(${pad},${h + 16})`} className="fill-slate-500">
          <text x="0" y="0" fontSize="10">{xLeft}</text>
          <text x={(w - pad * 2) / 2 - 10} y="0" fontSize="10">{xMid}</text>
          <text x={w - pad * 2 - 28} y="0" fontSize="10">{xRight}</text>
        </g>
      </svg>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <p className="mb-3 text-sm text-rose-600">
          {error || "Unable to load dashboard"}
        </p>
        <a
          href="/login"
          className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white"
        >
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <style jsx global>{`
        @keyframes ajxDotPulse {
          0% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.6);
            opacity: 0.35;
          }
          100% {
            transform: scale(1);
            opacity: 0.9;
          }
        }
        .ajx-chart-dot {
          transform-origin: center;
          animation: ajxDotPulse 1.1s ease-in-out infinite;
        }

        @keyframes ajxDrawerIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .ajx-drawer {
          animation: ajxDrawerIn 220ms ease-out;
        }

        @keyframes ajxToastIn {
          from {
            transform: translateY(-8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .ajx-toast {
          animation: ajxToastIn 160ms ease-out;
        }
      `}</style>
      {/* Top app bar */}
      <header className="bg-sky-600 px-4 pb-4 pt-3 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowIndexPopup(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900"
            >
              <span className="h-3 w-3 border-t-2 border-b-2 border-white" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/logo.jpeg"
                alt="Ajmeraexchange"
                className="h-7 w-7 rounded-full bg-white object-cover"
              />
              <h1 className="text-lg font-semibold">Ajmeraexchange</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-sky-500 text-xs font-semibold uppercase flex items-center justify-center">
              {user.fullName?.[0] || "U"}
            </span>
          </div>
        </div>
      </header>

      <main className="px-4 pt-3">
        {activeTab === "home" && (
          <div className="space-y-4">
            <section className="-mt-8 rounded-3xl bg-white p-4 shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  Hi, {user.fullName || "Trader"}
                </p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Trading Balance</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    ₹ {money.format(user.tradingBalance)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">
                    Margin ({user.margin.toFixed(2)}X)
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    ₹ {money.format(user.tradingBalance)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-3 text-sm">
                <button className="flex-1 rounded-full bg-rose-500 py-2 text-xs font-semibold text-white">
                  Withdraw
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("funds")}
                  className="flex-1 rounded-full bg-emerald-500 py-2 text-xs font-semibold text-white"
                >
                  Add Fund
                </button>
              </div>

              <div className="mt-5">
                <h2 className="mb-2 text-xs font-semibold text-slate-700">
                  Reports &amp; Statement
                </h2>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button className="rounded-xl border border-slate-200 bg-slate-50 py-3 font-medium text-slate-700">
                    Trades &amp; Charges
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-slate-50 py-3 font-medium text-slate-700">
                    Profit &amp; Loss
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-slate-50 py-3 font-medium text-slate-700">
                    Statement / Ledger
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-slate-50 py-3 font-medium text-slate-700">
                    Fund Transaction
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-3 shadow-sm">
              {(() => {
                const indices = homeConfig?.indices || [];
                const tabs = indices.slice(0, 2);
                const idx = indices[selectedIndex];
                if (!idx) {
                  return <p className="text-xs text-slate-500">No index data.</p>;
                }
                const positive = idx.change >= 0;
                return (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-700">
                        Market Overview
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowIndexPopup(true)}
                        className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white"
                      >
                        {tabs[0]?.name || "Index"}
                      </button>
                    </div>
                      <p className="text-[11px] font-semibold text-slate-700">
                        {homeConfig?.chart?.title || "Chart"}
                      </p>
                      <div className="mt-2 flex gap-2 text-[11px]">
                        {["Day", "Month", "Year"].map((k) => (
                          <span
                            key={k}
                            className={`rounded-full px-3 py-1 font-semibold ${
                              k === "Day"
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2">
                        {homeConfig?.chart?.points?.length ? (
                          <Chart points={homeConfig.chart.points} />
                        ) : (
                          <p className="text-xs text-slate-500">No chart data.</p>
                        )}
                      </div>
                  </div>
                );
              })()}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-3">
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveShortcut("ipo")}
                  className={`rounded-2xl py-3 ${
                    activeShortcut === "ipo"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <FaChartBar
                    className={`mx-auto h-5 w-5 ${
                      activeShortcut === "ipo" ? "text-white" : "text-sky-600"
                    }`}
                  />
                  <p className="mt-1 font-medium">IPO</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShortcut("mutual")}
                  className={`rounded-2xl py-3 ${
                    activeShortcut === "mutual"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <PiBankFill
                    className={`mx-auto h-5 w-5 ${
                      activeShortcut === "mutual"
                        ? "text-white"
                        : "text-emerald-600"
                    }`}
                  />
                  <p className="mt-1 font-medium">Mutual Fund</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShortcut("etf")}
                  className={`rounded-2xl py-3 ${
                    activeShortcut === "etf"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <FaCoins
                    className={`mx-auto h-5 w-5 ${
                      activeShortcut === "etf" ? "text-white" : "text-amber-600"
                    }`}
                  />
                  <p className="mt-1 font-medium">ETF</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShortcut("sgb")}
                  className={`rounded-2xl py-3 ${
                    activeShortcut === "sgb"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <FaCoins
                    className={`mx-auto h-5 w-5 ${
                      activeShortcut === "sgb" ? "text-white" : "text-rose-600"
                    }`}
                  />
                  <p className="mt-1 font-medium">SGB</p>
                </button>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs">
                {activeShortcut === "ipo" && (
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-800">Upcoming IPOs</p>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-700">Ajmera Infra</span>
                      <span className="text-slate-500">Opens: Mon</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-700">AE Finserve</span>
                      <span className="text-slate-500">Opens: Thu</span>
                    </div>
                  </div>
                )}
                {activeShortcut === "mutual" && (
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-800">Top Mutual Funds</p>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-700">AE Bluechip</span>
                      <span className="text-emerald-600">+0.84%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-700">Ajmera Midcap</span>
                      <span className="text-emerald-600">+0.42%</span>
                    </div>
                  </div>
                )}
                {activeShortcut === "etf" && (
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-800">ETFs</p>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-700">AE Nifty ETF</span>
                      <span className="text-rose-600">-0.12%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-700">AE Gold ETF</span>
                      <span className="text-emerald-600">+0.33%</span>
                    </div>
                  </div>
                )}
                {activeShortcut === "sgb" && (
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-800">SGB</p>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-700">SGB 2026 Series</span>
                      <span className="text-slate-500">Rate: 2.5%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-700">SGB 2027 Series</span>
                      <span className="text-slate-500">Rate: 2.5%</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <h2 className="text-xs font-semibold text-slate-700">Indices</h2>
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#0b2a57] text-white">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Change</th>
                      <th className="px-3 py-2">%Change</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {(homeConfig?.indices || []).map((idx) => {
                      const positive = idx.change >= 0;
                      return (
                        <tr key={idx.name} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {idx.name}
                          </td>
                          <td className="px-3 py-2 text-slate-800">
                            {money.format(idx.value)}
                          </td>
                          <td
                            className={`px-3 py-2 font-semibold ${
                              positive ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {formatSigned(idx.change)}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex min-w-[48px] justify-center rounded-full px-2 py-0.5 font-semibold ${
                                positive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {idx.changePct.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <h2 className="text-xs font-semibold text-slate-700">Charts</h2>
              <div className="mt-3 grid gap-3">
                {(homeConfig?.indices || []).slice(0, 3).map((idx, i) => (
                  <div
                    key={idx.name}
                    className="rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800">{idx.name}</p>
                      <p className="text-xs font-semibold text-slate-800">
                        {money.format(idx.value)}
                      </p>
                    </div>
                    <div className="mt-2">
                      <Chart
                        points={makeAutoPoints(
                          idx.value,
                          Math.max(6, Math.abs(idx.change) * 3),
                          18,
                          chartTick + (i + 1) * 101,
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "watchlist" && (
          <div className="space-y-3">
            <section className="-mt-8 rounded-3xl bg-white p-4 shadow-md">
              <h2 className="text-sm font-semibold text-slate-800">Watchlist</h2>
              <p className="mt-1 text-[11px] text-slate-500">Moneycontrol view.</p>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <iframe
                title="Moneycontrol"
                src="https://www.moneycontrol.com/"
                className="h-[70vh] w-full"
              />
            </section>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-3">
            <section className="-mt-8 rounded-3xl bg-white p-4 shadow-md">
              <h2 className="text-sm font-semibold text-slate-800">Orders</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-slate-500">Day P/L</p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      (ordersConfig?.summary?.dayPnl ?? 0) >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    ₹ {money.format(ordersConfig?.summary?.dayPnl ?? 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-slate-500">Total P/L</p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      (ordersConfig?.summary?.totalPnl ?? 0) >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    ₹ {money.format(ordersConfig?.summary?.totalPnl ?? 0)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-2">
              <ul className="divide-y divide-slate-100">
                {(ordersConfig?.orders || []).map((o) => {
                  const positive = o.pnl >= 0;
                  return (
                    <li key={o.id} className="px-3 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {o.symbol} · {o.side}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Qty {o.qty} · Avg {money.format(o.avgPrice)} · LTP {money.format(o.ltp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xs font-semibold ${
                              positive ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            ₹ {money.format(o.pnl)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {o.status}{o.time ? ` · ${o.time}` : ""}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        )}

        {activeTab === "funds" && (
          <div className="space-y-3">
            <section className="-mt-8 rounded-3xl bg-white p-4 shadow-md">
              <h2 className="text-sm font-semibold text-slate-800">Add Funds</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Scan the QR and submit payment details.
              </p>
            </section>

            <section className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Trading Balance</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    ₹ {money.format(user.tradingBalance)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">
                    Margin ({user.margin.toFixed(2)}X)
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    ₹ {money.format(user.tradingBalance)}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <h2 className="mb-2 text-xs font-semibold text-slate-700">
                  Reports &amp; Statement
                </h2>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button className="rounded-xl border border-slate-200 bg-slate-50 py-3 font-medium text-slate-700">
                    Trades &amp; Charges
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-slate-50 py-3 font-medium text-slate-700">
                    Profit &amp; Loss
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-slate-50 py-3 font-medium text-slate-700">
                    Statement / Ledger
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-slate-50 py-3 font-medium text-slate-700">
                    Fund Transaction
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              {qrUrl && !qrImgFailed ? (
                <div className="mb-3 flex justify-center">
                  <img
                    src={`${qrUrl}${qrUrl.includes("?") ? "&" : "?"}t=${Date.now()}`}
                    alt="Payment QR"
                    className="h-44 w-44 rounded-2xl border border-slate-200 object-contain"
                    onError={() => setQrImgFailed(true)}
                  />
                </div>
              ) : (
                <p className="mb-3 text-xs text-amber-600">
                  QR code is not available. Please contact admin.
                </p>
              )}

              <div className="space-y-2 text-xs">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                    placeholder="Enter amount you paid"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    UPI / Transaction Reference
                  </label>
                  <input
                    type="text"
                    value={fundReference}
                    onChange={(e) => setFundReference(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                    placeholder="Enter UPI reference or transaction ID"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={fundNote}
                    onChange={(e) => setFundNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                    placeholder="e.g. From UPI ID, bank name, etc."
                  />
                </div>
              </div>

              {fundError && (
                <p className="mt-2 text-[11px] font-medium text-rose-600">
                  {fundError}
                </p>
              )}
              {fundMessage && (
                <p className="mt-2 text-[11px] font-medium text-emerald-600">
                  {fundMessage}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleFundSubmit()}
                disabled={fundSubmitting}
                className="mt-3 w-full rounded-full bg-emerald-500 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {fundSubmitting ? "Submitting..." : "Submit Fund Details"}
              </button>
            </section>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-3">
            <section className="-mt-8 rounded-3xl bg-white p-4 shadow-md">
              <h2 className="text-sm font-semibold text-slate-800">Profile</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Your account details.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-slate-800">
                    {user.fullName || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slate-800">
                    {user.email || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-semibold text-slate-800">
                    {user.phone || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">PAN</span>
                  <span className="font-semibold text-slate-800">
                    {user.panNumber || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Aadhaar</span>
                  <span className="font-semibold text-slate-800">
                    {user.aadhaarNumber || "-"}
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-2 text-[10px] text-slate-500">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center ${
              activeTab === "home" ? "text-sky-600" : ""
            }`}
          >
            <AiFillHome className="mb-0.5 h-5 w-5" />
            <span className="font-semibold">Home</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("watchlist")}
            className={`flex flex-col items-center ${
              activeTab === "watchlist" ? "text-sky-600" : ""
            }`}
          >
            <BsBookmarkStarFill className="mb-0.5 h-5 w-5" />
            <span>Watchlist</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex flex-col items-center ${
              activeTab === "orders" ? "text-sky-600" : ""
            }`}
          >
            <HiReceiptPercent className="mb-0.5 h-5 w-5" />
            <span>Orders</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("funds")}
            className={`flex flex-col items-center ${
              activeTab === "funds" ? "text-sky-600" : ""
            }`}
          >
            <MdAccountBalanceWallet className="mb-0.5 h-5 w-5" />
            <span>Funds</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center ${
              activeTab === "profile" ? "text-sky-600" : ""
            }`}
          >
            <FaRegUserCircle className="mb-0.5 h-5 w-5" />
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {showIndexPopup && (
        <div className="ajx-toast fixed left-4 top-[84px] z-30 w-[86%] max-w-xs rounded-2xl bg-slate-900 p-3 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Market</p>
            <button
              type="button"
              onClick={() => setShowIndexPopup(false)}
              className="text-xs font-semibold text-white/80"
            >
              Close
            </button>
          </div>

          {(() => {
            const indices = homeConfig?.indices || [];
            const tabs = indices.slice(0, 2);
            const idx = indices[selectedIndex];
            if (!idx) return null;
            const positive = idx.change >= 0;
            return (
              <>
                <div className="mt-3 flex w-full overflow-hidden rounded-lg bg-white/10">
                  {tabs.map((t, i) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setSelectedIndex(i)}
                      className={`flex-1 px-3 py-1 text-[11px] font-semibold ${
                        selectedIndex === i
                          ? "bg-white text-slate-900"
                          : "text-white"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  <p className="text-2xl font-semibold leading-none text-white">
                    {money.format(idx.value)}
                  </p>
                  <p
                    className={`mt-1 text-[11px] font-semibold ${
                      positive ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {formatSigned(idx.change)} ({formatSignedPct(idx.changePct)})
                  </p>
                </div>
              </>
            );
          })()}

          <div className="mt-3 grid max-h-[40vh] gap-2 overflow-auto pr-1">
            {(homeConfig?.indices || []).slice(0, 10).map((idx, i) => {
              const positive = idx.change >= 0;
              return (
                <button
                  key={idx.name}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(i);
                    setShowIndexPopup(false);
                  }}
                  className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 text-left"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">{idx.name}</p>
                    <p className="text-[11px] text-white/70">
                      {money.format(idx.value)}
                    </p>
                  </div>
                  <p
                    className={`text-[11px] font-semibold ${
                      positive ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {formatSignedPct(idx.changePct)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


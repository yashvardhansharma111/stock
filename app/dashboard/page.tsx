'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { AiFillHome } from "react-icons/ai";
import { BsBookmarkStarFill } from "react-icons/bs";
import {
  FaChartBar,
  FaCoins,
  FaRegUserCircle,
  FaChevronDown,
  FaChevronRight,
  FaSignOutAlt,
  FaCog,
  FaRegEdit,
} from "react-icons/fa";
import { HiReceiptPercent } from "react-icons/hi2";
import { MdAccountBalanceWallet, MdOutlineManageAccounts } from "react-icons/md";
import { PiBankFill } from "react-icons/pi";

type TabKey = "home" | "watchlist" | "orders" | "funds" | "profile" | "settings";

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

type OrderRow = {
  id: string;
  segmentKey: string;
  market?: string;
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
  segments: Array<{
    key: string;
    label: string;
  }>;
  orders: OrderRow[];
};

type FundPaymentMeta = {
  upiId?: string | null;
  bankName?: string | null;
  accountHolder?: string | null;
  accountNumber?: string | null;
  ifsc?: string | null;
};

type MarketCard = {
  symbol: string;
  name: string;
  price: number;
  yearlyChange: number;
  yearlyChangePct: number;
  chartBase: number;
  chartWiggle: number;
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [userPhotoFailed, setUserPhotoFailed] = useState(false);
  const [activeShortcut, setActiveShortcut] = useState<
    "ipo" | "mutual" | "etf" | "sgb"
  >("ipo");
  const [chartTick, setChartTick] = useState(0);
  const [selectedGlobalSymbol, setSelectedGlobalSymbol] = useState("AAPL");
  const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState("BTCUSD");
  const [activeOrderTool, setActiveOrderTool] = useState("positions");
  const [showOrderGainSheet, setShowOrderGainSheet] = useState(true);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [fundMethod, setFundMethod] = useState<"upi" | "netbanking">("upi");
  const [paymentMeta, setPaymentMeta] = useState<FundPaymentMeta | null>(null);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

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
        // fetch user first so we can show basic UI quickly
        const meRes = await fetch("/api/auth/me");
        if (meRes.status === 401) {
          setError("Please login first.");
          setLoading(false);
          return;
        }
        const meData = await meRes.json();
        if (!meRes.ok) {
          throw new Error(meData.message || "Failed to load user");
        }
        setUser({
          fullName: meData.user.fullName,
          email: meData.user.email,
          phone: meData.user.phone,
          panNumber: meData.user.panNumber,
          aadhaarNumber: meData.user.aadhaarNumber,
          tradingBalance: meData.user.tradingBalance ?? 0,
          margin: meData.user.margin ?? 0,
        });
        setUserPhotoUrl(`/api/auth/photo?t=${Date.now()}`);
        setUserPhotoFailed(false);
        // user data done, hide loader now
        setLoading(false);

        // now fetch other configs in background
        const [qrRes, homeRes, ordersRes] = await Promise.all([
          fetch("/api/config/fund-qr"),
          fetch("/api/config/dashboard-home"),
          fetch("/api/config/orders"),
        ]);
        const qrData = await qrRes.json();
        const homeData = await homeRes.json();
        const ordersData = await ordersRes.json();

        setQrUrl(qrData.qrUrl || null);
        setPaymentMeta(qrData.paymentMeta || null);
        setQrImgFailed(false);
        setHomeConfig(homeData.config || null);
        const incomingOrders = ordersData.config || null;
        setOrdersConfig(
          incomingOrders
            ? {
                ...incomingOrders,
                segments:
                  Array.isArray(incomingOrders.segments) &&
                  incomingOrders.segments.length > 0
                    ? incomingOrders.segments
                    : [
                        { key: "positions", label: "Positions" },
                        { key: "openOrders", label: "Open Orders" },
                        { key: "baskets", label: "Baskets" },
                        { key: "stockSip", label: "Stock SIP" },
                        { key: "gtt", label: "GTT" },
                      ],
                orders: Array.isArray(incomingOrders.orders)
                  ? incomingOrders.orders.map((row: OrderRow) => ({
                      ...row,
                      segmentKey: row.segmentKey || "positions",
                    }))
                  : [],
              }
            : null,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
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

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const firstSegment = ordersConfig?.segments?.[0]?.key;
    if (firstSegment) {
      setActiveOrderTool(firstSegment);
    }
  }, [ordersConfig]);

  const money = useMemo(() => {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
  }, []);

  const globalMarkets = useMemo<MarketCard[]>(
    () => [
      {
        symbol: "AAPL",
        name: "Apple Inc",
        price: 272.95,
        yearlyChange: 32.59,
        yearlyChangePct: 13.56,
        chartBase: 236,
        chartWiggle: 55,
      },
      {
        symbol: "GOOGL",
        name: "Alphabet Inc",
        price: 176.82,
        yearlyChange: 19.27,
        yearlyChangePct: 12.23,
        chartBase: 163,
        chartWiggle: 42,
      },
      {
        symbol: "MSFT",
        name: "Microsoft",
        price: 418.11,
        yearlyChange: 68.5,
        yearlyChangePct: 19.59,
        chartBase: 368,
        chartWiggle: 78,
      },
      {
        symbol: "TSLA",
        name: "Tesla",
        price: 186.2,
        yearlyChange: -24.15,
        yearlyChangePct: -11.48,
        chartBase: 212,
        chartWiggle: 85,
      },
    ],
    [],
  );

  const cryptoMarkets = useMemo<MarketCard[]>(
    () => [
      {
        symbol: "BTCUSD",
        name: "Bitcoin / U.S. Dollar",
        price: 67836,
        yearlyChange: -16803,
        yearlyChangePct: -19.85,
        chartBase: 91500,
        chartWiggle: 30000,
      },
      {
        symbol: "ETHUSD",
        name: "Ethereum / U.S. Dollar",
        price: 3490,
        yearlyChange: -604,
        yearlyChangePct: -14.76,
        chartBase: 3650,
        chartWiggle: 1300,
      },
      {
        symbol: "XRPUSD",
        name: "Ripple / U.S. Dollar",
        price: 0.62,
        yearlyChange: 0.12,
        yearlyChangePct: 24.0,
        chartBase: 0.56,
        chartWiggle: 0.34,
      },
      {
        symbol: "LTCUSD",
        name: "Litecoin / U.S. Dollar",
        price: 91.55,
        yearlyChange: 5.92,
        yearlyChangePct: 6.91,
        chartBase: 85,
        chartWiggle: 34,
      },
    ],
    [],
  );

  const selectedGlobalMarket =
    globalMarkets.find((item) => item.symbol === selectedGlobalSymbol) ||
    globalMarkets[0];
  const selectedCryptoMarket =
    cryptoMarkets.find((item) => item.symbol === selectedCryptoSymbol) ||
    cryptoMarkets[0];
  const fundPresets = [2300, 1800, 1100, 900];
  const reportCards = [
    {
      title: "Trades and Charges",
      description: "View all your trades and brokerage details",
    },
    {
      title: "Profit & Loss",
      description: "Track your portfolio performance",
    },
    {
      title: "Statement / Ledger",
      description: "Download your account statement",
    },
    {
      title: "Fund Transactions",
      description: "View all your fund transfers",
    },
    {
      title: "Monthly Report",
      description: "Get your monthly summary",
    },
  ];
  const orderSegments =
    ordersConfig?.segments && ordersConfig.segments.length > 0
      ? ordersConfig.segments
      : [
          { key: "positions", label: "Positions" },
          { key: "openOrders", label: "Open Orders" },
          { key: "baskets", label: "Baskets" },
          { key: "stockSip", label: "Stock SIP" },
          { key: "gtt", label: "GTT" },
        ];

  // determine available markets from orders
  const availableMarkets = Array.from(
    new Set((ordersConfig?.orders || []).map((o) => o.market || "NSE")),
  );
  const [activeOrderMarket, setActiveOrderMarket] = useState<string>(
    availableMarkets[0] || "NSE",
  );

  useEffect(() => {
    if (availableMarkets.length > 0 && !availableMarkets.includes(activeOrderMarket)) {
      setActiveOrderMarket(availableMarkets[0]);
    }
  }, [availableMarkets]);

  const filteredOrders = useMemo(() => {
    return (ordersConfig?.orders || [])
      .filter(
        (o) =>
          (o.segmentKey || "positions") === activeOrderTool &&
          (activeOrderMarket ? (o.market || "NSE") === activeOrderMarket : true),
      )
      .map((o) => ({
        ...o,
        pnl: o.pnl !== undefined ? o.pnl : computePnl(o),
      }));
  }, [ordersConfig, activeOrderTool, activeOrderMarket]);
  const reportDetailLines = useMemo(() => {
    if (!activeReport) return [] as string[];
    if (activeReport === "Trades and Charges") {
      return [
        `Total entries: ${(ordersConfig?.orders || []).length}`,
        `Open positions: ${(ordersConfig?.orders || []).filter((o) => o.status === "OPEN").length}`,
      ];
    }
    if (activeReport === "Profit & Loss") {
      return [
        `Day P/L: ₹ ${money.format(ordersConfig?.summary?.dayPnl ?? 0)}`,
        `Total P/L: ₹ ${money.format(ordersConfig?.summary?.totalPnl ?? 0)}`,
      ];
    }
    if (activeReport === "Statement / Ledger") {
      return [
        `Latest balance: ₹ ${money.format(user?.tradingBalance ?? 0)}`,
        `Margin configured: ${(user?.margin ?? 0).toFixed(2)}X`,
      ];
    }
    if (activeReport === "Fund Transactions") {
      return [
        `Last entered amount: ₹ ${money.format(Number(fundAmount || 0))}`,
        `Reference: ${fundReference || "-"}`,
      ];
    }
    return [
      `User: ${user?.fullName || "Trader"}`,
      `Email: ${user?.email || "-"}`,
    ];
  }, [activeReport, fundAmount, fundReference, money, ordersConfig, user]);

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

  function computePnl(o: OrderRow) {
    const qty = Number(o.qty || 0);
    const avg = Number(o.avgPrice || 0);
    const ltp = Number(o.ltp || 0);
    if (o.side === "BUY") {
      return (ltp - avg) * qty;
    }
    return (avg - ltp) * qty;
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
          type: "add",
          method: fundMethod,
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
      setShowAddFundsModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setFundError(msg);
    } finally {
      setFundSubmitting(false);
    }
  }

  async function handleWithdrawSubmit() {
    setWithdrawSubmitting(true);
    setWithdrawMessage(null);
    setWithdrawError(null);
    try {
      const res = await fetch("/api/funds/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          type: "withdraw",
          method: fundMethod,
          reference: fundReference,
          note: fundNote,
        }),
      });
      const data: FundRequestResponse = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit withdraw request");
      }
      setWithdrawMessage(data.message);
      setWithdrawAmount("");
      setFundReference("");
      setFundNote("");
      setShowWithdrawModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setWithdrawError(msg);
    } finally {
      setWithdrawSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
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
      .map((p) => {
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
    <div
      className={`min-h-screen bg-slate-50 ${
        activeTab === "orders" ? "pb-28" : "pb-16"
      }`}
    >
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
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between">
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
          <div ref={profileMenuRef} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-2 py-1.5"
            >
              {userPhotoUrl && !userPhotoFailed ? (
                <img
                  src={userPhotoUrl}
                  alt={user.fullName || "User"}
                  className="h-8 w-8 rounded-full border border-white/70 object-cover"
                  onError={() => setUserPhotoFailed(true)}
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-sky-500 text-xs font-semibold uppercase">
                  {user.fullName?.[0] || "U"}
                </span>
              )}
              <FaChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
              />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-100 p-4">
                  {userPhotoUrl && !userPhotoFailed ? (
                    <img
                      src={userPhotoUrl}
                      alt={user.fullName || "User"}
                      className="h-12 w-12 rounded-full border border-sky-500 object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-500 bg-slate-100 text-sm font-semibold text-slate-700">
                      {user.fullName?.[0] || "U"}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{user.fullName || "User"}</p>
                    <p className="text-xs text-slate-500">
                      {(user.email || "user@ajx").split("@")[0].toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("profile");
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50"
                >
                  <MdOutlineManageAccounts className="h-4 w-4 text-sky-600" />
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("settings");
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50"
                >
                  <FaCog className="h-4 w-4 text-slate-500" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <FaSignOutAlt className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pt-3">
        {activeTab === "home" && (
          <div className="space-y-4">
            <section className="rounded-3xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-600">
                Hi, {user.fullName || "Trader"}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Track market movement, then manage funds and reports from the Funds tab.
              </p>
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
                      <p className="text-[11px] font-semibold text-slate-800">
                        {idx.name}: {money.format(idx.value)}
                        <span
                          className={`ml-1 ${
                            positive ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {formatSignedPct(idx.changePct)}
                        </span>
                      </p>
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

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-[#1f3f82]">Global Markets</h2>
              <div className="mt-3 rounded-2xl border border-cyan-300/70 p-3">
                <div className="flex gap-2 overflow-auto pb-2 text-sm">
                  {globalMarkets.map((item) => (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => setSelectedGlobalSymbol(item.symbol)}
                      className={`rounded-xl px-3 py-1.5 font-medium whitespace-nowrap ${
                        selectedGlobalMarket.symbol === item.symbol
                          ? "bg-slate-200 text-slate-900"
                          : "text-slate-600"
                      }`}
                    >
                      {item.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <p className="text-xl font-semibold text-slate-900">
                    {selectedGlobalMarket.name}
                  </p>
                  <p className="text-4xl font-semibold text-slate-900">
                    {money.format(selectedGlobalMarket.price)}
                    <span className="ml-1 text-lg font-medium text-slate-500">USD</span>
                  </p>
                  <p
                    className={`text-xl font-semibold ${
                      selectedGlobalMarket.yearlyChange >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {formatSigned(selectedGlobalMarket.yearlyChange)}{" "}
                    {formatSignedPct(selectedGlobalMarket.yearlyChangePct)} Past year
                  </p>
                  <div className="mt-3 flex gap-2 text-[11px]">
                    {["1D", "1M", "3M", "1Y", "5Y", "All"].map((k) => (
                      <span
                        key={k}
                        className={`rounded-lg px-2 py-1 font-semibold ${
                          k === "1Y" ? "bg-slate-200 text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Chart
                      points={makeAutoPoints(
                        selectedGlobalMarket.chartBase,
                        selectedGlobalMarket.chartWiggle,
                        18,
                        chartTick + selectedGlobalMarket.symbol.length * 39,
                      )}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-[#1f3f82]">
                Cryptocurrency Markets
              </h2>
              <div className="mt-3 rounded-2xl border border-cyan-300/70 p-3">
                <div className="flex gap-2 overflow-auto pb-2 text-sm">
                  {cryptoMarkets.map((item) => (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => setSelectedCryptoSymbol(item.symbol)}
                      className={`rounded-xl px-3 py-1.5 font-medium whitespace-nowrap ${
                        selectedCryptoMarket.symbol === item.symbol
                          ? "bg-slate-200 text-slate-900"
                          : "text-slate-600"
                      }`}
                    >
                      {item.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <p className="text-xl font-semibold text-slate-900">
                    {selectedCryptoMarket.name}
                  </p>
                  <p className="text-4xl font-semibold text-slate-900">
                    {money.format(selectedCryptoMarket.price)}
                    <span className="ml-1 text-lg font-medium text-slate-500">USD</span>
                  </p>
                  <p
                    className={`text-xl font-semibold ${
                      selectedCryptoMarket.yearlyChange >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {formatSigned(selectedCryptoMarket.yearlyChange)}{" "}
                    {formatSignedPct(selectedCryptoMarket.yearlyChangePct)} Past year
                  </p>
                  <div className="mt-3 flex gap-2 text-[11px]">
                    {["1D", "1M", "3M", "1Y", "5Y", "All"].map((k) => (
                      <span
                        key={k}
                        className={`rounded-lg px-2 py-1 font-semibold ${
                          k === "1Y" ? "bg-slate-200 text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Chart
                      points={makeAutoPoints(
                        selectedCryptoMarket.chartBase,
                        selectedCryptoMarket.chartWiggle,
                        18,
                        chartTick + selectedCryptoMarket.symbol.length * 55,
                      )}
                    />
                  </div>
                </div>
              </div>
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
            <section className="rounded-3xl bg-white p-4 shadow-md">
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
            <section className="rounded-3xl bg-white p-4 shadow-md">
              <h2 className="text-sm font-semibold text-slate-800">Orders</h2>
              <div className="mt-3 flex gap-2 flex-wrap items-center pb-1 text-[11px]">
                {orderSegments.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveOrderTool(item.key)}
                    className={`rounded-full px-3 py-1 whitespace-nowrap ${
                      activeOrderTool === item.key
                        ? "bg-sky-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                {availableMarkets.length > 1 && (
                  <select
                    value={activeOrderMarket}
                    onChange={(e) => setActiveOrderMarket(e.target.value)}
                    className="ml-auto rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] text-slate-600 outline-none"
                  >
                    {availableMarkets.map((m) => (
                      <option key={m} value={m} className="bg-white">
                        {m}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-slate-500">Day P/L</p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      filteredOrders.reduce((a, o) => a + computePnl(o), 0) >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    ₹ {money.format(filteredOrders.reduce((a, o) => a + computePnl(o), 0))}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-slate-500">Total P/L</p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      filteredOrders.reduce((a, o) => a + computePnl(o), 0) >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    ₹ {money.format(filteredOrders.reduce((a, o) => a + computePnl(o), 0))}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs">
                <p className="font-semibold text-slate-700">
                  {orderSegments.find((segment) => segment.key === activeOrderTool)
                    ?.label || "Orders"}
                </p>
                <span className="text-slate-500">
                  {filteredOrders.length} items
                </span>
              </div>
            </section>

            <section className="space-y-3">
              {filteredOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          o.side === "BUY" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {o.side}
                      </span>
                      <span className="text-xs text-slate-500">
                        {orderSegments.find((s) => s.key === o.segmentKey)?.label || o.segmentKey}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {money.format(o.ltp)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {o.market || "NSE"} {o.symbol}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span>Qty: {o.qty}</span>
                    <span>Avg: {money.format(o.avgPrice)}</span>
                    <span>
                      P/L:{" "}
                      <span
                        className={
                          o.pnl >= 0 ? "text-emerald-600" : "text-rose-600"
                        }
                      >
                        {money.format(o.pnl)}
                      </span>
                    </span>
                  </div>
                  {o.time && (
                    <div className="mt-1 text-[10px] text-slate-400">
                      {o.time}
                    </div>
                  )}
                </div>
              ))}
              {filteredOrders.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  No entries available for this segment.
                </p>
              )}
            </section>
          </div>
        )}

        {activeTab === "funds" && (
          <div className="space-y-3">
            <section className="rounded-3xl bg-white p-4 shadow-md">
              <h2 className="text-sm font-semibold text-slate-800">Add Funds</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Scan the QR and submit payment details.
              </p>
            </section>

            <section className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-700">Trading Balance</p>
                <p className="mt-1 text-4xl font-semibold text-slate-900">
                  ₹ {money.format(user.tradingBalance)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  last updated at {new Date().toLocaleDateString("en-IN")}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFundMethod("netbanking");
                      setShowWithdrawModal(true);
                    }}
                    className="flex-1 rounded-xl bg-rose-500 py-2 text-xs font-semibold text-white"
                  >
                    Withdraw
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFundMethod("upi");
                      setShowAddFundsModal(true);
                    }}
                    className="flex-1 rounded-xl bg-sky-600 py-2 text-xs font-semibold text-white"
                  >
                    Add Fund
                  </button>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-700">
                  Add Funds To Trading Balance
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Select an amount to proceed quickly.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {fundPresets.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFundAmount(String(amount))}
                      className="rounded-xl bg-gradient-to-r from-[#0b4ea2] to-[#d91b4d] py-2 text-sm font-semibold text-white"
                    >
                      ₹ {money.format(amount)}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-xs font-semibold text-slate-700">
                Reports &amp; Statements
              </h2>
              <div className="space-y-2">
                {reportCards.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActiveReport(item.title)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    <FaChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-700">Payment Actions</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Choose Add Funds or Withdraw to continue in a secure payment flow.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFundMethod("upi");
                    setShowAddFundsModal(true);
                  }}
                  className="rounded-xl bg-sky-600 py-2 text-xs font-semibold text-white"
                >
                  Add Funds Flow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFundMethod("netbanking");
                    setShowWithdrawModal(true);
                  }}
                  className="rounded-xl bg-rose-500 py-2 text-xs font-semibold text-white"
                >
                  Withdraw Flow
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-3">
            <section className="rounded-3xl bg-white p-4 shadow-md">
              <h2 className="text-sm font-semibold text-slate-800">Profile</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Your account details.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                {userPhotoUrl && !userPhotoFailed ? (
                  <img
                    src={userPhotoUrl}
                    alt={user.fullName || "User"}
                    className="h-20 w-20 rounded-2xl border-2 border-sky-500 object-cover"
                    onError={() => setUserPhotoFailed(true)}
                  />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-sky-500 bg-sky-50 text-2xl font-semibold text-sky-700">
                    {user.fullName?.[0] || "U"}
                  </span>
                )}
                <div>
                  <p className="text-2xl font-semibold text-[#1f3f82]">
                    {user.fullName || "-"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Client ID {String(user.email || "A00000").split("@")[0].toUpperCase()}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 text-xs">
              <h3 className="mb-3 text-base font-semibold text-slate-800">Personal Info</h3>
              <div className="space-y-3">
                {[
                  { label: "Mobile Number", value: user.phone || "-" },
                  { label: "Email", value: user.email || "-" },
                  { label: "PAN Number", value: user.panNumber || "-" },
                  { label: "Aadhaar No", value: user.aadhaarNumber || "-" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-500">{row.label}</p>
                      <p className="text-sm font-semibold text-slate-800">{row.value}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500"
                      aria-label={`Edit ${row.label}`}
                    >
                      <FaRegEdit className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-800">Quick Actions</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-2 font-semibold text-slate-700"
                >
                  View Orders
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("funds")}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-2 font-semibold text-slate-700"
                >
                  Open Funds
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFundMethod("upi");
                    setShowAddFundsModal(true);
                  }}
                  className="rounded-xl bg-sky-600 py-2 font-semibold text-white"
                >
                  Add Funds
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFundMethod("netbanking");
                    setShowWithdrawModal(true);
                  }}
                  className="rounded-xl bg-rose-500 py-2 font-semibold text-white"
                >
                  Withdraw
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-3">
            <section className="rounded-3xl bg-white p-4 shadow-md">
              <h2 className="text-sm font-semibold text-slate-800">Settings</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Account preferences and security controls.
              </p>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="space-y-2 text-xs">
                {[
                  "Notification Preferences",
                  "Session & Device Management",
                  "Privacy Controls",
                  "Support & Help Center",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setActiveReport(item)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-left"
                  >
                    <span className="font-medium text-slate-700">{item}</span>
                    <FaChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="mt-4 w-full rounded-xl bg-rose-500 py-2 text-sm font-semibold text-white"
              >
                Logout
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className="mt-2 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600"
              >
                Back to Profile
              </button>
            </section>
          </div>
        )}
      </main>

      {activeTab === "orders" && (
        <div className="fixed inset-x-0 bottom-16 z-20 px-4">
          <div className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-700">Total Gain</p>
              <button
                type="button"
                onClick={() => setShowOrderGainSheet((prev) => !prev)}
                className="text-xs font-semibold text-slate-500"
              >
                ₹ {money.format(ordersConfig?.summary?.totalPnl ?? 0)}{" "}
                <span className="inline-block">{showOrderGainSheet ? "▾" : "▴"}</span>
              </button>
            </div>
            {showOrderGainSheet && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl bg-slate-50 px-2 py-1.5">
                  <p className="text-slate-500">Open Orders</p>
                  <p className="font-semibold text-slate-700">
                    {(ordersConfig?.orders || []).filter((o) => o.status === "OPEN").length}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-1.5">
                  <p className="text-slate-500">Day P/L</p>
                  <p
                    className={`font-semibold ${
                      (ordersConfig?.summary?.dayPnl ?? 0) >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    ₹ {money.format(ordersConfig?.summary?.dayPnl ?? 0)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddFundsModal && (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-900/45 p-3 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Add Funds</h3>
              <button
                type="button"
                onClick={() => setShowAddFundsModal(false)}
                className="text-xs font-semibold text-slate-500"
              >
                Close
              </button>
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              {(["upi", "netbanking"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setFundMethod(method)}
                  className={`rounded-full px-3 py-1 font-semibold ${
                    fundMethod === method
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {method === "upi" ? "UPI" : "Net Banking"}
                </button>
              ))}
            </div>

            {fundMethod === "upi" && (
              <div className="mt-3 rounded-2xl border border-slate-200 p-3">
                {qrUrl && !qrImgFailed ? (
                  <img
                    src={`${qrUrl}${qrUrl.includes("?") ? "&" : "?"}t=${Date.now()}`}
                    alt="Payment QR"
                    className="mx-auto h-36 w-36 rounded-xl border border-slate-200 object-contain"
                    onError={() => setQrImgFailed(true)}
                  />
                ) : (
                  <p className="text-xs text-amber-600">
                    QR code not available. Use UPI ID below.
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-600">
                  UPI ID: {paymentMeta?.upiId || "Not configured"}
                </p>
              </div>
            )}

            {fundMethod === "netbanking" && (
              <div className="mt-3 rounded-2xl border border-slate-200 p-3 text-xs">
                <p className="font-semibold text-slate-700">
                  {paymentMeta?.bankName || "Bank details not configured"}
                </p>
                <p className="mt-1 text-slate-600">
                  A/C: {paymentMeta?.accountNumber || "-"}
                </p>
                <p className="text-slate-600">IFSC: {paymentMeta?.ifsc || "-"}</p>
                <p className="text-slate-600">
                  Holder: {paymentMeta?.accountHolder || "-"}
                </p>
              </div>
            )}

            <div className="mt-3 space-y-2 text-xs">
              <input
                type="number"
                min={1}
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 text-black bg-slate-50 px-3 py-2"
                placeholder="Amount (₹)"
              />
              <input
                type="text"
                value={fundReference}
                onChange={(e) => setFundReference(e.target.value)}
                className="w-full rounded-xl border border-slate-200 text-black bg-slate-50 px-3 py-2"
                placeholder="Transaction reference"
              />
              <input
                type="text"
                value={fundNote}
                onChange={(e) => setFundNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 text-black bg-slate-50 px-3 py-2"
                placeholder="Note (optional)"
              />
            </div>
            {fundError && <p className="mt-2 text-xs text-rose-600">{fundError}</p>}
            {fundMessage && (
              <p className="mt-2 text-xs text-emerald-600">{fundMessage}</p>
            )}
            <button
              type="button"
              onClick={() => void handleFundSubmit()}
              disabled={fundSubmitting}
              className="mt-3 w-full rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white"
            >
              {fundSubmitting ? "Submitting..." : "Submit Add Fund Request"}
            </button>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-900/45 p-3 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Withdraw Funds</h3>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="text-xs font-semibold text-slate-500"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Available balance: ₹ {money.format(user.tradingBalance)}
            </p>

            <div className="mt-3 flex gap-2 text-xs">
              {(["upi", "netbanking"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setFundMethod(method)}
                  className={`rounded-full px-3 py-1 font-semibold ${
                    fundMethod === method
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {method === "upi" ? "UPI" : "Net Banking"}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <input
                type="number"
                min={1}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 text-black px-3 py-2"
                placeholder="Withdraw amount (₹)"
              />
              <input
                type="text"
                value={fundReference}
                onChange={(e) => setFundReference(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 text-black px-3 py-2"
                placeholder={fundMethod === "upi" ? "UPI ID" : "Bank account / ref"}
              />
              <input
                type="text"
                value={fundNote}
                onChange={(e) => setFundNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 text-black px-3 py-2"
                placeholder="Reason / Note"
              />
            </div>
            {withdrawError && (
              <p className="mt-2 text-xs text-rose-600">{withdrawError}</p>
            )}
            {withdrawMessage && (
              <p className="mt-2 text-xs text-emerald-600">{withdrawMessage}</p>
            )}
            <button
              type="button"
              onClick={() => void handleWithdrawSubmit()}
              disabled={withdrawSubmitting}
              className="mt-3 w-full rounded-xl bg-rose-500 py-2 text-xs font-semibold text-white"
            >
              {withdrawSubmitting ? "Submitting..." : "Submit Withdraw Request"}
            </button>
          </div>
        </div>
      )}

      {activeReport && (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-900/45 p-3 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">{activeReport}</h3>
              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="text-xs font-semibold text-slate-500"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Detailed summary for {activeReport}.
            </p>
            <div className="mt-3 rounded-2xl border border-slate-200 p-3 text-xs text-slate-600">
              <p>Latest update: {new Date().toLocaleString("en-IN")}</p>
              {reportDetailLines.map((line) => (
                <p key={line} className="mt-1">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-2 text-[10px] text-slate-500">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
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
              activeTab === "profile" || activeTab === "settings"
                ? "text-sky-600"
                : ""
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

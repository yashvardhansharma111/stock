'use client';

import { useEffect, useState } from "react";

type UserStatus = "pending" | "active";

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  panNumber?: string;
  aadhaarNumber?: string;
  adminPlainPassword?: string;
  tradingBalance?: number;
  margin?: number;
}

interface FundRequest {
  _id: string;
  userName: string;
  userEmail: string;
  amount: number;
  reference?: string;
  note?: string;
  status: string;
  createdAt?: string;
}

type HomeIndexRow = {
  name: string;
  value: number;
  change: number;
  changePct: number;
};

type HomeStockRow = {
  symbol: string;
  name?: string;
  ltp: number;
  change: number;
  changePct: number;
};

type WatchlistRow = {
  symbol: string;
  name?: string;
  ltp: number;
  change: number;
  changePct: number;
};

type OrdersSummary = {
  dayPnl: number;
  totalPnl: number;
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

export default function AdminPage() {
  const [adminPin, setAdminPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>(
    {},
  );
  const [balanceDrafts, setBalanceDrafts] = useState<Record<string, string>>({});
  const [marginDrafts, setMarginDrafts] = useState<Record<string, string>>({});
  const [qrUrl, setQrUrl] = useState<string>("");
  const [savingQr, setSavingQr] = useState(false);
  const [qrImageFile, setQrImageFile] = useState<File | null>(null);
  const [hasQrImage, setHasQrImage] = useState(false);
  const [savingQrImage, setSavingQrImage] = useState(false);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [homeIndices, setHomeIndices] = useState<HomeIndexRow[]>([]);
  const [homeStocks, setHomeStocks] = useState<HomeStockRow[]>([]);
  const [homeChartPreserve, setHomeChartPreserve] = useState<unknown>(null);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistRow[]>([]);
  const [ordersSummary, setOrdersSummary] = useState<OrdersSummary>({
    dayPnl: 0,
    totalPnl: 0,
  });
  const [ordersRows, setOrdersRows] = useState<OrderRow[]>([]);
  const [savingDashboardConfig, setSavingDashboardConfig] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ajmera_admin_ok");
    if (stored === "true") {
      setIsAuthenticated(true);
      void fetchUsers();
      void fetchQr();
      void fetchFunds();
      void fetchDashboardConfigs();
    }
  }, []);

  async function handleSetBalanceMargin(userId: string) {
    setActionMessage(null);
    setAuthError(null);
    try {
      const tradingBalanceRaw = (balanceDrafts[userId] || "").trim();
      const marginRaw = (marginDrafts[userId] || "").trim();

      const payload: Record<string, unknown> = { userId };
      if (tradingBalanceRaw !== "") {
        const num = Number(tradingBalanceRaw);
        if (!Number.isFinite(num)) {
          throw new Error("Trading balance must be a valid number");
        }
        payload.tradingBalance = num;
      }
      if (marginRaw !== "") {
        const num = Number(marginRaw);
        if (!Number.isFinite(num)) {
          throw new Error("Margin must be a valid number");
        }
        payload.margin = num;
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      setActionMessage("User balance/margin updated.");
      await fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    }
  }

  async function fetchDashboardConfigs() {
    try {
      const [homeRes, watchRes, ordersRes] = await Promise.all([
        fetch("/api/admin/dashboard-home"),
        fetch("/api/admin/watchlist"),
        fetch("/api/admin/orders"),
      ]);

      const homeData = await homeRes.json();
      const watchData = await watchRes.json();
      const ordersData = await ordersRes.json();

      if (homeRes.ok) {
        const cfg = (homeData.config ?? {}) as Record<string, unknown>;
        const indices = (cfg.indices ?? []) as HomeIndexRow[];
        const stocks = (cfg.stocks ?? []) as HomeStockRow[];
        setHomeIndices(Array.isArray(indices) ? indices : []);
        setHomeStocks(Array.isArray(stocks) ? stocks : []);
        setHomeChartPreserve(cfg.chart ?? null);
      }
      if (watchRes.ok) {
        const cfg = (watchData.config ?? {}) as Record<string, unknown>;
        const items = (cfg.items ?? []) as WatchlistRow[];
        setWatchlistItems(Array.isArray(items) ? items : []);
      }
      if (ordersRes.ok) {
        const cfg = (ordersData.config ?? {}) as Record<string, unknown>;
        const summary = (cfg.summary ?? {}) as Partial<OrdersSummary>;
        setOrdersSummary({
          dayPnl: Number(summary.dayPnl ?? 0),
          totalPnl: Number(summary.totalPnl ?? 0),
        });
        const rows = (cfg.orders ?? []) as OrderRow[];
        setOrdersRows(Array.isArray(rows) ? rows : []);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    }
  }

  async function saveDashboardConfigs() {
    setSavingDashboardConfig(true);
    setActionMessage(null);
    setAuthError(null);
    try {
      const homeConfig: Record<string, unknown> = {
        indices: homeIndices,
        stocks: homeStocks,
      };
      if (homeChartPreserve) {
        homeConfig.chart = homeChartPreserve;
      }

      const watchConfig: Record<string, unknown> = {
        items: watchlistItems,
      };

      const ordersConfig: Record<string, unknown> = {
        summary: ordersSummary,
        orders: ordersRows,
      };

      const [homeRes, watchRes, ordersRes] = await Promise.all([
        fetch("/api/admin/dashboard-home", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: homeConfig }),
        }),
        fetch("/api/admin/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: watchConfig }),
        }),
        fetch("/api/admin/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: ordersConfig }),
        }),
      ]);

      const homeData = await homeRes.json();
      const watchData = await watchRes.json();
      const ordersData = await ordersRes.json();

      if (!homeRes.ok) {
        throw new Error(homeData.message || "Failed to save home config");
      }
      if (!watchRes.ok) {
        throw new Error(watchData.message || "Failed to save watchlist config");
      }
      if (!ordersRes.ok) {
        throw new Error(ordersData.message || "Failed to save orders config");
      }

      setActionMessage("Dashboard configs saved.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    } finally {
      setSavingDashboardConfig(false);
    }
  }

  async function handleAdminLogin() {
    setAuthError(null);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: adminPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid admin PIN");
      }
      window.localStorage.setItem("ajmera_admin_ok", "true");
      setIsAuthenticated(true);
      setAdminPin("");
      await fetchUsers();
      await fetchQr();
      await fetchFunds();
      await fetchDashboardConfigs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    }
  }

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load users");
      }
      setUsers(data.users || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleSetPassword(userId: string) {
    setActionMessage(null);
    try {
      const password = (passwordDrafts[userId] || "").trim();
      if (!password) {
        setAuthError("Please type a password first.");
        return;
      }

      const res = await fetch("/api/admin/generate-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to generate password");
      }
      setActionMessage(
        `Password for ${data.email}: ${data.plainPassword}. Share this securely with the user.`,
      );
      setPasswordDrafts((prev) => ({ ...prev, [userId]: "" }));
      await fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    }
  }

  async function fetchQr() {
    try {
      const res = await fetch("/api/admin/qr");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load QR");
      }
      setQrUrl(data.qrUrl || "");

      const imgRes = await fetch("/api/admin/qr-image");
      const imgData = await imgRes.json();
      if (imgRes.ok) {
        setHasQrImage(!!imgData.hasImage);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    }
  }

  async function uploadQrImage() {
    if (!qrImageFile) return;
    setSavingQrImage(true);
    setActionMessage(null);
    setAuthError(null);
    try {
      const formData = new FormData();
      formData.append("file", qrImageFile);
      const res = await fetch("/api/admin/qr-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload QR image");
      }
      setQrImageFile(null);
      setActionMessage("QR image uploaded successfully.");
      await fetchQr();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    } finally {
      setSavingQrImage(false);
    }
  }

  async function deleteQrImage() {
    setSavingQrImage(true);
    setActionMessage(null);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/qr-image", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete QR image");
      }
      setActionMessage("QR image deleted.");
      await fetchQr();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    } finally {
      setSavingQrImage(false);
    }
  }

  async function saveQr() {
    setSavingQr(true);
    try {
      const res = await fetch("/api/admin/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save QR");
      }
      setActionMessage("QR code updated successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    } finally {
      setSavingQr(false);
    }
  }

  async function fetchFunds() {
    try {
      const res = await fetch("/api/admin/funds");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load fund requests");
      }
      setFundRequests(data.requests || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    }
  }

  async function approveFund(id: string) {
    try {
      const res = await fetch("/api/admin/funds/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to approve request");
      }
      setActionMessage("Fund approved and balance updated.");
      await fetchFunds();
      await fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    }
  }

  async function rejectFund(id: string) {
    try {
      const res = await fetch("/api/admin/funds/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reject request");
      }
      setActionMessage("Fund request rejected.");
      await fetchFunds();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAuthError(msg);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-6 shadow-xl shadow-sky-500/20">
          <h1 className="mb-3 text-lg font-semibold text-slate-50">
            Admin Access
          </h1>
          <p className="mb-4 text-xs text-slate-400">
            This panel is only for Ajmeraexchange administrators. Enter the
            secret admin PIN to continue.
          </p>
          <div className="space-y-3">
            <input
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-50 outline-none ring-sky-500/0 placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
              placeholder="Admin PIN"
            />
            {authError && (
              <p className="text-xs font-medium text-rose-400">{authError}</p>
            )}
            <button
              type="button"
              onClick={handleAdminLogin}
              className="w-full rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600"
            >
              Unlock Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter((u) => u.status === "pending");
  const activeUsers = users.filter((u) => u.status === "active");

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Ajmeraexchange Admin</h1>
            <p className="text-xs text-slate-400">
              Review new registrations and generate login passwords.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem("ajmera_admin_ok");
              window.location.reload();
            }}
            className="rounded-full border border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            Sign out
          </button>
        </header>

        {authError && (
          <p className="text-xs font-medium text-rose-400">{authError}</p>
        )}
        {actionMessage && (
          <p className="text-xs font-medium text-emerald-400">
            {actionMessage}
          </p>
        )}

        <main className="mt-2 grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:col-span-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                Pending Registrations
              </h2>
              {loadingUsers && (
                <span className="text-[11px] text-slate-400">Loading...</span>
              )}
            </div>
            {pendingUsers.length === 0 ? (
              <p className="text-xs text-slate-500">
                No new registrations at the moment.
              </p>
            ) : (
              <ul className="space-y-3 text-xs">
                {pendingUsers.map((user) => (
                  <li
                    key={user._id}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-slate-50">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] text-slate-400">{user.email}</p>
                    <p className="text-[11px] text-slate-400">
                      {user.phone} · PAN {user.panNumber || "-"} · Aadhaar{" "}
                      {user.aadhaarNumber || "-"}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={passwordDrafts[user._id] || ""}
                        onChange={(e) =>
                          setPasswordDrafts((prev) => ({
                            ...prev,
                            [user._id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] text-slate-50 outline-none focus:border-sky-400"
                        placeholder="Type password"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSetPassword(user._id)}
                        className="shrink-0 rounded-full bg-sky-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-600"
                      >
                        Set
                      </button>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                      <p className="text-[11px] font-semibold text-slate-200">
                        Trading Balance / Margin
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Current: ₹ {(user.tradingBalance ?? 0).toLocaleString("en-IN")} · Margin {(user.margin ?? 0).toLocaleString("en-IN")}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={balanceDrafts[user._id] || ""}
                          onChange={(e) =>
                            setBalanceDrafts((prev) => ({
                              ...prev,
                              [user._id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-50 outline-none focus:border-sky-400"
                          placeholder="Set trading balance"
                        />
                        <input
                          type="text"
                          value={marginDrafts[user._id] || ""}
                          onChange={(e) =>
                            setMarginDrafts((prev) => ({
                              ...prev,
                              [user._id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-50 outline-none focus:border-sky-400"
                          placeholder="Set margin"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleSetBalanceMargin(user._id)}
                        className="mt-2 w-full rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600"
                      >
                        Update Balance / Margin
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:col-span-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                Active Users
              </h2>
            </div>
            {activeUsers.length === 0 ? (
              <p className="text-xs text-slate-500">
                No active users yet. Generate passwords for approved
                registrations.
              </p>
            ) : (
              <ul className="space-y-3 text-xs">
                {activeUsers.map((user) => (
                  <li
                    key={user._id}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-slate-50">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] text-slate-400">{user.email}</p>
                    <p className="text-[11px] text-emerald-400">
                      ACTIVE · User can login
                    </p>
                    <p className="mt-1 text-[11px] text-slate-200">
                      Password:{" "}
                      <span className="font-semibold">
                        {user.adminPlainPassword || "-"}
                      </span>
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={passwordDrafts[user._id] || ""}
                        onChange={(e) =>
                          setPasswordDrafts((prev) => ({
                            ...prev,
                            [user._id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] text-slate-50 outline-none focus:border-sky-400"
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSetPassword(user._id)}
                        className="shrink-0 rounded-full bg-sky-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-600"
                      >
                        Change
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:col-span-1">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Fund QR &amp; Requests
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <p className="mb-1 text-[11px] text-slate-400">
                  Upload QR image (recommended) or set a URL fallback. This QR
                  will be shown on user &quot;Add Fund&quot; screen.
                </p>
                <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-3">
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setQrImageFile(e.target.files?.[0] || null)}
                      className="w-full text-[11px] text-slate-200 file:mr-3 file:rounded-full file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-slate-200 hover:file:bg-slate-700"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void uploadQrImage()}
                        disabled={!qrImageFile || savingQrImage}
                        className="flex-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                      >
                        {savingQrImage ? "Uploading..." : "Upload / Replace"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteQrImage()}
                        disabled={!hasQrImage || savingQrImage}
                        className="flex-1 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                      >
                        {savingQrImage ? "Working..." : "Delete Image"}
                      </button>
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  value={qrUrl}
                  onChange={(e) => setQrUrl(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-50 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
                  placeholder="https://..."
                />
                {qrUrl && (
                  <div className="mt-2 flex justify-center">
                    <img
                      src={qrUrl}
                      alt="QR preview"
                      className="h-24 w-24 rounded-2xl border border-slate-700 object-contain"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void saveQr()}
                  disabled={savingQr}
                  className="mt-2 rounded-full bg-sky-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
                >
                  {savingQr ? "Saving..." : "Save QR"}
                </button>
              </div>

              <div className="mt-3 border-t border-slate-800 pt-3">
                <p className="mb-1 text-[11px] font-semibold text-slate-200">
                  Recent Fund Requests
                </p>
                {fundRequests.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    No fund requests yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {fundRequests.map((req) => (
                      <li
                        key={req._id}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2"
                      >
                        <p className="text-[11px] font-semibold text-slate-50">
                          {req.userName} · ₹
                          {req.amount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {req.userEmail}
                        </p>
                        {req.reference && (
                          <p className="text-[10px] text-slate-400">
                            Ref: {req.reference}
                          </p>
                        )}
                        {req.note && (
                          <p className="text-[10px] text-slate-500">
                            Note: {req.note}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-slate-500">
                          Status:{" "}
                          <span className="font-semibold">{req.status}</span>
                        </p>
                        {req.status === "pending" && (
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => void approveFund(req._id)}
                              className="flex-1 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-600"
                            >
                              Approve &amp; Add Balance
                            </button>
                            <button
                              type="button"
                              onClick={() => void rejectFund(req._id)}
                              className="flex-1 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                Dashboard Data (Home / Watchlist / Orders)
              </h2>
              <button
                type="button"
                onClick={() => void saveDashboardConfigs()}
                disabled={savingDashboardConfig}
                className="rounded-full bg-sky-500 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
              >
                {savingDashboardConfig ? "Saving..." : "Save Dashboard Data"}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-200">
                    Home - Indices
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setHomeIndices((prev) => [
                        ...prev,
                        { name: "", value: 0, change: 0, changePct: 0 },
                      ])
                    }
                    className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-2">
                  {homeIndices.map((row, idx) => (
                    <div
                      key={`${row.name}-${idx}`}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-2"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={row.name}
                          onChange={(e) =>
                            setHomeIndices((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, name: e.target.value } : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="Name (e.g. NIFTY)"
                        />
                        <input
                          value={String(row.value)}
                          onChange={(e) =>
                            setHomeIndices((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? { ...r, value: Number(e.target.value || 0) }
                                  : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="Value"
                        />
                        <input
                          value={String(row.change)}
                          onChange={(e) =>
                            setHomeIndices((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? { ...r, change: Number(e.target.value || 0) }
                                  : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="Change"
                        />
                        <input
                          value={String(row.changePct)}
                          onChange={(e) =>
                            setHomeIndices((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? {
                                      ...r,
                                      changePct: Number(e.target.value || 0),
                                    }
                                  : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="%Change"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setHomeIndices((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="mt-2 w-full rounded-full bg-rose-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {homeIndices.length === 0 && (
                    <p className="text-[11px] text-slate-500">No indices yet.</p>
                  )}
                </div>

                <div className="mt-2 border-t border-slate-800 pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-slate-200">
                      Home - Stocks
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setHomeStocks((prev) => [
                          ...prev,
                          {
                            symbol: "",
                            name: "",
                            ltp: 0,
                            change: 0,
                            changePct: 0,
                          },
                        ])
                      }
                      className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-2 space-y-2">
                    {homeStocks.map((row, idx) => (
                      <div
                        key={`${row.symbol}-${idx}`}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-2"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={row.symbol}
                            onChange={(e) =>
                              setHomeStocks((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, symbol: e.target.value } : r,
                                ),
                              )
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                            placeholder="Symbol"
                          />
                          <input
                            value={row.name || ""}
                            onChange={(e) =>
                              setHomeStocks((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, name: e.target.value } : r,
                                ),
                              )
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                            placeholder="Name"
                          />
                          <input
                            value={String(row.ltp)}
                            onChange={(e) =>
                              setHomeStocks((prev) =>
                                prev.map((r, i) =>
                                  i === idx
                                    ? { ...r, ltp: Number(e.target.value || 0) }
                                    : r,
                                ),
                              )
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                            placeholder="LTP"
                          />
                          <input
                            value={String(row.change)}
                            onChange={(e) =>
                              setHomeStocks((prev) =>
                                prev.map((r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        change: Number(e.target.value || 0),
                                      }
                                    : r,
                                ),
                              )
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                            placeholder="Change"
                          />
                          <input
                            value={String(row.changePct)}
                            onChange={(e) =>
                              setHomeStocks((prev) =>
                                prev.map((r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        changePct: Number(e.target.value || 0),
                                      }
                                    : r,
                                ),
                              )
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                            placeholder="%Change"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setHomeStocks((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="mt-2 w-full rounded-full bg-rose-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {homeStocks.length === 0 && (
                      <p className="text-[11px] text-slate-500">No stocks yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-200">
                    Watchlist - Items
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setWatchlistItems((prev) => [
                        ...prev,
                        { symbol: "", name: "", ltp: 0, change: 0, changePct: 0 },
                      ])
                    }
                    className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-2">
                  {watchlistItems.map((row, idx) => (
                    <div
                      key={`${row.symbol}-${idx}`}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-2"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={row.symbol}
                          onChange={(e) =>
                            setWatchlistItems((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, symbol: e.target.value } : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="Symbol"
                        />
                        <input
                          value={row.name || ""}
                          onChange={(e) =>
                            setWatchlistItems((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, name: e.target.value } : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="Name"
                        />
                        <input
                          value={String(row.ltp)}
                          onChange={(e) =>
                            setWatchlistItems((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? { ...r, ltp: Number(e.target.value || 0) }
                                  : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="LTP"
                        />
                        <input
                          value={String(row.change)}
                          onChange={(e) =>
                            setWatchlistItems((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? { ...r, change: Number(e.target.value || 0) }
                                  : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="Change"
                        />
                        <input
                          value={String(row.changePct)}
                          onChange={(e) =>
                            setWatchlistItems((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? {
                                      ...r,
                                      changePct: Number(e.target.value || 0),
                                    }
                                  : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="%Change"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setWatchlistItems((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="mt-2 w-full rounded-full bg-rose-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {watchlistItems.length === 0 && (
                    <p className="text-[11px] text-slate-500">No watchlist items yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-slate-200">
                  Orders - Summary
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={String(ordersSummary.dayPnl)}
                    onChange={(e) =>
                      setOrdersSummary((prev) => ({
                        ...prev,
                        dayPnl: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                    placeholder="Day P/L"
                  />
                  <input
                    value={String(ordersSummary.totalPnl)}
                    onChange={(e) =>
                      setOrdersSummary((prev) => ({
                        ...prev,
                        totalPnl: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                    placeholder="Total P/L"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-200">
                    Orders - Rows
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setOrdersRows((prev) => [
                        ...prev,
                        {
                          id: String(Date.now()),
                          symbol: "",
                          side: "BUY",
                          qty: 0,
                          avgPrice: 0,
                          ltp: 0,
                          pnl: 0,
                          status: "OPEN",
                          time: "",
                        },
                      ])
                    }
                    className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-2">
                  {ordersRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-2"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={row.symbol}
                          onChange={(e) =>
                            setOrdersRows((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, symbol: e.target.value } : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="Symbol"
                        />
                        <select
                          value={row.side}
                          onChange={(e) =>
                            setOrdersRows((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? { ...r, side: e.target.value as OrderRow["side"] }
                                  : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                        >
                          <option value="BUY">BUY</option>
                          <option value="SELL">SELL</option>
                        </select>
                        <input
                          value={String(row.qty)}
                          onChange={(e) =>
                            setOrdersRows((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, qty: Number(e.target.value || 0) } : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="Qty"
                        />
                        <input
                          value={String(row.avgPrice)}
                          onChange={(e) =>
                            setOrdersRows((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? { ...r, avgPrice: Number(e.target.value || 0) }
                                  : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="Avg Price"
                        />
                        <input
                          value={String(row.ltp)}
                          onChange={(e) =>
                            setOrdersRows((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, ltp: Number(e.target.value || 0) } : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="LTP"
                        />
                        <input
                          value={String(row.pnl)}
                          onChange={(e) =>
                            setOrdersRows((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, pnl: Number(e.target.value || 0) } : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="P/L"
                        />
                        <select
                          value={row.status}
                          onChange={(e) =>
                            setOrdersRows((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? {
                                      ...r,
                                      status: e.target.value as OrderRow["status"],
                                    }
                                  : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                        <input
                          value={row.time || ""}
                          onChange={(e) =>
                            setOrdersRows((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, time: e.target.value } : r,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                          placeholder="Time"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setOrdersRows((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="mt-2 w-full rounded-full bg-rose-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {ordersRows.length === 0 && (
                    <p className="text-[11px] text-slate-500">No orders yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}


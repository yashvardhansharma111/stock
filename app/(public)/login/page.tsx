'use client';

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      setMessage("Login successful. Redirecting to dashboard...");
      window.location.href = "/dashboard";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-500 to-sky-600 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          <h1 className="text-xl font-semibold text-slate-900">User Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200/0 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200/0 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
              placeholder="Password shared by admin"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-600">{error}</p>
          )}
          {message && (
            <p className="text-xs font-medium text-emerald-600">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          New to Ajmeraexchange?{" "}
          <a
            href="/register"
            className="font-semibold text-white underline decoration-sky-400/80 decoration-2 underline-offset-2"
          >
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}


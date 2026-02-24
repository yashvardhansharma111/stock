import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50 text-slate-900">
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white font-semibold">
              AE
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">
                Ajmeraexchange
              </span>
              <span className="text-xs text-slate-500">Stock trading platform</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-full border border-sky-200 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 md:inline-flex"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 md:py-20">
        {/* Hero */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
              Simple, fast and secure trading
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Trade with confidence on{" "}
              <span className="text-sky-600">Ajmeraexchange</span>.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
              Track markets, manage orders, add funds, and monitor P/L in one
              place. Built for speed and clarity—so you can focus on your
              decisions.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
              >
                Create Account
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-6 text-xs text-slate-500">
              <div className="space-y-1">
                <p className="font-semibold text-slate-700">Quick onboarding</p>
                <p>Register, get verified, and start using the platform.</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-700">Clear reporting</p>
                <p>Profit &amp; loss, ledger, and transaction history.</p>
              </div>
            </div>
          </div>

          {/* Right column: fake market card */}
          <div className="rounded-3xl border border-sky-100 bg-white/80 p-5 shadow-sm shadow-sky-100 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-sky-500">
                  Ajmeraexchange
                </p>
                <p className="text-sm text-slate-500">Market Snapshot</p>
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                LIVE
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-500">Index</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    AJX 50
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-emerald-500">
                    +1.24%
                  </p>
                  <p className="text-xs text-emerald-500">
                    ▲ 182.4 pts today
                  </p>
                </div>
              </div>

              <div className="mt-3 h-24 rounded-2xl bg-gradient-to-r from-sky-100 via-sky-50 to-emerald-50">
                <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,#bae6fd_1px,transparent_0)] bg-[length:16px_16px]" />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                <div className="space-y-1 rounded-2xl bg-sky-50 px-3 py-2">
                  <p className="text-slate-500">Volume</p>
                  <p className="text-sm font-semibold text-slate-900">
                    12.4M
                  </p>
                </div>
                <div className="space-y-1 rounded-2xl bg-sky-50 px-3 py-2">
                  <p className="text-slate-500">Day Range</p>
                  <p className="text-sm font-semibold text-slate-900">
                    18,420 – 18,960
                  </p>
                </div>
                <div className="space-y-1 rounded-2xl bg-sky-50 px-3 py-2">
                  <p className="text-slate-500">Dummy Trades</p>
                  <p className="text-sm font-semibold text-slate-900">
                    3.2k
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <p className="text-slate-500">Top movers</p>
                <ul className="space-y-1 rounded-2xl border border-sky-50 bg-sky-50/60 p-3">
                  <li className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      AJMERA TECH
                    </span>
                    <span className="text-emerald-500">+4.8%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      AE INFRASTRUCTURE
                    </span>
                    <span className="text-emerald-500">+3.1%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      AJMERA BANK
                    </span>
                    <span className="text-rose-500">-1.2%</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 border-t border-sky-100 pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            FAQs
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            Answers to common questions about onboarding, funds, and order
            tracking.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                How do I get my login password?
              </p>
              <p className="mt-2 text-sm text-slate-600">
                After registration, your account is verified by admin. Once
                approved, the admin shares your password.
              </p>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                How do I add funds to my account?
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Go to the Funds tab, scan the QR code, and submit the payment
                reference with the amount you paid.
              </p>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Where can I check Profit &amp; Loss?
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Open the Orders tab to see day P/L, total P/L and order-wise
                P/L details.
              </p>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Why does my data look different from real markets?
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Values shown in the app are configured by the admin panel for
                your account and may differ from external sources.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-sky-100 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} Ajmeraexchange.</p>
          <p className="text-[11px]">All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

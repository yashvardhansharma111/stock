'use client';

import { useState, FormEvent } from "react";

type Step = 1 | 2;

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("phone", phone);

      if (photoFile) formData.append("photo", photoFile);
      formData.append("panNumber", panNumber);
      formData.append("aadhaarNumber", aadhaarNumber);
      if (signatureFile) formData.append("signature", signatureFile);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setMessage(
        "Registration submitted. Admin will verify your details and share a login password with you.",
      );
      setFullName("");
      setEmail("");
      setPhone("");
      setPhotoFile(null);
      setPanNumber("");
      setAadhaarNumber("");
      setSignatureFile(null);
      setStep(1);
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
          <span className="text-2xl">📝</span>
          <h1 className="text-xl font-semibold text-slate-900">
            User Registration
          </h1>
        </div>

        <div className="mb-6 h-1.5 w-full rounded-full bg-sky-100">
          <div
            className="h-1.5 rounded-full bg-sky-500 transition-all"
            style={{ width: step === 1 ? "40%" : "80%" }}
          />
        </div>
        <div className="mb-4 flex items-center justify-between text-[11px] font-medium text-slate-500">
          <span className={step === 1 ? "text-sky-600" : ""}>Basic Details</span>
          <span className={step === 2 ? "text-sky-600" : ""}>Documents</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Upload Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) =>
                    setPhotoFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-white/90">
                  <span className="text-slate-800">Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200/0 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Email
                </label>
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
                  Phone No
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200/0 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  placeholder="10 digit mobile number"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  PAN Number
                </label>
                <input
                  type="text"
                  required
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200/0 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  placeholder="Enter PAN number"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  required
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200/0 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  placeholder="Enter Aadhaar number"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Upload Signature
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) =>
                    setSignatureFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-600"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs font-medium text-rose-600">{error}</p>
          )}
          {message && (
            <p className="text-xs font-medium text-emerald-600">{message}</p>
          )}

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              disabled={step === 1}
            >
              Previous
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 disabled:opacity-60"
            >
              {loading ? "Submitting..." : step === 1 ? "Next" : "Submit"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold underline decoration-sky-400/80 decoration-2 underline-offset-2"
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}

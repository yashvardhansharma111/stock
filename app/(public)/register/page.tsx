'use client';

import { useState, FormEvent } from "react";

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const [accountNo, setAccountNo] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankProofFile, setBankProofFile] = useState<File | null>(null);
  const [selectedDocOption, setSelectedDocOption] = useState("Bank Statement (6Month)");
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
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

      formData.append("accountNo", accountNo);
      formData.append("ifscCode", ifscCode);
      if (bankProofFile) formData.append("bankProof", bankProofFile);
      formData.append("documentType", selectedDocOption);
      if (documentFile) formData.append("document", documentFile);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setShowSuccess(true);
      setFullName("");
      setEmail("");
      setPhone("");
      setPhotoFile(null);
      setPanNumber("");
      setAadhaarNumber("");
      setSignatureFile(null);
      setAccountNo("");
      setIfscCode("");
      setBankProofFile(null);
      setSelectedDocOption("Bank Statement (6Month)");
      setDocumentFile(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-500 to-sky-600 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative h-20 w-20">
              <svg
                className="h-20 w-20 animate-pulse"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" className="text-emerald-500" />
                <path
                  d="M9 12l2 2 4-4"
                  className="text-emerald-500"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="absolute inset-0 animate-ping rounded-full border-2 border-emerald-500 opacity-20" />
            </div>
            <h1 className="text-center text-2xl font-semibold text-slate-900">
              Congratulations!
            </h1>
            <p className="text-center text-sm text-slate-600">
              Your demat account will be successfully opened in 24 to 72 hours
            </p>
            <p className="text-center text-xs text-slate-500">
              You will receive an email with your login credentials shortly.
            </p>
            <div className="mt-6 w-full">
              <a
                href="/login"
                className="block w-full rounded-xl bg-sky-500 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-sky-600"
              >
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
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
            style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
          />
        </div>
        <div className="mb-4 flex items-center justify-between text-[11px] font-medium text-slate-500">
          <span className={step === 1 ? "text-sky-600" : ""}>Basic Details</span>
          <span className={step === 2 ? "text-sky-600" : ""}>Documents</span>
          <span className={step === 3 ? "text-sky-600" : ""}>Bank Details</span>
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

          {step === 3 && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Account No
                </label>
                <input
                  type="text"
                  required
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200/0 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  placeholder="Enter account number"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  IFSC CODE
                </label>
                <input
                  type="text"
                  required
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200/0 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  placeholder="Enter IFSC code"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Bank Proof (optional)
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setBankProofFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Document Type
                </label>
                <select
                  value={selectedDocOption}
                  onChange={(e) => setSelectedDocOption(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                >
                  <option>Bank Statement (6Month)</option>
                  <option>DP holdings</option>
                  <option>Salary Slip</option>
                  <option>ITR Acknowledgement</option>
                  <option>Form 16</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Upload Document (optional)
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setDocumentFile(e.target.files ? e.target.files[0] : null)
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
              onClick={() => setStep((prev) => (prev > 1 ? (prev - 1) as Step : 1))}
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
              {loading ? "Submitting..." : step === 1 ? "Next" : step === 2 ? "Next" : "Submit"}
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthErrorMessage } from "@/firebase/authErrors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      console.log("Sending password reset email to:", email);
      await resetPassword(email);
      console.log("Password reset email sent successfully");
      setSuccess(true);
    } catch (err) {
      console.error("Password reset error:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      // Handle Google-only accounts
      if (
        err.code === "auth/operation-not-allowed" ||
        err.code === "auth/user-not-found"
      ) {
        // For security, show success even if account doesn't exist or uses Google
        setSuccess(true);
      } else if (err.code === "auth/invalid-email") {
        setError(getAuthErrorMessage(err));
      } else {
        // For other errors, show the error message
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: "transparent" }}
    >
      {/* Background matching homepage */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: `url('https://plus.unsplash.com/premium_photo-1714051660720-888e8454a021?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bmV3JTIweW9ya3xlbnwwfHwwfHx8MA%3D%3D')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          zIndex: -2,
        }}
      />
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.3) 30%, rgba(0, 0, 0, 0.25) 60%, rgba(0, 0, 0, 0.2) 100%)",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

      <div className="w-full max-w-md mx-auto px-4 z-10 py-8">
        <div
          className="card shadow-2xl backdrop-blur-lg border border-gray-700/50"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.85)" }}
        >
          <div className="card-body p-6">
            {/* Logo and Title */}
            <div className="text-center mb-4">
              <div className="flex flex-col items-center mb-3">
                <Link
                  href="/"
                  className="mb-2"
                  aria-label="Go to LocalLens homepage"
                >
                  <div
                    className="w-16 h-16 rounded-full bg-linear-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl mx-auto"
                    style={{
                      boxShadow:
                        "0 0 40px rgba(34, 211, 238, 0.5), 0 0 60px rgba(147, 51, 234, 0.3)",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                </Link>
                <h1 className="text-3xl font-bold bg-linear-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  Reset Password
                </h1>
              </div>
              <p className="text-white/70 mt-1">
                {success
                  ? "Check your email for password reset instructions"
                  : "Enter your email address and we'll send you a link to reset your password"}
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="alert alert-success mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">
                  If an account exists with this email and uses email/password
                  authentication, you will receive a password reset link
                  shortly. If you signed up with Google, please use the "Sign in
                  with Google" option instead.
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="alert alert-error mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Email Form */}
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="form-control">
                  <label htmlFor="reset-email" className="label pb-1.5">
                    <span className="label-text text-white font-medium">
                      Email
                    </span>
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    className="input input-bordered w-full bg-slate-900/80 border-slate-600/50 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none focus:bg-slate-900"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn w-full text-white border-none font-semibold hover:scale-105 transition-transform bg-slate-800 hover:bg-slate-700"
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div className="text-center mt-4">
              <Link
                href="/login"
                className="btn btn-ghost btn-sm text-white/70 hover:text-white hover:bg-slate-700/50"
                aria-label="Back to login page"
              >
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

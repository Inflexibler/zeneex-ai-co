"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Loader from "@/components/Loader";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Verification failed");
        }

        setStatus("success");
        setMessage("Your email has been verified successfully");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {status === "loading" && (
              <>
                <Loader size="lg" />
                <h1 className="mt-6 text-2xl font-bold text-neutral-900">Verifying your email</h1>
                <p className="mt-2 text-neutral-600">Please wait while we verify your account...</p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <svg
                    className="h-8 w-8 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="mt-6 text-2xl font-bold text-neutral-900">Email verified!</h1>
                <p className="mt-2 text-neutral-600">{message}</p>
                <div className="mt-6">
                  <Button href="/dashboard" variant="primary" className="w-full">
                    Go to Dashboard
                  </Button>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
                  <svg
                    className="h-8 w-8 text-error"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h1 className="mt-6 text-2xl font-bold text-neutral-900">Verification failed</h1>
                <p className="mt-2 text-neutral-600">{message}</p>
                <div className="mt-6 space-y-3">
                  <Button href="/login" variant="primary" className="w-full">
                    Go to Login
                  </Button>
                  <Link href="/resend-verify" className="block text-sm text-center text-primary hover:text-primary-dark">
                    Resend verification email
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

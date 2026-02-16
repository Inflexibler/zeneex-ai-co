"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Loader from "@/components/Loader";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
        setSubscription(data.data.subscription || null);
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment session");
      }

      const data = await response.json();
      if (data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
    } catch (error) {
      console.error("Failed to upgrade:", error);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader size="lg" />
        </main>
      </div>
    );
  }

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      features: ["1 website project", "5 AI generations/month", "Basic templates", "Community support"],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$29",
      period: "/month",
      features: ["10 website projects", "100 AI generations/month", "Premium templates", "Priority support", "Custom domains", "Advanced analytics"],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$99",
      period: "/month",
      features: ["Unlimited projects", "Unlimited AI generations", "White-label solution", "Dedicated support", "Custom integrations", "SLA guarantee"],
    },
  ];

  const currentPlan = subscription?.tier || "free";

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-neutral-900">Billing & Plans</h1>
            <p className="mt-2 text-neutral-600">Manage your subscription and payment methods</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Current Plan</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-neutral-900 capitalize">
                  {currentPlan}
                </div>
                {subscription && (
                  <div className="text-sm text-neutral-600">
                    {subscription.status === "active" ? (
                      <>
                        Active until {new Date(subscription.current_period_end).toLocaleDateString()}
                      </>
                    ) : (
                      <span className="text-error">
                        {subscription.status}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {currentPlan !== "free" && subscription?.status === "active" && (
                <Button variant="outline" onClick={() => handleUpgrade("free")}>
                  Downgrade to Free
                </Button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Available Plans</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-6 ${
                    plan.popular
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold text-neutral-900">{plan.price}</span>
                    {plan.period && (
                      <span className="ml-2 text-neutral-600">{plan.period}</span>
                    )}
                  </div>
                  <ul className="mt-4 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start text-sm">
                        <svg
                          className="h-5 w-5 text-primary flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="ml-2 text-neutral-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    variant={plan.id === currentPlan ? "outline" : plan.popular ? "primary" : "outline"}
                    className="w-full mt-6"
                    disabled={plan.id === currentPlan}
                  >
                    {plan.id === currentPlan ? "Current Plan" : plan.id === "free" ? "Downgrade" : "Upgrade"}
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <p className="text-neutral-600">No payment history available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-900">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-900">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-neutral-100">
                        <td className="py-3 px-4 text-sm text-neutral-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-900">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === "completed"
                                ? "bg-success/10 text-success"
                                : payment.status === "failed"
                                ? "bg-error/10 text-error"
                                : "bg-warning/10 text-warning"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

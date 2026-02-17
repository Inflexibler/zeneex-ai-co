"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Loader from "@/components/Loader";

interface User {
  id: string;
  email: string;
  name: string;
  subscription_tier: string;
  subscription_status: string;
  github_username?: string;
  email_verified: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    githubUsername: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
        setFormData({
          name: data.data.name || "",
          email: data.data.email || "",
          githubUsername: data.data.github_username || "",
        });
      } else if (response.status === 401) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          githubUsername: formData.githubUsername,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setUser(data.data);
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: "error", text: "Please enter your password" });
      return;
    }

    try {
      const response = await fetch("/api/user/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      router.push("/signup");
    } catch {
      setMessage({ type: "error", text: "Failed to delete account" });
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

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
            <p className="mt-2 text-neutral-600">Manage your account settings and preferences</p>
          </motion.div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-success/10 border border-success/20"
                  : "bg-error/10 border border-error/20"
              }`}
            >
              <p className={`text-sm ${message.type === "success" ? "text-success" : "text-error"}`}>
                {message.text}
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Profile Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 bg-neutral-50 text-neutral-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-neutral-500">Email cannot be changed</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-primary focus:ring-primary focus:outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="githubUsername" className="block text-sm font-medium text-neutral-700 mb-1">
                  GitHub Username
                </label>
                <input
                  type="text"
                  id="githubUsername"
                  value={formData.githubUsername}
                  onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-primary focus:ring-primary focus:outline-none"
                  placeholder="johndoe"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Used for automatic GitHub repository creation
                </p>
              </div>

              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? <Loader size="sm" /> : "Save Changes"}
              </Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium text-neutral-900 capitalize">
                  {user?.subscription_tier || "Free"} Plan
                </div>
                <div className="text-sm text-neutral-600">
                  Status:{" "}
                  <span
                    className={
                      user?.subscription_status === "active"
                        ? "text-success"
                        : "text-neutral-600"
                    }
                  >
                    {user?.subscription_status || "Inactive"}
                  </span>
                </div>
              </div>
              <Button href="/billing" variant="outline">
                Manage Subscription
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-error/20 p-6"
          >
            <h2 className="text-lg font-semibold text-error mb-4">Danger Zone</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="border-error text-error hover:bg-error/10"
            >
              Delete Account
            </Button>
          </motion.div>
        </div>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Delete Account</h3>
            <p className="text-neutral-600 mb-6">
              This action cannot be undone. All your projects and data will be permanently
              deleted.
            </p>
            <div className="mb-4">
              <label htmlFor="deletePassword" className="block text-sm font-medium text-neutral-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="deletePassword"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-primary focus:ring-primary focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteAccount}
                className="flex-1 border-error text-error hover:bg-error/10"
              >
                Delete Account
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}

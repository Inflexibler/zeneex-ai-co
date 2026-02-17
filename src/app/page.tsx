"use client";

import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-secondary py-32 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwIDIgMiAyIDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

          <div className="relative mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Build Websites with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-white">
                  AI Power
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-200 sm:text-xl">
                Transform your ideas into stunning, production-ready websites in minutes. No coding
                required. Just describe what you want.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button href="/signup" variant="primary" size="lg" className="text-lg">
                  Get Started Free
                </Button>
                <Button href="#features" variant="outline" size="lg" className="text-lg border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-4xl font-bold text-neutral-900 sm:text-5xl">
                Everything you need to build amazing websites
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Powerful AI-driven tools that make web development accessible to everyone
              </p>
            </motion.div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "AI-Powered Generation",
                  description: "Describe your website in plain English and watch AI create it for you",
                  icon: "🤖",
                },
                {
                  title: "Modern Tech Stack",
                  description: "Built with Next.js, React, TypeScript, and Tailwind CSS",
                  icon: "⚡",
                },
                {
                  title: "Instant Deployment",
                  description: "Deploy your websites to production with a single click",
                  icon: "🚀",
                },
                {
                  title: "Customizable Templates",
                  description: "Choose from beautiful templates or create from scratch",
                  icon: "🎨",
                },
                {
                  title: "GitHub Integration",
                  description: "Automatic repository creation and code management",
                  icon: "📦",
                },
                {
                  title: "Real-time Preview",
                  description: "See your changes instantly with live preview",
                  icon: "👁️",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-neutral-900">{feature.title}</h3>
                  <p className="mt-2 text-neutral-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-neutral-50">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-4xl font-bold text-neutral-900 sm:text-5xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Choose the plan that's right for you
              </p>
            </motion.div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Free",
                  price: "$0",
                  features: ["1 website project", "5 AI generations/month", "Basic templates", "Community support"],
                  cta: "Get Started",
                  href: "/signup",
                },
                {
                  name: "Pro",
                  price: "$29",
                  period: "/month",
                  features: ["10 website projects", "100 AI generations/month", "Premium templates", "Priority support", "Custom domains", "Advanced analytics"],
                  cta: "Start Free Trial",
                  href: "/signup",
                  popular: true,
                },
                {
                  name: "Enterprise",
                  price: "$99",
                  period: "/month",
                  features: ["Unlimited projects", "Unlimited AI generations", "White-label solution", "Dedicated support", "Custom integrations", "SLA guarantee", "Team collaboration"],
                  cta: "Contact Sales",
                  href: "#",
                },
              ].map((plan) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`relative rounded-2xl border p-8 ${
                    plan.popular
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-neutral-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-5xl font-bold text-neutral-900">{plan.price}</span>
                    {plan.period && <span className="ml-2 text-neutral-600">{plan.period}</span>}
                  </div>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <svg className="h-5 w-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="ml-3 text-neutral-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button href={plan.href} variant={plan.popular ? "primary" : "outline"} className="w-full mt-8">
                    {plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-secondary to-secondary-dark">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white sm:text-5xl">
                Ready to build your dream website?
              </h2>
              <p className="mt-4 text-lg text-neutral-200">
                Join thousands of creators who are already building with ZENEX AI
              </p>
              <div className="mt-10">
                <Button href="/signup" variant="primary" size="lg" className="bg-white text-secondary hover:bg-neutral-100">
                  Start Building for Free
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

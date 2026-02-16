import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZENEX AI - AI-Powered Website Builder",
  description: "Build stunning websites in minutes with the power of AI. No coding required. Transform your ideas into production-ready websites.",
  keywords: ["AI website builder", "website generator", "no-code", "web development", "Next.js", "React"],
  authors: [{ name: "ZENEX AI" }],
  openGraph: {
    title: "ZENEX AI - AI-Powered Website Builder",
    description: "Build stunning websites in minutes with the power of AI",
    type: "website",
    url: "https://zenex-ai.com",
    siteName: "ZENEX AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZENEX AI - AI-Powered Website Builder",
    description: "Build stunning websites in minutes with the power of AI",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

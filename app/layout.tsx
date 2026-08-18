import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { Analytics } from "@vercel/analytics/react";

const currentYear = new Date().getFullYear();

export const metadata: Metadata = {
  title: "District 79 Directory",
  description: "Directory of District 79 Adult Education and Youth Programs",
  keywords: ["District 79", "NYC", "Adult Education", "Youth Programs", "NYC DOE", "Public Schools"],
  authors: [{ name: "NYC Public Schools - District 79" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://district79-directory.vercel.app",
    siteName: "District 79 Directory",
    title: "District 79 Directory",
    description: "Directory of District 79 Adult Education and Youth Programs",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "District 79 Directory - NYC DOE Adult Education and Youth Programs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "District 79 Directory",
    description: "Directory of District 79 Adult Education and Youth Programs",
    images: ["/api/og"],
  },
  metadataBase: new URL("https://district79-directory.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <Analytics />
          <main className="flex-1">{children}</main>
          <ScrollToTop />
          <footer className="mt-auto border-t border-slate-200 bg-white">
            <div className="page-shell flex flex-col gap-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-d79-navy">NYC Public Schools — District 79</p>
                <p className="text-slate-500">Internal staff directory. © {currentYear} All rights reserved.</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link href="/privacy-policy" className="hover:text-d79-blue">
                  Privacy Policy
                </Link>
                <Link href="/terms-of-service" className="hover:text-d79-blue">
                  Terms of Service
                </Link>
                <Link href="/support" className="hover:text-d79-blue">
                  Support
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}


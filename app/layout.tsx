import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Header from "@/components/Header";
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
      <body className="antialiased bg-gray-50">
        <div className="flex flex-col min-h-screen">
          <Header />
          <Analytics />
          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-800">NYC Public Schools - District 79</p>
                <p className="text-gray-500">Internal use only. © {currentYear} All rights reserved.</p>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/privacy-policy" className="hover:text-blue-600">
                  Privacy Policy
                </Link>
                <span className="text-gray-400">|</span>
                <Link href="/terms-of-service" className="hover:text-blue-600">
                  Terms of Service
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}


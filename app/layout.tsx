import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { Analytics } from "@vercel/analytics/react";

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
        </div>
      </body>
    </html>
  );
}


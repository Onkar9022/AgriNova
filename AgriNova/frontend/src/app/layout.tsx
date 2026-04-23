import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "AgriNova — Real-Time Soil Monitoring & Crop Recommendation",
  description:
    "AI-powered crop recommendation and fertilizer guidance for Indian farmers. Enter soil parameters, get instant recommendations with confidence scores.",
  keywords: [
    "agriculture",
    "crop recommendation",
    "soil analysis",
    "AgriNova",
    "farming",
    "AI",
    "fertilizer",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}


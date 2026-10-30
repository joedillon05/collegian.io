import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel", display: "swap" });
const body = VT323({ weight: "400", subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Collegian.io",
  description: "A daily speed trivia game. An athlete appears, you name the college they played for. Climb from Orientation to Valedictorian.",
  applicationName: "Collegian.io",
  openGraph: {
    title: "Collegian.io",
    description: "Name the school. Climb from Orientation to Valedictorian. New puzzle every day at midnight ET.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#15152a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixel.variable} ${body.variable}`}>
      <body className="scanlines">{children}</body>
    </html>
  );
}

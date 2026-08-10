import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Yatra_One } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display"
});

// Devanagari display face for the "बारात" hero title and track titles —
// Cormorant Garamond has no Devanagari glyphs, so Hindi text was silently
// falling back to the browser's default serif. Yatra One covers the
// Devanagari subset and keeps the same decorative, festive feel.
const displayDevanagari = Yatra_One({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-display-hi"
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "बारात",
  description: "Baraat songs, streamed live from JioSaavn."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${displayDevanagari.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
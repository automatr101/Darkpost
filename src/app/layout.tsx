import type { Metadata } from "next";
import { Syne, DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["600", "700", "800"],
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  weight: "400",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Darkpost",
  description: "Say what you actually think. Anonymous confessions. Public feed. Screenshot to unlock.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${syne.variable} ${dmSerifDisplay.variable} ${inter.variable} antialiased`}
        style={{ backgroundColor: '#131313', color: '#F0ECE3' }}
      >
        {children}
      </body>
    </html>
  );
}

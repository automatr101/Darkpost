import type { Metadata } from "next";
import { Syne, DM_Serif_Display, Inter } from "next/font/google";
import Script from "next/script";
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
  verification: {
    google: "I-KOXwgatU2rQthV2PXb9sNz7UufNXwwBxsOBOil9D4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4K38W5JYPF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4K38W5JYPF');
          `
        }} />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9378010048800128"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
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

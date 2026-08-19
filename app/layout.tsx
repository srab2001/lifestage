import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import Script from "next/script";
import { GovBanner } from "@/components/gov-banner";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lifestage Benefits Optimization",
  description:
    "Proof-of-concept for VA-26-00077490 Lifestage Benefits Optimization — Ad Hoc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${publicSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white">
        <GovBanner />
        {children}
        {/* Initializes USWDS's own interactive behaviors (the ".gov" banner
            toggle, accordions, etc.) — see design doc Section 10/11. */}
        <Script src="/uswds/js/uswds.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProvenanceBanner from "@/components/SampleBanner";
import { UpdateBanner } from "@/components/DataUpdateCheck";
import { AppStateProvider } from "@/components/AppState";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AquaSense AI — Smart Borewell Site Recommendation",
  description:
    "AI-powered decision-support platform for borewell site selection in Pune district — near-surface geophysics, hydrogeology and official CGWB groundwater data. Developed by Rahul Meena.",
  authors: [{ name: "Rahul Meena", url: "https://github.com/rahulrajalwal" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <AppStateProvider>
          <Navbar />
          <ProvenanceBanner />
          <UpdateBanner />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </AppStateProvider>
      </body>
    </html>
  );
}

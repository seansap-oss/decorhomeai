import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "DecorHome AI - Enterprise Generative AI Home & Interior Design",
  description:
    "Transform any room or empty floorplan into photorealistic 8K interior designs in seconds. Powered by SDXL Lightning Depth ControlNet, instant Before/After sliders, and AI itemized cost estimation.",
  keywords: [
    "AI interior design",
    "home remodeling AI",
    "room redesign",
    "SDXL lightning interior",
    "virtual staging AI",
    "architectural visualization",
    "interior cost estimator",
  ],
  authors: [{ name: "DecorHome AI Architectural Studio" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

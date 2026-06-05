import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { assertEnv } from "@/lib/env";

// Validate secrets at boot — fails fast with a clear message if misconfigured
assertEnv();

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DemandVibes — AI Marketing Analytics",
  description: "Enterprise-grade agentic AI marketing analytics platform for agencies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spiritual Growth Tracker - Daily Discipline Ledger",
  description: "Personal spiritual habit tracking node for Bible study, prayer, journaling, and core lessons.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#060d17] text-slate-100">
        {children}
      </body>
    </html>
  );
}

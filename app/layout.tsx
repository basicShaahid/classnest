import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ClassNest — Lessons, simplified",
  description: "A cosy little home for your class hours, earnings and payments.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-AU"><body><StoreProvider><AppShell>{children}</AppShell></StoreProvider></body></html>;
}

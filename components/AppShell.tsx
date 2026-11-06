"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, CheckCircle2, LayoutDashboard, ListTodo, ShieldCheck } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useStore } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useStore();

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-cream text-ink">
      <header className="relative z-10 border-b border-[#e9ecdf] bg-[#ffffffcc] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 focus-visible:rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-moss" aria-label="ClassNest home">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-moss text-white shadow-sm"><BookOpenCheck size={23} strokeWidth={1.9} /></span>
            <span><span className="block text-[19px] font-extrabold leading-5 tracking-[-.055em]">classnest<span className="text-[#9bb690]">.</span></span><span className="block pt-0.5 text-[10px] font-semibold tracking-[.08em] text-muted-ink">LESSONS, SIMPLIFIED</span></span>
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-1 rounded-2xl border border-[#e7eadd] bg-white/80 p-1 shadow-sm">
            <Link className={`nav-item ${pathname === "/" ? "nav-item-active" : ""}`} href="/"><LayoutDashboard size={17} /> <span>Dashboard</span></Link>
            <Link className={`nav-item ${pathname === "/classes" ? "nav-item-active" : ""}`} href="/classes"><ListTodo size={17} /> <span>Classes</span></Link>
          </nav>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-9 sm:px-8 sm:pt-12">{children}</main>
      <footer className="mx-auto flex max-w-6xl flex-col justify-between gap-2 border-t border-[#e6e9dc] px-5 py-6 text-xs text-muted-ink sm:flex-row sm:px-8">
        <span>Made for your little wins, one lesson at a time.</span>
        <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Saved privately in this browser</span>
      </footer>
      <AnimatePresence>
        {toast && <motion.div key={toast} initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[100] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-2xl bg-ink px-5 py-3.5 text-sm font-semibold text-white shadow-2xl"><CheckCircle2 size={19} className="text-[#b9dea9]" /> {toast}</motion.div>}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, CalendarDays, Clock3, Coins, Plus, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { Mascot } from "@/components/Mascot";
import { useStore } from "@/lib/store";
import { calculateAmount, formatCurrency, formatDate, formatDuration, formatHours, formatTime, getSummary, durationMinutes } from "@/lib/utils";
import type { Lesson } from "@/lib/types";

const cardConfig = [
  { title: "Total classes", icon: BookOpen, color: "bg-[#ecf3e9] text-[#587b59]", note: "Lessons on your record" },
  { title: "Teaching hours", icon: Clock3, color: "bg-[#f6ede0] text-[#a78454]", note: "Time you've invested" },
  { title: "Total earnings", icon: Coins, color: "bg-[#e9eeff] text-[#6876a0]", note: "Paid + outstanding" },
  { title: "Money owed", icon: Wallet, color: "bg-[#fff0e4] text-[#c48653]", note: "Still to be collected" },
  { title: "Payments received", icon: BadgeCheck, color: "bg-[#e5f5eb] text-[#47835c]", note: "Successfully collected" },
];

function SummaryCards({ lessons }: { lessons: Lesson[] }) {
  const sum = getSummary(lessons);
  const values = [String(sum.totalClasses), formatHours(sum.totalMinutes), formatCurrency(sum.totalEarnings), formatCurrency(sum.moneyOwed), formatCurrency(sum.paymentsReceived)];
  return (
    <section aria-label="Class and payment statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cardConfig.map((card, index) => {
        const Icon = card.icon;
        return <motion.article key={card.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }} className="stat-card">
          <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-[15px] ${card.color}`}><Icon size={21} strokeWidth={1.9} /></div>
          <p className="text-[12px] font-semibold text-muted-ink">{card.title}</p>
          <p className="mt-1 break-words text-[clamp(1.35rem,2vw,1.85rem)] font-extrabold tracking-[-.055em] text-ink">{values[index]}</p>
          <p className="mt-2 text-[11px] text-[#98a397]">{card.note}</p>
        </motion.article>;
      })}
    </section>
  );
}

export default function DashboardPage() {
  const { lessons, ready } = useStore();
  const sum = getSummary(lessons);
  const recent = [...lessons].sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime) || b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  if (!ready) return <div className="space-y-5 animate-pulse"><div className="h-64 rounded-[32px] bg-sage" /><div className="h-40 rounded-[24px] bg-sage" /><div className="h-64 rounded-[24px] bg-sage" /></div>;

  return (
    <div className="space-y-9">
      <section className="hero-card relative flex min-h-[260px] items-center overflow-hidden rounded-[30px] px-7 py-9 sm:px-12 sm:py-12">
        <div className="relative z-[2] max-w-[560px]">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/65 px-3 py-1.5 text-[11px] font-bold text-[#547251]"><span className="h-1.5 w-1.5 rounded-full bg-[#83aa7a]" /> YOUR LITTLE CLASS CORNER</span>
          <h1 className="max-w-[450px] text-[clamp(2rem,4vw,3.15rem)] font-extrabold leading-[1.12] tracking-[-.065em]">Welcome back! <span className="text-[#678e69]">Every lesson adds up.</span></h1>
          <p className="mt-4 max-w-[360px] text-[14px] leading-6 text-[#607465]">Keep tabs on your teaching, celebrate your progress, and never lose track of a payment.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link href="/classes?add=1" className="button-primary"><Plus size={18} /> Add a class</Link><Link href="/classes" className="button-ghost">View all classes <ArrowRight size={17} /></Link></div>
        </div>
        <div className="hero-mascot pointer-events-none absolute bottom-0 right-0 hidden w-[310px] sm:block lg:right-12"><Mascot /></div>
      </section>

      <div>
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="section-title">At a glance</h2><p className="section-subtitle">Your teaching journey, in numbers.</p></div><span className="hidden rounded-full border border-[#e0e8dc] bg-white px-3 py-1.5 text-xs font-semibold text-moss sm:inline-flex">All-time overview</span></div>
        <SummaryCards lessons={lessons} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.42fr_1fr]">
        <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#f0f1e9] px-6 py-5"><div><h2 className="text-lg font-extrabold tracking-tight">Recent classes</h2><p className="mt-1 text-xs text-muted-ink">Your latest five teaching sessions</p></div><Link href="/classes" className="inline-flex items-center gap-1.5 text-xs font-bold text-moss hover:underline">See all <ArrowUpRight size={15} /></Link></div>
          {recent.length ? <div className="divide-y divide-[#f0f1e9]">{recent.map((lesson) => (
            <Link key={lesson.id} href={`/classes?record=${encodeURIComponent(lesson.id)}`} className="group flex items-center gap-3.5 px-5 py-4 transition hover:bg-[#fbfcf8] sm:px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0f4eb] text-moss"><BookOpen size={19} /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold group-hover:text-moss">{lesson.topic}</p><p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-ink"><CalendarDays size={12} /> {formatDate(lesson.date)} <span>·</span> {formatTime(lesson.startTime)} <span>·</span> {formatDuration(durationMinutes(lesson.startTime, lesson.endTime))}</p></div>
              <div className="shrink-0 text-right"><p className="text-sm font-extrabold">{formatCurrency(calculateAmount(lesson))}</p><p className={`mt-1 text-[11px] font-bold ${lesson.paid ? "text-[#48875a]" : "text-[#ba8657]"}`}>{lesson.paid ? "● Paid" : "● Unpaid"}</p></div>
            </Link>
          ))}</div> : <div className="flex flex-col items-center px-6 py-11 text-center"><Mascot compact /><h3 className="mt-2 font-bold">No classes yet</h3><p className="mt-1 text-sm text-muted-ink">Your first lesson is just one click away.</p><Link href="/classes?add=1" className="button-primary mt-5"><Plus size={17} /> Add class</Link></div>}
        </section>

        <section className="surface-card relative overflow-hidden px-6 py-6">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4e8] text-moss"><Wallet size={20} /></span><div><h2 className="text-lg font-extrabold tracking-tight">Payment progress</h2><p className="mt-0.5 text-xs text-muted-ink">See how much you've collected</p></div></div>
          <p className="text-[clamp(2.25rem,5vw,3.4rem)] font-extrabold tracking-[-.07em] text-ink">{sum.paidPercentage}<span className="ml-1 text-2xl text-muted-ink">%</span></p>
          <p className="mt-0.5 text-sm text-muted-ink">of total earnings received</p>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#eef0e6]" role="progressbar" aria-label="Payments collected" aria-valuenow={sum.paidPercentage} aria-valuemin={0} aria-valuemax={100}><motion.div className="h-full rounded-full bg-[#88ac7e]" initial={{ width: 0 }} animate={{ width: `${sum.paidPercentage}%` }} transition={{ duration: .7, ease: "easeOut" }} /></div>
          <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#f0f7ed] p-4"><p className="mb-2 text-xs font-semibold text-muted-ink">Received</p><p className="break-all text-lg font-extrabold text-[#4f8457]">{formatCurrency(sum.paymentsReceived)}</p></div><div className="rounded-2xl bg-[#fff5ea] p-4"><p className="mb-2 text-xs font-semibold text-muted-ink">Outstanding</p><p className="break-all text-lg font-extrabold text-[#b17f4f]">{formatCurrency(sum.moneyOwed)}</p></div></div>
          <p className="mt-5 text-xs leading-5 text-muted-ink">Tip: mark a class as paid on the Classes page, and these totals update automatically.</p>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownUp, BookOpen, Download, Filter, Pencil, Plus, Search, Settings2, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { LessonModal } from "@/components/LessonModal";
import { PaymentToggle } from "@/components/PaymentToggle";
import { useStore } from "@/lib/store";
import type { Lesson, LessonInput } from "@/lib/types";
import { calculateAmount, downloadCsv, durationMinutes, formatCurrency, formatDate, formatDuration, formatTime } from "@/lib/utils";

type StatusFilter = "all" | "paid" | "unpaid";
type Order = "newest" | "oldest" | "highest" | "lowest";

export default function ClassesPage() {
  const { lessons, defaultRate, ready, addLesson, editLesson, removeLesson, togglePaid, setDefaultRate, notify } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [toDelete, setToDelete] = useState<Lesson | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [order, setOrder] = useState<Order>("newest");
  const [rateSettingsOpen, setRateSettingsOpen] = useState(false);
  const [rateDraft, setRateDraft] = useState("50");
  const [rateError, setRateError] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get("record");
    if (params.get("add") === "1") { setEditing(null); setModalOpen(true); }
    else if (recordId) {
      const lesson = lessons.find((item) => item.id === recordId);
      if (lesson) { setEditing(lesson); setModalOpen(true); }
      else notify("That class could not be found.");
    }
    if (params.has("add") || params.has("record")) window.history.replaceState(null, "", "/classes");
  }, [ready, lessons, notify]);

  useEffect(() => {
    if (!celebrate) return;
    const id = window.setTimeout(() => setCelebrate(false), 1400);
    return () => window.clearTimeout(id);
  }, [celebrate]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return lessons.filter((lesson) => lesson.topic.toLowerCase().includes(term) && (filter === "all" || (filter === "paid" ? lesson.paid : !lesson.paid)))
      .sort((a, b) => {
        if (order === "highest") return calculateAmount(b) - calculateAmount(a);
        if (order === "lowest") return calculateAmount(a) - calculateAmount(b);
        const dates = a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.createdAt.localeCompare(b.createdAt);
        return order === "newest" ? -dates : dates;
      });
  }, [lessons, search, filter, order]);

  async function saveLesson(input: LessonInput) {
    try {
      if (editing) { await editLesson(editing.id, input); notify("Class updated successfully."); }
      else { await addLesson(input); notify("New class added! Nice work."); setCelebrate(true); }
      setModalOpen(false);
      setEditing(null);
    } catch { notify("Class could not be saved. Please retry."); }
  }
  async function paymentChange(lesson: Lesson) {
    try {
      await togglePaid(lesson.id);
      if (!lesson.paid) setCelebrate(true);
      notify(lesson.paid ? "Marked as unpaid." : "Payment received — hooray!");
    } catch { notify("Could not update payment status."); }
  }
  async function rateSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = Number(rateDraft);
    if (rateDraft.trim() === "" || !Number.isFinite(number) || number < 0 || number > 100000) { setRateError("Enter a valid rate (0 or higher)."); return; }
    try {
      await setDefaultRate(number);
      setRateSettingsOpen(false);
      setRateError("");
      notify("Your default hourly rate has been updated.");
    } catch { setRateError("Unable to save rate to the cloud."); }
  }
  function openEdit(lesson: Lesson) { setEditing(lesson); setModalOpen(true); }
  function openNew() { setEditing(null); setModalOpen(true); }

  if (!ready) return <div className="space-y-5 animate-pulse"><div className="h-40 rounded-[25px] bg-sage" /><div className="h-96 rounded-[25px] bg-sage" /></div>;

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div><span className="mb-2 block text-[11px] font-bold uppercase tracking-[.15em] text-moss">Your teaching notebook</span><h1 className="text-[clamp(2rem,4.6vw,3rem)] font-extrabold leading-tight tracking-[-.06em]">All your classes<span className="text-[#87a880]">.</span></h1><p className="mt-2 text-sm text-muted-ink">One cosy place for lessons, hours, and payments.</p></div>
        <div className="flex items-center gap-2"><button onClick={() => { setRateDraft(String(defaultRate)); setRateError(""); setRateSettingsOpen((open) => !open); }} className="button-secondary" aria-expanded={rateSettingsOpen}><Settings2 size={17} /> <span className="hidden sm:inline">Rate settings</span><span className="sm:hidden">Rate</span></button><button onClick={openNew} className="button-primary"><Plus size={18} /> Add class</button></div>
      </div>

      <AnimatePresence>
        {rateSettingsOpen && <motion.form onSubmit={rateSave} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#e4e9da] bg-[#f3f7ef] p-4"><div className="flex-1"><label htmlFor="default-rate" className="field-label">Default hourly rate for new classes (AUD)</label><input id="default-rate" type="number" min="0" max="100000" step="0.01" value={rateDraft} onChange={(e) => setRateDraft(e.target.value)} className="form-control w-full max-w-[250px]" /><p className="mt-2 text-xs text-muted-ink">Changing this will not affect your past class records.</p>{rateError && <p className="mt-1 text-xs font-semibold text-red-700" role="alert">{rateError}</p>}</div><button className="button-primary" type="submit">Save rate</button><button type="button" onClick={() => setRateSettingsOpen(false)} className="icon-button" aria-label="Close rate settings"><X size={18} /></button></div></motion.form>}
      </AnimatePresence>

      <section className="flex flex-col items-start justify-between gap-4 overflow-hidden rounded-[24px] border border-[#e2e9d9] bg-[#edf4e8] p-5 sm:flex-row sm:items-center sm:p-6">
        <div><p className="mb-1 text-[11px] font-bold uppercase tracking-[.12em] text-moss">Your collection</p><p className="text-xl font-extrabold tracking-tight">{lessons.length} {lessons.length === 1 ? "class" : "classes"} recorded</p><p className="mt-1 text-xs text-muted-ink">Default teaching rate: <strong className="text-moss">{formatCurrency(defaultRate)}/hour</strong></p></div>
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto"><div className="max-h-20 w-24 overflow-hidden"><Mascot compact celebrate={celebrate} /></div><button onClick={() => { downloadCsv(lessons); notify("Your CSV backup was downloaded."); }} disabled={!lessons.length} className="button-secondary disabled:cursor-not-allowed disabled:opacity-50"><Download size={17} /> Export CSV</button></div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#edf0e7] p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="relative w-full lg:max-w-[350px]"><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d9c8c]" /><label htmlFor="search-classes" className="sr-only">Search classes by topic</label><input id="search-classes" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search class topics..." className="form-control w-full pl-11" /></div>
          <div className="flex w-full flex-wrap gap-2 lg:w-auto">
            <div className="relative min-w-[130px] flex-1 sm:flex-initial"><Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-ink" /><label htmlFor="status-filter" className="sr-only">Filter by payment status</label><select id="status-filter" value={filter} onChange={(e) => setFilter(e.target.value as StatusFilter)} className="form-control w-full pl-9 text-xs font-semibold"><option value="all">All payments</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></div>
            <div className="relative min-w-[140px] flex-1 sm:flex-initial"><ArrowDownUp size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-ink" /><label htmlFor="sort-classes" className="sr-only">Sort classes</label><select id="sort-classes" value={order} onChange={(e) => setOrder(e.target.value as Order)} className="form-control w-full pl-9 text-xs font-semibold"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option></select></div>
          </div>
        </div>

        {filtered.length ? <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full border-collapse text-left text-sm"><thead className="bg-[#fafbf8]"><tr className="text-[11px] font-bold uppercase tracking-[.055em] text-[#879486]"><th className="table-heading">Date / topic</th><th className="table-heading">Time</th><th className="table-heading">Hours</th><th className="table-heading">Rate</th><th className="table-heading">Amount</th><th className="table-heading">Payment</th><th className="table-heading text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#edf0e7]">{filtered.map((lesson) => <tr key={lesson.id} className="group transition hover:bg-[#fbfcf8]"><td className="min-w-[200px] px-5 py-4"><p className="text-[11px] font-semibold text-muted-ink">{formatDate(lesson.date)}</p><p title={lesson.topic} className="mt-1 max-w-[260px] truncate font-bold">{lesson.topic}</p></td><td className="min-w-[130px] px-5 py-4 text-[12px] leading-5 text-[#596a5c]">{formatTime(lesson.startTime)}<br />{formatTime(lesson.endTime)}</td><td className="whitespace-nowrap px-4 py-4 text-xs font-semibold">{formatDuration(durationMinutes(lesson.startTime, lesson.endTime))}</td><td className="whitespace-nowrap px-4 py-4 text-xs">{formatCurrency(lesson.hourlyRate)}</td><td className="whitespace-nowrap px-4 py-4 font-extrabold">{formatCurrency(calculateAmount(lesson))}</td><td className="px-4 py-4"><PaymentToggle paid={lesson.paid} label={lesson.topic} onChange={() => paymentChange(lesson)} /></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button className="icon-button" type="button" title="Edit class" aria-label={`Edit ${lesson.topic}`} onClick={() => openEdit(lesson)}><Pencil size={17} /></button><button className="icon-button hover:!bg-red-50 hover:!text-red-600" type="button" title="Delete class" aria-label={`Delete ${lesson.topic}`} onClick={() => setToDelete(lesson)}><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div>
          <div className="divide-y divide-[#edf0e7] md:hidden">{filtered.map((lesson) => <article key={lesson.id} className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-semibold text-muted-ink">{formatDate(lesson.date)}</p><h3 className="mt-1 break-words text-base font-bold leading-snug">{lesson.topic}</h3></div><p className="shrink-0 text-base font-extrabold text-moss">{formatCurrency(calculateAmount(lesson))}</p></div><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-ink"><span>{formatTime(lesson.startTime)} – {formatTime(lesson.endTime)}</span><span>{formatDuration(durationMinutes(lesson.startTime, lesson.endTime))}</span><span>{formatCurrency(lesson.hourlyRate)}/hr</span></div><div className="mt-4 flex items-center justify-between gap-3"><PaymentToggle paid={lesson.paid} label={lesson.topic} onChange={() => paymentChange(lesson)} /><div className="flex gap-1"><button onClick={() => openEdit(lesson)} className="icon-button" aria-label={`Edit ${lesson.topic}`}><Pencil size={17} /></button><button onClick={() => setToDelete(lesson)} className="icon-button hover:!text-red-600" aria-label={`Delete ${lesson.topic}`}><Trash2 size={17} /></button></div></div></article>)}</div>
          <div className="border-t border-[#edf0e7] bg-[#fdfefb] px-6 py-3.5 text-xs font-semibold text-muted-ink">Showing {filtered.length} of {lessons.length} {lessons.length === 1 ? "class" : "classes"}</div>
        </> : <div className="flex flex-col items-center px-6 py-16 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sage text-moss">{lessons.length ? <SlidersHorizontal size={30} /> : <BookOpen size={30} />}</span><h3 className="mt-5 text-lg font-extrabold">{lessons.length ? "No matching classes" : "Your notebook is ready"}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-muted-ink">{lessons.length ? "Try a different topic, payment filter or sort option." : "Start adding your lessons here, and we'll take care of the numbers."}</p>{lessons.length ? <button className="button-secondary mt-5" onClick={() => { setFilter("all"); setSearch(""); setOrder("newest"); }}>Clear filters</button> : <button className="button-primary mt-5" onClick={openNew}><Plus size={17} /> Add your first class</button>}</div>}
      </section>

      <LessonModal open={modalOpen} lesson={editing} defaultRate={defaultRate} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={saveLesson} />

      <AnimatePresence>{toDelete && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setToDelete(null); }}><motion.div role="alertdialog" aria-modal="true" aria-labelledby="confirm-delete-heading" aria-describedby="confirm-delete-desc" initial={{ opacity: 0, scale: .97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} className="modal-panel !max-w-[420px]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Trash2 size={22} /></span><h2 id="confirm-delete-heading" className="mt-4 text-xl font-extrabold">Delete this class?</h2><p id="confirm-delete-desc" className="mt-2 text-sm leading-6 text-muted-ink">“{toDelete.topic}” will be permanently removed from your cloud account, including its payment record.</p><div className="mt-6 flex justify-end gap-2"><button autoFocus className="button-secondary" onClick={() => setToDelete(null)}>Keep class</button><button className="button-danger" onClick={async () => { try { await removeLesson(toDelete.id); setToDelete(null); notify("Class deleted."); } catch { notify("Could not delete class."); } }}>Delete class</button></div></motion.div></motion.div>}</AnimatePresence>
    </div>
  );
}

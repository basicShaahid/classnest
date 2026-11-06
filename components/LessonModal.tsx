"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Check, Clock3, X } from "lucide-react";
import type { Lesson, LessonInput } from "@/lib/types";
import { calculateAmount, durationMinutes, formatCurrency, formatDuration, from12HourParts, isValidLocalDate, localToday, to12HourParts } from "@/lib/utils";

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function TimePicker({ label, value, onChange, id }: { label: string; value: string; onChange: (time: string) => void; id: string }) {
  const { hour, minute, period } = to12HourParts(value);
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold text-[#465848]">{label}</legend>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`${id}-hour`}>{label} hour</label>
        <select id={`${id}-hour`} className="form-control min-w-0 flex-[1] px-2.5" value={hour} onChange={(e) => onChange(from12HourParts(e.target.value, minute, period))}>{hours.map((h) => <option key={h} value={h}>{h}</option>)}</select>
        <span className="font-semibold text-muted-ink">:</span>
        <label className="sr-only" htmlFor={`${id}-minute`}>{label} minute</label>
        <select id={`${id}-minute`} className="form-control min-w-0 flex-[1] px-2.5" value={minute} onChange={(e) => onChange(from12HourParts(hour, e.target.value, period))}>{minutes.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        <label className="sr-only" htmlFor={`${id}-period`}>{label} AM or PM</label>
        <select id={`${id}-period`} className="form-control min-w-0 flex-[1.25] px-2" value={period} onChange={(e) => onChange(from12HourParts(hour, minute, e.target.value))}><option value="AM">AM</option><option value="PM">PM</option></select>
      </div>
    </fieldset>
  );
}

export function LessonModal({ open, lesson, defaultRate, onClose, onSave }: {
  open: boolean;
  lesson: Lesson | null;
  defaultRate: number;
  onClose: () => void;
  onSave: (input: LessonInput) => void;
}) {
  const [date, setDate] = useState(localToday);
  const [topic, setTopic] = useState("");
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [rate, setRate] = useState("50");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");
  const topicRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    setDate(lesson?.date ?? localToday());
    setTopic(lesson?.topic ?? "");
    setStartTime(lesson?.startTime ?? "12:00");
    setEndTime(lesson?.endTime ?? "13:00");
    setRate(String(lesson?.hourlyRate ?? defaultRate));
    setPaid(lesson?.paid ?? false);
    setError("");
    const timeout = window.setTimeout(() => topicRef.current?.focus(), 70);
    return () => window.clearTimeout(timeout);
  }, [open, lesson, defaultRate]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !modalRef.current) return;
      const elements = Array.from(modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'
      ));
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [open, onClose]);

  const mins = durationMinutes(startTime, endTime);
  const parsedRate = Number(rate);
  const amount = mins > 0 && Number.isFinite(parsedRate) && parsedRate >= 0 ? calculateAmount({ startTime, endTime, hourlyRate: parsedRate }) : 0;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidLocalDate(date)) return setError("Please choose a valid class date.");
    if (!topic.trim()) return setError("Please enter what you covered in class.");
    if (mins <= 0) return setError("End time must be later than start time on the same day.");
    if (rate.trim() === "" || !Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 100000) return setError("Please enter a valid non-negative hourly rate.");
    onSave({ date, topic: topic.trim(), startTime, endTime, hourlyRate: parsedRate, paid });
  }

  return (
    <AnimatePresence>
      {open && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <motion.section ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="lesson-modal-title" initial={{ opacity: 0, y: 24, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }} transition={{ type: "spring", damping: 28, stiffness: 340 }} className="modal-panel">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div><span className="mb-2 inline-block rounded-full bg-sage px-3 py-1 text-[11px] font-bold tracking-wide text-moss">CLASS DETAILS</span><h2 id="lesson-modal-title" className="text-2xl font-extrabold tracking-tight">{lesson ? "Edit your class" : "Add a new class"}</h2><p className="mt-1 text-sm text-muted-ink">Keep your lessons organised, effortlessly.</p></div>
            <button type="button" onClick={onClose} aria-label="Close form" className="icon-button"><X size={18} /></button>
          </div>
          <form onSubmit={submit} noValidate>
            <div className="space-y-4">
              <div><label className="field-label" htmlFor="lesson-date">Class date</label><div className="relative"><CalendarDays size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink" /><input id="lesson-date" lang="en-AU" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="form-control w-full pl-11" /></div></div>
              <div><label className="field-label" htmlFor="lesson-topic">Topic covered</label><input ref={topicRef} id="lesson-topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Week 2 tutorial — algorithms" required maxLength={220} className="form-control w-full" /></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><TimePicker id="start" label="Start time" value={startTime} onChange={setStartTime} /><TimePicker id="end" label="End time" value={endTime} onChange={setEndTime} /></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className="field-label" htmlFor="hourly-rate">Hourly rate (AUD)</label><div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted-ink">$</span><input id="hourly-rate" inputMode="decimal" type="number" min="0" max="100000" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className="form-control w-full pl-9" /></div></div>
                <fieldset><legend className="field-label">Payment received?</legend><div className="flex gap-2"><button type="button" onClick={() => setPaid(false)} aria-pressed={!paid} className={`choice-button ${!paid ? "choice-button-selected" : ""}`}>No</button><button type="button" onClick={() => setPaid(true)} aria-pressed={paid} className={`choice-button ${paid ? "choice-button-selected" : ""}`}>{paid && <Check size={14} />} Yes</button></div></fieldset>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-[#f1f5eb] p-4">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-moss"><Clock3 size={20} /></span><div><p className="text-xs font-semibold text-muted-ink">Class duration</p><p className="font-bold">{mins > 0 ? formatDuration(mins) : "Invalid time range"}</p></div></div>
              <div className="text-right"><p className="text-xs font-semibold text-muted-ink">Class total</p><p className="text-xl font-extrabold tracking-tight text-moss">{formatCurrency(amount)}</p></div>
            </div>
            {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button type="submit" className="button-primary"><Check size={17} /> {lesson ? "Save changes" : "Save class"}</button></div>
          </form>
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  );
}

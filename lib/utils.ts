import type { Lesson, Summary } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function parseTime(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function durationMinutes(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (start === null || end === null || end <= start) return 0;
  return end - start;
}

export function formatTime(time: string): string {
  const minutes = parseTime(time);
  if (minutes === null) return "—";
  const h24 = Math.floor(minutes / 60);
  const hour = h24 % 12 || 12;
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour}:${minute} ${h24 < 12 ? "AM" : "PM"}`;
}

export function to12HourParts(time: string) {
  const minutes = parseTime(time) ?? 12 * 60;
  const h24 = Math.floor(minutes / 60);
  return {
    hour: String(h24 % 12 || 12),
    minute: String(minutes % 60).padStart(2, "0"),
    period: h24 < 12 ? "AM" : "PM",
  };
}

export function from12HourParts(hour: string, minute: string, period: string) {
  const h12 = Number(hour);
  const m = Number(minute);
  if (!Number.isInteger(h12) || h12 < 1 || h12 > 12 || !Number.isInteger(m) || m < 0 || m > 59) return "";
  const h24 = (h12 % 12) + (period === "PM" ? 12 : 0);
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "—";
}

export function isValidLocalDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

export function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function calculateAmount(lesson: Pick<Lesson, "startTime" | "endTime" | "hourlyRate">): number {
  // Round each session to cents before adding it to financial totals.
  return Math.round((durationMinutes(lesson.startTime, lesson.endTime) * lesson.hourlyRate / 60) * 100) / 100;
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h} ${h === 1 ? "hr" : "hrs"}`;
  return `${h} hr ${m} min`;
}

export function formatHours(minutes: number): string {
  return `${(minutes / 60).toLocaleString("en-AU", { maximumFractionDigits: 2 })}h`;
}

export function getSummary(lessons: Lesson[]): Summary {
  let totalMinutes = 0;
  let earningsCents = 0;
  let paidCents = 0;

  lessons.forEach((lesson) => {
    totalMinutes += durationMinutes(lesson.startTime, lesson.endTime);
    const amountInCents = Math.round(calculateAmount(lesson) * 100);
    earningsCents += amountInCents;
    if (lesson.paid) paidCents += amountInCents;
  });

  return {
    totalClasses: lessons.length,
    totalMinutes,
    totalEarnings: earningsCents / 100,
    moneyOwed: (earningsCents - paidCents) / 100,
    paymentsReceived: paidCents / 100,
    paidPercentage: earningsCents ? Math.round((paidCents / earningsCents) * 100) : 0,
  };
}

export function downloadCsv(lessons: Lesson[]) {
  const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const headers = ["Date", "Topic Covered", "Start Time", "End Time", "Hours Completed", "Hourly Rate (AUD)", "Total Amount (AUD)", "Paid?"];
  const lines = lessons.map((lesson) => [
    formatDate(lesson.date),
    lesson.topic,
    formatTime(lesson.startTime),
    formatTime(lesson.endTime),
    (durationMinutes(lesson.startTime, lesson.endTime) / 60).toFixed(2),
    lesson.hourlyRate.toFixed(2),
    calculateAmount(lesson).toFixed(2),
    lesson.paid ? "Yes" : "No",
  ].map(quote).join(","));
  const csv = "\uFEFF" + [headers.map(quote).join(","), ...lines].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `classnest-records-${localToday()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

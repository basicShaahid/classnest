"use client";

import { Check, Clock3 } from "lucide-react";

export function PaymentToggle({ paid, onChange, label }: { paid: boolean; onChange: () => void; label: string }) {
  return <button
    type="button"
    role="switch"
    aria-checked={paid}
    aria-label={`Payment for ${label}: ${paid ? "Paid" : "Unpaid"}. Click to change.`}
    onClick={onChange}
    className={`inline-flex min-w-[105px] items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ${paid ? "border-[#cbe8cb] bg-[#ebf8ea] text-[#326744]" : "border-[#f5dec1] bg-[#fff4e8] text-[#ac713c]"}`}
  >
    {paid ? <Check size={14} strokeWidth={2.5} /> : <Clock3 size={14} />}
    {paid ? "Paid" : "Unpaid"}
  </button>;
}

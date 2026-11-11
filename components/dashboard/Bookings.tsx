"use client";

import { useState } from "react";
import type { Booking, BookingStatus } from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { clockTime } from "@/lib/time";
import { Card, StatusChip } from "./ui";

type Filter = "all" | "WAITING" | "DONE" | "SENT_FOR_TESTS";
const FILTERS: Filter[] = ["all", "WAITING", "DONE", "SENT_FOR_TESTS"];

type Props = {
  title: string;
  bookings: Booking[];
  highlighted: Set<string>;
  onOpen: (bookingId: string) => void;
};

export default function Bookings({ title, bookings, highlighted, onOpen }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const count = (f: Filter) => (f === "all" ? bookings.length : bookings.filter((b) => b.status === f).length);
  const shown = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <Card title={title}>
      <div role="group" aria-label={t.bookings.filterLabel} className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full border-[1.5px] px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === f ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
            }`}
          >
            {t.bookings.filters[f]} <span className={filter === f ? "text-white/85" : "text-muted"}>{count(f)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl bg-brand-tint px-4 py-8 text-center text-muted">
          {bookings.length === 0 ? t.bookings.empty : t.bookings.emptyFilter}
        </p>
      ) : (
        <>
          {/* Phones: tappable cards */}
          <ul className="flex flex-col gap-2.5 md:hidden">
            {shown.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onOpen(b.id)}
                  aria-label={t.bookings.open(b.token, b.patient.name)}
                  className={`flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left transition-colors ${rowTint(b.status, highlighted.has(b.id))}`}
                >
                  <TokenBadge token={b.token} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{b.patient.name}</span>
                    <span className="block text-sm text-muted">
                      {t.ageGender(b.patient.age, b.patient.gender)} · {t.visitType[b.visitType]}
                    </span>
                    <span className="block text-sm text-muted">{t.source[b.source]} · {clockTime(b.bookedAt)}</span>
                  </span>
                  <StatusChip status={b.status} />
                </button>
              </li>
            ))}
          </ul>

          {/* Tablets and up: a table that scrolls sideways if it has to */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="text-sm text-muted">
                  {Object.values(t.bookings.columns).map((c) => (
                    <th key={c} scope="col" className="border-b border-line px-3 pb-2.5 font-semibold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => onOpen(b.id)}
                    className={`cursor-pointer transition-colors ${rowTint(b.status, highlighted.has(b.id))}`}
                  >
                    <td className="border-b border-line px-3 py-3">
                      <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(b.id); }} aria-label={t.bookings.open(b.token, b.patient.name)} className="rounded-lg">
                        <TokenBadge token={b.token} />
                      </button>
                    </td>
                    <td className="border-b border-line px-3 py-3">
                      <span className="block font-semibold text-ink">{b.patient.name}</span>
                      <span className="block text-sm text-muted">{t.ageGender(b.patient.age, b.patient.gender)}</span>
                    </td>
                    <td className="border-b border-line px-3 py-3 text-ink">{t.visitType[b.visitType]}</td>
                    <td className="border-b border-line px-3 py-3">
                      <span className="block text-ink">{t.source[b.source]}</span>
                      <span className="block text-sm text-muted">{clockTime(b.bookedAt)}</span>
                    </td>
                    <td className="border-b border-line px-3 py-3"><StatusChip status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

function rowTint(status: BookingStatus, highlighted: boolean) {
  if (highlighted) return "bg-brand-light";
  if (status === "WITH_DOCTOR") return "bg-[#FDF6E7] hover:bg-[#FBEFD3]";
  return "bg-white hover:bg-brand-tint";
}

export function TokenBadge({ token, size = "md" }: { token: number; size?: "md" | "lg" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-[#FDF6E7] font-bold tabular-nums text-[#3A2A00] ring-1 ring-token/50 ${
        size === "lg" ? "h-16 w-16 text-[28px]" : "h-10 w-10 text-lg"
      }`}
    >
      {token}
    </span>
  );
}

export function CancelledCard({ title, cancelled, onOpen }: { title: string; cancelled: Booking[]; onOpen: (id: string) => void }) {
  return (
    <Card title={title}>
      {cancelled.length === 0 ? (
        <p className="text-muted">{t.cancelled.empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {cancelled.map((b) => (
            <li key={b.id}>
              <button type="button" onClick={() => onOpen(b.id)} className="flex w-full gap-3 rounded-2xl p-1 text-left hover:bg-brand-tint">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-light text-lg font-bold tabular-nums text-[#9A2E22]">
                  {b.token}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">{b.patient.name}</span>
                  <span className="block text-sm text-muted">
                    {t.cancelled.when(b.cancelledAt ? clockTime(b.cancelledAt) : "—", t.cancelled.how[b.cancelledBy ?? "PATIENT"])}
                  </span>
                  <span className="block text-sm text-ink">{b.cancelReason || t.cancelled.noReason}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

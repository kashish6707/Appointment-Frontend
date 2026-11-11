"use client";

import useSWR from "swr";
import { keys, type CalendarDay, type CalendarMonth } from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { addMonths, monthName, shortDate, weekdayIndex, weekOf } from "@/lib/time";
import { Card, ErrorBox, Skeleton } from "./ui";

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  clinicId?: string;
  today: string;
  selected: string;
  onSelect: (date: string) => void;
};

export function useCalendar(month: string, clinicId?: string) {
  return useSWR<CalendarMonth>(keys.calendar(month, clinicId));
}

/** Month grid, Monday first. */
export function MonthCalendar({ month, onMonthChange, clinicId, today, selected, onSelect }: Props) {
  const { data, error, mutate } = useCalendar(month, clinicId);
  const blanks = data ? weekdayIndex(data.days[0].date) : 0;

  return (
    <Card
      title={monthName(month)}
      action={
        <div className="flex gap-1.5">
          <NavButton label={t.calendar.prev} onClick={() => onMonthChange(addMonths(month, -1))} dir="prev" />
          <NavButton label={t.calendar.next} onClick={() => onMonthChange(addMonths(month, 1))} dir="next" />
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted" aria-hidden="true">
        {t.calendar.weekdays.map((d) => <span key={d}>{d}</span>)}
      </div>
      {error ? (
        <div className="mt-3"><ErrorBox onRetry={() => mutate()} /></div>
      ) : !data ? (
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }, (_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {Array.from({ length: blanks }, (_, i) => <span key={`b${i}`} />)}
          {data.days.map((d) => (
            <DayButton key={d.date} day={d} today={today} selected={selected} onSelect={onSelect} />
          ))}
        </div>
      )}
    </Card>
  );
}

function DayButton({ day, today, selected, onSelect, compact = false }: { day: Partial<CalendarDay> & { date: string }; today: string; selected: string; onSelect: (d: string) => void; compact?: boolean }) {
  const isToday = day.date === today;
  const isSelected = day.date === selected;
  const closed = !!day.closed;
  const n = day.bookings ?? 0;
  const full = !closed && day.limit != null && n >= day.limit;
  const label = closed ? (day.exception === "CLOSED" ? t.calendar.off : t.calendar.closed) : full ? t.calendar.full : n > 0 ? t.calendar.pts(n) : " ";
  const dayNum = Number(day.date.slice(8));
  return (
    <button
      type="button"
      onClick={() => onSelect(day.date)}
      aria-pressed={isSelected}
      aria-current={isToday ? "date" : undefined}
      aria-label={`${t.calendar.dayLabel(shortDate(day.date), n, closed)}${full ? `, ${t.calendar.full.toLowerCase()}` : ""}${day.note ? `, ${day.note}` : ""}`}
      title={day.note ?? undefined}
      className={`flex flex-col items-center justify-center rounded-xl leading-tight transition-colors ${compact ? "min-h-[64px] px-1 py-2" : "min-h-[56px] py-1.5"} ${
        isToday
          ? "bg-brand text-white"
          : closed
            ? "border-[1.5px] border-dashed border-line text-muted hover:bg-brand-tint"
            : "bg-white text-ink hover:bg-brand-tint"
      } ${isSelected ? "ring-2 ring-brand-dark ring-offset-2" : ""}`}
    >
      <span className="relative text-[15px] font-bold tabular-nums">
        {dayNum}
        {day.exception === "HOURS" && <span aria-hidden="true" className="absolute -right-2 top-0.5 h-1.5 w-1.5 rounded-full bg-token" />}
      </span>
      <span className={`text-[11px] ${isToday ? "text-white/90" : full ? "font-semibold text-danger" : "text-muted"}`}>{label}</span>
    </button>
  );
}

/** Phones: the week around the selected day, with a button to open the full month. */
export function WeekStrip({ clinicId, today, selected, onSelect, expanded, onToggle }: {
  clinicId?: string; today: string; selected: string; onSelect: (d: string) => void; expanded: boolean; onToggle: () => void;
}) {
  const week = weekOf(selected);
  // A week can span two months.
  const first = useCalendar(week[0].slice(0, 7), clinicId);
  const last = useCalendar(week[6].slice(0, 7), clinicId);
  const byDate = new Map<string, CalendarDay>();
  for (const m of [first.data, last.data]) m?.days.forEach((d) => byDate.set(d.date, d));

  return (
    <section aria-label={t.calendar.title} className="rounded-[20px] border border-line bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-ink">{monthName(selected.slice(0, 7))}</h2>
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="text-sm font-semibold text-brand underline underline-offset-4">
          {expanded ? t.calendar.hideCalendar : t.calendar.fullCalendar}
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted" aria-hidden="true">
        {t.calendar.weekdays.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {week.map((date) => (
          <DayButton key={date} day={byDate.get(date) ?? { date }} today={today} selected={selected} onSelect={onSelect} compact />
        ))}
      </div>
    </section>
  );
}

function NavButton({ label, onClick, dir }: { label: string; onClick: () => void; dir: "prev" | "next" }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-line text-ink hover:border-brand hover:text-brand">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={dir === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

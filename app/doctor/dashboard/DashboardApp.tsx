"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { SWRConfig, useSWRConfig } from "swr";
import { ApiError } from "@/lib/api";
import {
  fetcher,
  keys,
  sessionAction,
  withBooking,
  withSession,
  type Booking,
  type Dashboard,
  type DoctorProfile,
  type Me,
  type OpdSession,
  type Permission,
  type SessionAction,
} from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { longDate, partOfDay, todayIST } from "@/lib/time";
import { useLiveUpdates, type LiveEvent } from "@/lib/useLiveUpdates";
import AvailabilityCard, { StatTiles } from "@/components/dashboard/AvailabilityCard";
import Bookings, { CancelledCard } from "@/components/dashboard/Bookings";
import { MonthCalendar, WeekStrip } from "@/components/dashboard/Calendar";
import PatientPanel from "@/components/dashboard/PatientPanel";
import TopBar from "@/components/dashboard/TopBar";
import WalkInForm from "@/components/dashboard/WalkInForm";
import { ErrorBox, Skeleton, Toasts, type Toast } from "@/components/dashboard/ui";

export default function DashboardApp({ me, doctor }: { me: Me; doctor: DoctorProfile }) {
  const router = useRouter();
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        // A 401 means the session ended: go back to sign in.
        onError: (err) => {
          if (!(err instanceof ApiError)) return;
          if (err.status === 401) router.replace("/doctor/login?next=/doctor/dashboard");
          // Staff whose access was removed, or who must choose a doctor: let the page decide again.
          else if (err.status === 403 || err.status === 409) router.refresh();
        },
        shouldRetryOnError: (err) => !(err instanceof ApiError && err.status < 500 && err.status !== 0),
      }}
    >
      <DashboardInner me={me} doctor={doctor} />
    </SWRConfig>
  );
}

function DashboardInner({ me, doctor }: { me: Me; doctor: DoctorProfile }) {
  // What this viewer may do. The backend checks every request anyway; this only hides controls.
  const perms = useMemo(() => new Set<Permission>(me.viewer.permissions), [me.viewer.permissions]);
  const can = useCallback((p: Permission) => perms.has(p), [perms]);
  const [today, setToday] = useState(todayIST);
  const [clinicId, setClinicId] = useState<string | undefined>(doctor.clinics[0]?.doctorClinicId);
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [openBooking, setOpenBooking] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"today" | "cancelled">("today");
  const [fullCalendar, setFullCalendar] = useState(false);
  const [busy, setBusy] = useState<SessionAction | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const toastId = useRef(0);
  const { mutate: mutateAny } = useSWRConfig();

  // Keep "today" right if the dashboard stays open past midnight.
  useEffect(() => {
    const id = setInterval(() => setToday(todayIST()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dayKey = keys.dashboard(date, clinicId);
  const { data: day, error, mutate } = useSWR<Dashboard>(clinicId ? dayKey : null, { keepPreviousData: true });
  const isToday = date === today;

  const toast = useCallback((text: string, tone: Toast["tone"] = "info", action?: Toast["action"]) => {
    const id = ++toastId.current;
    setToasts((ts) => [...ts.slice(-2), { id, text, tone, action }]);
    // A toast with an Undo button stays longer, so there's time to press it.
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), action ? 10000 : 5000);
  }, []);

  const highlight = useCallback((id: string) => {
    setHighlighted((s) => new Set(s).add(id));
    setTimeout(() => setHighlighted((s) => { const n = new Set(s); n.delete(id); return n; }), 3000);
  }, []);

  /** Apply a change to the shown day at once, then refresh counts elsewhere in the background. */
  const applyBooking = useCallback(
    (booking: Booking) => {
      mutate((d) => (d ? withBooking(d, booking) : d), { revalidate: false });
      mutateAny((key) => typeof key === "string" && key.startsWith("/api/doctor/calendar"));
      mutateAny(keys.booking(booking.id));
    },
    [mutate, mutateAny],
  );
  const applySession = useCallback(
    (session: OpdSession) => mutate((d) => (d ? withSession(d, session) : d), { revalidate: false }),
    [mutate],
  );

  const onLive = useCallback(
    (e: LiveEvent) => {
      if (e.type === "session.updated") return applySession(e.session);
      const shown = day?.session?.id === e.booking.sessionId;
      applyBooking(e.booking);
      if (!shown) return;
      if (e.type === "booking.created") {
        highlight(e.booking.id);
        toast(t.toast.newBooking(e.booking.token, e.booking.patient.name));
      } else if (e.type === "booking.cancelled") {
        toast(t.toast.cancelledBooking(e.booking.token, e.booking.patient.name));
      }
    },
    [applyBooking, applySession, day?.session?.id, highlight, toast],
  );
  const { connected } = useLiveUpdates(onLive, () => mutateAny(() => true));

  async function runAction(action: SessionAction) {
    if (!day?.session) return false;
    setBusy(action);
    try {
      const r = await sessionAction(day.session.id, action);
      applySession(r.session);
      if (r.finished) applyBooking(r.finished);
      r.restored?.forEach(applyBooking);
      if (action === "start") {
        toast(t.availability.started(r.notified ?? 0));
        // Messages go out in the background: refresh shortly to show how they went.
        setTimeout(() => mutate(), 2500);
      }
      if (action === "end") toast(t.availability.ended, "info", { label: t.availability.undo, onClick: () => runAction("reopen") });
      if (action === "reopen") toast(t.availability.reopened);
      if (r.current) {
        applyBooking(r.current);
        toast(t.availability.called(r.current.token, r.current.patient.name));
      } else if (action === "next") {
        toast(t.availability.queueEmpty);
      }
      return true;
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t.common.loadError, "error");
      mutate();
      return false;
    } finally {
      setBusy(null);
    }
  }

  function selectDate(d: string) {
    setDate(d);
    setMonth(d.slice(0, 7));
    setFullCalendar(false);
  }

  // Greet whoever is signed in: the doctor as "Dr. …", staff by their own name.
  const greetingName = useMemo(() => {
    if (me.viewer.type === "STAFF") return me.viewer.fullName.split(" ")[0];
    return /^dr\.?\s/i.test(doctor.fullName) ? doctor.fullName : `Dr. ${doctor.fullName}`;
  }, [doctor.fullName, me.viewer]);

  if (!clinicId) {
    return (
      <>
        <TopBar me={me} doctor={doctor} clinicId={undefined} onClinicChange={setClinicId} date={date} onOpenBooking={setOpenBooking} />
        <main className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6">
          <ErrorBox message="Add a clinic and OPD timings to your profile to start taking bookings." />
        </main>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar me={me} doctor={doctor} clinicId={clinicId} onClinicChange={(id) => { setClinicId(id); setOpenBooking(null); }} date={date} onOpenBooking={setOpenBooking} />

      <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        {/* Welcome row */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-semibold text-muted">{longDate(date)}</p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-brand-dark sm:text-[34px]">
              {t.welcome.greeting(partOfDay(), greetingName)}
            </h1>
            <p className="mt-1 text-lg text-ink">
              {day ? (isToday ? t.welcome.summary(day.stats.booked, day.stats.waiting) : t.welcome.summaryOtherDay(day.stats.booked)) : " "}
            </p>
          </div>
          {!isToday && (
            <button type="button" onClick={() => selectDate(today)} className="rounded-full border-[1.5px] border-brand px-4 py-2 font-semibold text-brand hover:bg-brand-light">
              {t.welcome.backToToday}
            </button>
          )}
        </div>

        {me.viewer.type === "DOCTOR" && !doctor.profileComplete && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border-[1.5px] border-token bg-[#FDF6E7] px-5 py-4">
            <div className="max-w-2xl">
              <p className="font-bold text-[#3A2A00]">{t.profile.incompleteTitle}</p>
              <p className="text-sm text-[#5A4300]">{t.profile.incompleteText}</p>
            </div>
            <a href="/doctor/profile" className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark">{t.profile.incompleteAction}</a>
          </div>
        )}

        {!connected && (
          <p role="status" className="mt-4 rounded-xl bg-[#FDF6E7] px-4 py-2.5 text-sm font-medium text-[#6B4E00]">{t.toast.reconnecting}</p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Main column */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* Phones: week strip at the top, month calendar on request */}
            <div className="flex flex-col gap-3 md:hidden">
              <WeekStrip clinicId={clinicId} today={today} selected={date} onSelect={selectDate} expanded={fullCalendar} onToggle={() => setFullCalendar((v) => !v)} />
              {fullCalendar && <MonthCalendar month={month} onMonthChange={setMonth} clinicId={clinicId} today={today} selected={date} onSelect={selectDate} />}
            </div>

            {error && !day ? (
              <ErrorBox message={error.message} onRetry={() => mutate()} />
            ) : !day ? (
              <>
                <Skeleton className="h-36 rounded-[20px]" />
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className={`h-24 rounded-[20px] ${i === 0 ? "col-span-2 md:col-span-1" : ""}`} />)}
                </div>
                <Skeleton className="h-80 rounded-[20px]" />
              </>
            ) : (
              <>
                <AvailabilityCard day={day} isToday={isToday} canReopen={date >= today} canManage={can("opd.manage")} canCall={can("queue.call")} busy={busy} onAction={runAction} />
                <StatTiles day={day} />

                {/* Phones: Bookings / Cancelled tabs */}
                <div role="tablist" aria-label={t.tabs.label} className="grid grid-cols-2 rounded-full bg-brand-tint p-1 md:hidden">
                  {(["today", "cancelled"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={mobileTab === tab}
                      onClick={() => setMobileTab(tab)}
                      className={`rounded-full py-2.5 font-semibold ${mobileTab === tab ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}
                    >
                      {tab === "today" ? t.tabs.today : `${t.tabs.cancelled} (${day.stats.cancelled})`}
                    </button>
                  ))}
                </div>

                <div className={mobileTab === "today" ? "" : "hidden md:block"}>
                  <Bookings title={isToday ? t.bookings.titleToday : `${t.bookings.title}, ${longDate(date)}`} bookings={day.bookings} highlighted={highlighted} onOpen={setOpenBooking} />
                </div>
                <div className={`md:hidden ${mobileTab === "cancelled" ? "" : "hidden"}`}>
                  <CancelledCard title={isToday ? t.cancelled.titleToday : t.cancelled.title} cancelled={day.cancelled} onOpen={setOpenBooking} />
                </div>
                <div className={can("walkins.add") ? "md:hidden" : "hidden"}>
                  <WalkInForm sessionId={isToday && day.session && day.session.status !== "CLOSED" ? day.session.id : null} onAdded={(b) => { applyBooking(b); highlight(b.id); toast(t.walkIn.added(b.token, b.patient.name)); }} />
                </div>
              </>
            )}
          </div>

          {/* Side column (tablet and desktop) */}
          <aside className="hidden min-w-0 flex-col gap-6 md:flex">
            <MonthCalendar month={month} onMonthChange={setMonth} clinicId={clinicId} today={today} selected={date} onSelect={selectDate} />
            {day && (
              <>
                <CancelledCard title={isToday ? t.cancelled.titleToday : t.cancelled.title} cancelled={day.cancelled} onOpen={setOpenBooking} />
                {can("walkins.add") && <WalkInForm sessionId={isToday && day.session && day.session.status !== "CLOSED" ? day.session.id : null} onAdded={(b) => { applyBooking(b); highlight(b.id); toast(t.walkIn.added(b.token, b.patient.name)); }} />}
              </>
            )}
          </aside>
        </div>
      </main>

      <PatientPanel
        can={can}
        bookingId={openBooking}
        onClose={() => setOpenBooking(null)}
        onChanged={({ booking, session }) => {
          if (session) applySession(session);
          if (booking) applyBooking(booking);
          mutate();
        }}
        onError={(m) => toast(m, "error")}
      />
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((ts) => ts.filter((x) => x.id !== id))} />
    </div>
  );
}

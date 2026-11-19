"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { DEFAULT_LOCATION, useSavedLocation } from "@/lib/location";
import { useRouter } from "next/navigation";
import { useAccount } from "./AccountProvider";
import { ChevronDown, PinIcon } from "./icons";

/** Location on the left (opens /location), profile menu on the right. */
export default function PatientHeader() {
  const { t } = useLang();
  const { location, ready } = useSavedLocation();
  const shown = location ?? DEFAULT_LOCATION;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="hidden shrink-0 md:block"><Logo size={38} /></Link>
          <Link href="/location" aria-label={t.header.locationLabel(shown.areaName)}
            className="flex min-h-[44px] min-w-0 items-center gap-2 rounded-2xl py-1 pr-2 hover:bg-brand-tint">
            <span className="text-brand"><PinIcon size={26} /></span>
            <span className="min-w-0 leading-tight">
              <span className={`flex items-center gap-1 text-[17px] font-bold text-ink ${ready ? "" : "opacity-0"}`}>
                <span className="truncate">{shown.areaName}</span>
                <ChevronDown size={18} />
              </span>
              <span className={`block truncate text-sm text-muted ${ready ? "" : "opacity-0"}`}>{shown.districtName}, {shown.stateName}</span>
            </span>
          </Link>
        </div>
        <ProfileMenu />
      </div>
    </header>
  );
}

function initialsOf(name: string) {
  const parts = name.replace(/^(dr|mr|mrs|ms)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

function ProfileMenu() {
  const { t, lang, setLang } = useLang();
  const { me, signOut } = useAccount();
  const router = useRouter();
  const name = me?.account.fullName;
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-[15px] font-medium text-ink hover:bg-brand-tint";

  return (
    <div ref={box} className="relative shrink-0">
      <button ref={button} type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" aria-label={t.header.profileMenu}
        className="flex min-h-[44px] items-center gap-2.5 rounded-full p-1 hover:bg-brand-tint md:border md:border-line md:py-1.5 md:pl-1.5 md:pr-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${name ? "bg-brand text-white" : "bg-brand-light text-brand-dark"}`}>
          {name ? initialsOf(name) : <PersonIcon />}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-[160px] truncate font-semibold text-ink">{name ?? t.header.signIn}</span>
          <span className="block text-sm text-muted">{t.header.profileSub}</span>
        </span>
        <span className="hidden text-muted md:block"><ChevronDown size={18} /></span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 rounded-[18px] border border-line bg-white p-2 shadow-soft">
          <Link role="menuitem" href="/profile" className={item} onClick={() => setOpen(false)}>{t.header.myProfile}</Link>
          <Link role="menuitem" href="/tokens" className={item} onClick={() => setOpen(false)}>{t.header.myTokens}</Link>
          <Link role="menuitem" href="/records" className={item} onClick={() => setOpen(false)}>{t.header.myRecords}</Link>
          <div className="my-1 border-t border-line" />
          <p className="px-3 pb-1 pt-2 text-sm font-semibold text-muted">{t.header.language}</p>
          <div role="group" aria-label={t.header.language} className="grid grid-cols-2 gap-1.5 px-1 pb-1">
            {(["en", "hi"] as const).map((l) => (
              <button key={l} type="button" role="menuitemradio" aria-checked={lang === l} onClick={() => setLang(l)}
                className={`min-h-[44px] rounded-full border-[1.5px] font-semibold ${lang === l ? "border-brand bg-brand-light text-brand-dark" : "border-line text-ink"}`}>
                {l === "en" ? "English" : "हिंदी"}
              </button>
            ))}
          </div>
          <div className="my-1 border-t border-line" />
          {name ? (
            <button type="button" role="menuitem" className={item}
              onClick={async () => { setOpen(false); await signOut(); router.push("/"); }}>
              {t.header.signOut}
            </button>
          ) : (
            <>
              <Link role="menuitem" href="/login" className={`${item} font-semibold text-brand`} onClick={() => setOpen(false)}>{t.header.signIn}</Link>
              <Link role="menuitem" href="/register" className={item} onClick={() => setOpen(false)}>{t.header.createAccount}</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LanguageProvider, useLang } from "@/lib/i18n/LanguageProvider";
import { HelpProvider, useHelp } from "./HelpDialog";
import { FolderIcon, HelpIcon, HomeIcon, TicketIcon } from "./icons";

/** Everything around the patient pages: language, the help pop-up, footer and phone navigation. */
export default function PatientShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <HelpProvider>
        <div className="min-h-dvh bg-white pb-20 md:pb-0">
          {children}
          <Footer />
        </div>
        <BottomNav />
      </HelpProvider>
    </LanguageProvider>
  );
}

function Footer() {
  const { t } = useLang();
  return (
    <footer className="mx-auto max-w-[1240px] px-4 pb-8 pt-4 sm:px-6">
      <p className="border-t border-line pt-5 text-center text-sm text-muted">{t.footer}</p>
    </footer>
  );
}

function BottomNav() {
  const { t } = useLang();
  const { open } = useHelp();
  const path = usePathname();
  const tab = "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[13px] font-semibold";
  const link = (href: string, label: string, icon: ReactNode) => {
    const current = href === "/" ? path === "/" : path.startsWith(href);
    return (
      <Link href={href} aria-current={current ? "page" : undefined} className={`${tab} ${current ? "text-brand" : "text-muted"}`}>
        {icon}
        {label}
      </Link>
    );
  };
  return (
    <nav aria-label={t.nav.label} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex">
        {link("/", t.nav.home, <HomeIcon />)}
        {link("/tokens", t.nav.tokens, <TicketIcon />)}
        {link("/records", t.nav.records, <FolderIcon />)}
        <button type="button" onClick={open} className={`${tab} text-muted`}>
          <HelpIcon />
          {t.nav.help}
        </button>
      </div>
    </nav>
  );
}

"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Logo from "@/components/ui/Logo";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { isIndianMobile } from "@/lib/validation";
import { CloseIcon } from "./icons";

const SHOWN_KEY = "clinically.helpShown"; // auto-open at most once per browser session

type HelpContext = {
  open: () => void;
  /** Open once per session (for the automatic triggers). */
  openOnce: () => void;
};
const Ctx = createContext<HelpContext>({ open: () => {}, openOnce: () => {} });

export function useHelp() {
  return useContext(Ctx);
}

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const openOnce = useCallback(() => {
    try {
      if (sessionStorage.getItem(SHOWN_KEY)) return;
      sessionStorage.setItem(SHOWN_KEY, "1");
    } catch {
      /* storage blocked: still open it */
    }
    setOpen(true);
  }, []);
  return (
    <Ctx.Provider value={{ open, openOnce }}>
      {children}
      <HelpDialog open={isOpen} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  );
}

type Kind = "doctor" | "lab" | "other";

/** "Can't find the right doctor?" — ask for a call back. Uses <dialog>: focus stays inside, Escape closes. */
function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const ref = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [kind, setKind] = useState<Kind>("doctor");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [problem, setProblem] = useState("");
  const [errors, setErrors] = useState<{ name?: string; mobile?: string }>({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setSent(false);
      setErrors({});
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  // The form disappears once sent: keep keyboard focus inside the pop-up.
  useEffect(() => {
    if (sent) closeButton.current?.focus();
  }, [sent]);

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = t.help.errors.name;
    if (!isIndianMobile(mobile)) e.mobile = t.help.errors.mobile;
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(e.name ? "help-name" : "help-mobile")?.focus();
      return;
    }
    // No backend for call-back requests yet: show the confirmation.
    setSent(true);
  }

  const field = "w-full rounded-xl border-[1.5px] bg-white px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none";

  return (
    <dialog
      ref={ref}
      aria-labelledby="help-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-24px)] max-w-md rounded-[22px] border border-line p-0 text-ink shadow-soft backdrop:bg-ink/50"
    >
      <div className="max-h-[90dvh] overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <Logo size={34} />
          <button ref={closeButton} type="button" onClick={onClose} aria-label={t.common.close} className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center rounded-full hover:bg-brand-tint">
            <CloseIcon />
          </button>
        </div>
        <h2 id="help-title" className="mt-4 text-[22px] font-bold leading-tight">{t.help.title}</h2>
        <p className="mt-1.5 text-[15px] text-muted">{t.help.text}</p>

        {sent ? (
          <p role="status" className="mt-5 rounded-2xl bg-brand-light px-4 py-4 font-semibold text-brand-dark">{t.help.success}</p>
        ) : (
          <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
            <div role="radiogroup" aria-label={t.help.kindLabel} className="flex flex-wrap gap-2">
              {(["doctor", "lab", "other"] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
                  className={`min-h-[44px] rounded-full border-[1.5px] px-4 text-[15px] font-semibold ${kind === k ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand"}`}>
                  {t.help.kinds[k]}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="help-name" className="mb-1.5 block font-semibold">{t.help.name}</label>
              <input id="help-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
                aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "help-name-error" : undefined}
                className={`${field} ${errors.name ? "border-danger" : "border-line"}`} />
              {errors.name && <p id="help-name-error" className="mt-1.5 text-sm font-medium text-danger">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="help-mobile" className="mb-1.5 block font-semibold">{t.help.mobile}</label>
              <div className={`flex overflow-hidden rounded-xl border-[1.5px] focus-within:border-brand ${errors.mobile ? "border-danger" : "border-line"}`}>
                <span className="flex items-center border-r border-line bg-brand-tint px-3 font-semibold text-muted">+91</span>
                <input id="help-mobile" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  aria-invalid={errors.mobile ? true : undefined} aria-describedby={errors.mobile ? "help-mobile-error" : undefined}
                  className="min-w-0 flex-1 bg-white px-3.5 py-3 text-base focus:outline-none" />
              </div>
              {errors.mobile && <p id="help-mobile-error" className="mt-1.5 text-sm font-medium text-danger">{errors.mobile}</p>}
            </div>
            <div>
              <label htmlFor="help-problem" className="mb-1.5 block font-semibold">{t.help.problem}</label>
              <input id="help-problem" value={problem} maxLength={120} onChange={(e) => setProblem(e.target.value)} className={`${field} border-line`} />
            </div>
            <button type="submit" className="min-h-[48px] rounded-full bg-brand px-6 text-[17px] font-semibold text-white hover:bg-brand-dark">{t.help.submit}</button>
          </form>
        )}
        <p className="mt-4 text-sm text-muted">{t.help.note}</p>
      </div>
    </dialog>
  );
}

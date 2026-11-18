import { t } from "@/lib/strings";

const DAY_MS = 86_400_000;

/** The doctor's free trial. Only a reminder: nothing stops working when it ends. */
export default function TrialBanner({ endsAt }: { endsAt?: string | null }) {
  if (!endsAt) return null; // staff, or accounts without a trial
  const msLeft = new Date(endsAt).getTime() - Date.now();
  const days = Math.ceil(msLeft / DAY_MS);
  const ended = msLeft <= 0;
  // Quiet until the last two weeks, then more visible.
  const urgent = ended || days <= 14;
  return (
    <div className={`border-b px-4 py-2 text-center text-[15px] font-semibold ${urgent ? "border-[#F2D49B] bg-[#FFF4DE] text-[#7A4B00]" : "border-line bg-brand-tint text-brand-dark"}`}>
      {ended ? t.trial.ended : days <= 1 ? t.trial.lastDay : t.trial.left(days)}
    </div>
  );
}

type Props = { size?: number; showText?: boolean };

/** Apki Bari logo: a clinic whose roof is a stethoscope. */
export default function Logo({ size = 40, showText = true }: Props) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <path d="M40 100 L100 50 L160 100 L148 100 L148 160 Q148 170 138 170 L62 170 Q52 170 52 160 L52 100 Z" fill="#1F7A55" />
        <rect x="92" y="104" width="16" height="44" rx="3" fill="#FFFFFF" />
        <rect x="78" y="118" width="44" height="16" rx="3" fill="#FFFFFF" />
        <path d="M36 100 L100 46 L164 100" fill="none" stroke="#1D2340" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="36" cy="100" r="7" fill="#1D2340" />
        <circle cx="164" cy="100" r="7" fill="#1D2340" />
        <path d="M100 46 C100 18 176 18 178 64 L178 124" fill="none" stroke="#1D2340" strokeWidth="7" strokeLinecap="round" />
        <circle cx="178" cy="140" r="17" fill="#E8A317" />
        <circle cx="178" cy="140" r="7" fill="#FFFFFF" />
      </svg>
      {showText && (
        <span className="leading-tight">
          <span className="block text-xl font-bold tracking-tight text-ink">Apki Bari</span>
          <span className="block font-[Mukta] text-sm text-muted">आपकी बारी</span>
        </span>
      )}
    </span>
  );
}

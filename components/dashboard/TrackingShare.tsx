"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { trackingPath } from "@/lib/patientApi";
import { t } from "@/lib/strings";
import { pill } from "./ui";

/**
 * After the desk adds a walk-in: the patient scans the QR code (or gets the link on WhatsApp)
 * and follows the queue live on their own phone, so they can step out and come back on time.
 */
export default function TrackingShare({ token, name, phone, bookingId, code, doctorName, onDone }: {
  token: number;
  name: string;
  phone?: string;
  bookingId: string;
  code: string;
  doctorName: string;
  onDone: () => void;
}) {
  const link = `${window.location.origin}${trackingPath(bookingId, code)}`;
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(link, { margin: 1, width: 220, errorCorrectionLevel: "M" }).then(setQr, () => setQr(""));
  }, [link]);

  const message = t.share.message(token, doctorName, link);
  const whatsapp = `https://wa.me/${phone ? `91${phone}` : ""}?text=${encodeURIComponent(message)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-brand bg-brand-light/60 p-4 text-center" role="status">
      <p className="text-[17px] font-bold text-ink">{t.share.title(token, name)}</p>
      <p className="text-[15px] text-muted">{t.share.text}</p>
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt={t.share.qrAlt(token)} width={220} height={220} className="rounded-xl bg-white p-2" />
      ) : (
        <span className="block h-[220px] w-[220px] animate-pulse rounded-xl bg-white motion-reduce:animate-none" aria-hidden="true" />
      )}
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#1F8A4C] px-4 font-semibold text-white hover:opacity-90">
          {phone ? t.share.whatsappTo(phone) : t.share.whatsapp}
        </a>
        <button type="button" onClick={copy} className={pill.outline}><span aria-live="polite">{copied ? t.share.copied : t.share.copy}</span></button>
      </div>
      <button type="button" onClick={onDone} className="min-h-[44px] font-semibold text-brand underline underline-offset-4">{t.share.done}</button>
    </div>
  );
}

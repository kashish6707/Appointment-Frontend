"use client";

// "You're next" alerts on the queue page: a short sound, a vibration, the tab title flashing
// and, if the patient allowed it, a phone notification. They only work while the queue page is
// open (in front or in the background); a closed page needs SMS/WhatsApp from the server.

let audio: AudioContext | null = null;

/** Browsers only allow sound after a tap: call this from a button press to unlock it. */
export function unlockSound() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") audio.resume();
  } catch {
    /* no Web Audio */
  }
}

function beep() {
  try {
    audio ??= new AudioContext();
    const ctx = audio;
    [0, 0.35, 0.7].forEach((at) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.3);
    });
  } catch {
    /* sound blocked until the patient taps the page */
  }
}

let flashing: ReturnType<typeof setInterval> | null = null;

function flashTitle(text: string) {
  if (flashing) clearInterval(flashing);
  const original = document.title;
  let on = false;
  flashing = setInterval(() => {
    on = !on;
    document.title = on ? text : original;
  }, 1000);
  const stop = () => {
    if (document.visibilityState !== "visible") return;
    if (flashing) clearInterval(flashing);
    flashing = null;
    document.title = original;
    document.removeEventListener("visibilitychange", stop);
  };
  // Stop once the patient is looking at the page (after a few flashes if it's already open).
  setTimeout(stop, 6000);
  document.addEventListener("visibilitychange", stop);
}

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationsAllowed() {
  return notificationsSupported() && Notification.permission === "granted";
}

/** Ask once, from a button press. Returns whether notifications are now allowed. */
export async function askForNotifications(): Promise<boolean> {
  unlockSound();
  if (!notificationsSupported()) return false;
  if (Notification.permission === "default") await Notification.requestPermission();
  return Notification.permission === "granted";
}

export function alertPatient(title: string, body: string) {
  beep();
  try {
    navigator.vibrate?.([400, 200, 400, 200, 400]);
  } catch {
    /* not supported */
  }
  flashTitle(title);
  if (notificationsAllowed() && document.visibilityState !== "visible") {
    try {
      new Notification(title, { body, tag: "clinically-queue", requireInteraction: true });
    } catch {
      /* some phones only allow notifications from an installed app */
    }
  }
}

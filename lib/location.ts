"use client";

// The patient's chosen location, remembered on this device.

import { useCallback, useEffect, useState } from "react";

export type SavedLocation = {
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  areaId: string;
  areaName: string;
  backendAreaId?: string; // for the home feed's distance, when the backend knows the area
  lat?: number;
  lng?: number;
};

const KEY = "clinically.location";
const EVENT = "clinically-location";

export const DEFAULT_LOCATION: SavedLocation = {
  stateId: "bihar",
  stateName: "Bihar",
  districtId: "patna",
  districtName: "Patna",
  areaId: "kankarbagh",
  areaName: "Kankarbagh",
};

export function loadLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedLocation) : null;
  } catch {
    return null;
  }
}

export function saveLocation(loc: SavedLocation) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loc));
  } catch {
    /* storage blocked: the choice lasts until the page closes */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The saved location, or null until it's been read (after the first render). */
export function useSavedLocation() {
  const [loc, setLoc] = useState<SavedLocation | null>(null);
  const [ready, setReady] = useState(false);
  const read = useCallback(() => {
    setLoc(loadLocation());
    setReady(true);
  }, []);
  useEffect(() => {
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, [read]);
  return { location: loc, ready };
}

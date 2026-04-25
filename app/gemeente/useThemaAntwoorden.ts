"use client";

import { useCallback, useSyncExternalStore } from "react";
import type {
  ConcernCategory,
  ThemaAntwoord,
  ThemaAntwoordenMap,
} from "@/lib/data/types";

const STORAGE_KEY = "samenspraak.gemeente.thema-antwoorden.v1";
const UPDATE_EVENT = "samenspraak:thema-antwoorden-update";

let cachedRaw: string | null = null;
let cachedMap: ThemaAntwoordenMap = {};
let cacheInvalidated = true;

function parseMap(raw: string | null): ThemaAntwoordenMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ThemaAntwoordenMap;
    }
    return {};
  } catch {
    return {};
  }
}

function readMap(): ThemaAntwoordenMap {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (cacheInvalidated || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedMap = parseMap(raw);
    cacheInvalidated = false;
  }
  return cachedMap;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onChange = () => {
    cacheInvalidated = true;
    callback();
  };
  window.addEventListener("storage", onChange);
  window.addEventListener(UPDATE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(UPDATE_EVENT, onChange);
  };
}

const SERVER_SNAPSHOT: ThemaAntwoordenMap = {};
function getServerSnapshot(): ThemaAntwoordenMap {
  return SERVER_SNAPSHOT;
}

export function useThemaAntwoorden() {
  const antwoorden = useSyncExternalStore(subscribe, readMap, getServerSnapshot);

  const updateThema = useCallback(
    (category: ConcernCategory, partial: Partial<ThemaAntwoord>) => {
      if (typeof window === "undefined") return;
      const current = readMap();
      const next: ThemaAntwoordenMap = {
        ...current,
        [category]: {
          antwoord: current[category]?.antwoord ?? "",
          planwijziging: current[category]?.planwijziging ?? "",
          ...partial,
        },
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage write may fail (private mode, quota) — non-fatal
      }
      cacheInvalidated = true;
      window.dispatchEvent(new Event(UPDATE_EVENT));
    },
    [],
  );

  return { antwoorden, updateThema };
}

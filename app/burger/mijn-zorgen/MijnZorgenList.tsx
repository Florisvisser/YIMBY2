"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  CATEGORY_LABEL_NL,
  STATUS_LABEL_NL,
  type Concern,
  type ConcernStatus,
} from "@/lib/data/types";

const STORAGE_KEY = "samenspraak.submissions.v1";

function subscribeStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? (parsed.filter((x) => typeof x === "string") as string[])
      : [];
  } catch {
    return [];
  }
}

function useSubmissionIds(): string[] | null {
  return useSyncExternalStore(
    subscribeStorage,
    readIds,
    () => null,
  );
}

const STATUS_STYLE: Record<ConcernStatus, { bg: string; fg: string }> = {
  new: { bg: "var(--moss-50)", fg: "var(--moss-700)" },
  in_review: { bg: "var(--amber-50)", fg: "var(--amber-500)" },
  answered: { bg: "var(--paper-100, var(--paper-0))", fg: "var(--fg-tertiary)" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MijnZorgenList({
  supabaseConfigured,
}: {
  supabaseConfigured: boolean;
}) {
  const ids = useSubmissionIds();
  const [concerns, setConcerns] = useState<Concern[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids === null || ids.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/concerns/mine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(typeof data?.error === "string" ? data.error : "Kon zienswijzen niet laden.");
          return;
        }
        setConcerns(data as Concern[]);
      } catch {
        if (!cancelled) setError("Verbinding mislukt. Probeer opnieuw.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (!supabaseConfigured) {
    return (
      <div
        style={{
          background: "var(--amber-50)",
          color: "var(--amber-500)",
          padding: "14px 18px",
          borderRadius: "var(--radius-md)",
          fontSize: 14,
        }}
      >
        Demo-modus: persistentie offline. Inzendingen worden niet opgeslagen.
      </div>
    );
  }

  if (ids === null) {
    return <div style={{ color: "var(--fg-muted)", fontSize: 14 }}>Laden…</div>;
  }

  if (ids.length === 0) {
    return (
      <div
        style={{
          background: "var(--paper-0)",
          borderRadius: "var(--radius-lg)",
          padding: 28,
          boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: 15, color: "var(--fg-secondary)" }}>
          Je hebt nog geen zienswijzen ingediend op dit apparaat.
        </p>
        <Link
          href="/burger"
          style={{
            display: "inline-flex",
            padding: "12px 20px",
            borderRadius: "var(--radius-md)",
            background: "var(--moss-500)",
            color: "var(--paper-50)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Dien er een in
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: "var(--rose-50)",
          color: "var(--rose-500)",
          padding: "14px 18px",
          borderRadius: "var(--radius-md)",
          fontSize: 14,
        }}
      >
        {error}
      </div>
    );
  }

  if (concerns === null) {
    return <div style={{ color: "var(--fg-muted)", fontSize: 14 }}>Zorgen ophalen…</div>;
  }

  if (concerns.length === 0) {
    return (
      <div
        style={{
          background: "var(--paper-0)",
          borderRadius: "var(--radius-lg)",
          padding: 22,
          boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
          fontSize: 14,
          color: "var(--fg-secondary)",
        }}
      >
        Je inzending is wel ingediend op dit apparaat, maar lijkt niet meer in de database te
        staan. Mogelijk is de demo-data gewist.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {concerns.map((c) => {
        const status = c.status ?? "new";
        const sty = STATUS_STYLE[status];
        return (
          <article
            key={c.id}
            style={{
              background: "var(--paper-0)",
              borderRadius: "var(--radius-lg)",
              padding: 22,
              boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "var(--fg-tertiary)",
                }}
              >
                {CATEGORY_LABEL_NL[c.category]}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  background: sty.bg,
                  color: sty.fg,
                  boxShadow: "var(--shadow-hairline)",
                }}
              >
                {STATUS_LABEL_NL[status]}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14.5,
                lineHeight: 1.55,
                color: "var(--ink-700)",
              }}
            >
              {c.concernText}
            </p>
            <div
              style={{
                fontSize: 12,
                color: "var(--fg-muted)",
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span>{formatDate(c.submittedAt)}</span>
              <span>·</span>
              <span>
                {c.postcode}
                {c.streetReference ? ` · ${c.streetReference}` : ""}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

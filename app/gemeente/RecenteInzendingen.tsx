"use client";

import { useRef, useState } from "react";
import {
  CATEGORY_LABEL_NL,
  STATUS_LABEL_NL,
  type Concern,
  type ConcernStatus,
} from "@/lib/data/types";

type FilterValue = "all" | ConcernStatus;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "new", label: "Nieuw" },
  { value: "in_review", label: "In behandeling" },
  { value: "answered", label: "Beantwoord" },
];

const STATUS_BADGE: Record<ConcernStatus, { bg: string; fg: string }> = {
  new: { bg: "var(--moss-50)", fg: "var(--moss-700)" },
  in_review: { bg: "var(--amber-50)", fg: "var(--amber-500)" },
  answered: { bg: "var(--paper-100, var(--paper-0))", fg: "var(--fg-tertiary)" },
};

function snippet(text: string, max = 140): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecenteInzendingen({
  concerns,
}: {
  concerns: Concern[];
}) {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [overrides, setOverrides] = useState<Record<string, ConcernStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inFlight = useRef<Record<string, boolean>>({});

  const enriched = concerns.map((c) => ({
    ...c,
    status: overrides[c.id] ?? c.status ?? ("new" as ConcernStatus),
  }));

  const visible = filter === "all" ? enriched : enriched.filter((c) => c.status === filter);

  async function setStatus(id: string, newStatus: ConcernStatus, currentStatus: ConcernStatus) {
    if (inFlight.current[id]) return;
    inFlight.current[id] = true;
    setOverrides((prev) => ({ ...prev, [id]: newStatus }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      const res = await fetch(`/api/concerns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setOverrides((prev) => ({ ...prev, [id]: currentStatus }));
        setErrors((prev) => ({
          ...prev,
          [id]: typeof data?.error === "string" ? data.error : "Update mislukt.",
        }));
      }
    } catch {
      setOverrides((prev) => ({ ...prev, [id]: currentStatus }));
      setErrors((prev) => ({ ...prev, [id]: "Verbinding mislukt." }));
    } finally {
      inFlight.current[id] = false;
    }
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
          color: "var(--fg-tertiary)",
        }}
      >
        Nog geen burger-inzendingen via /burger. De seeded zienswijzen verschijnen alleen in de
        thema-cards hierboven.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? enriched.length
              : enriched.filter((c) => c.status === f.value).length;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                border: "none",
                background: active ? "var(--ink-900)" : "var(--paper-0)",
                color: active ? "var(--paper-50)" : "var(--fg-secondary)",
                boxShadow: "var(--shadow-hairline)",
                transition: `background var(--dur-fast) var(--ease-out)`,
              }}
            >
              {f.label}{" "}
              <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.7 }}>· {count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div
          style={{
            background: "var(--paper-0)",
            borderRadius: "var(--radius-lg)",
            padding: 22,
            boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
            fontSize: 14,
            color: "var(--fg-tertiary)",
          }}
        >
          Geen zienswijzen in deze status.
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map((c) => {
            const status = c.status;
            const sty = STATUS_BADGE[status];
            const showInReviewBtn = status !== "in_review";
            const showAnsweredBtn = status !== "answered";
            return (
              <li
                key={c.id}
                style={{
                  background: "var(--paper-0)",
                  borderRadius: "var(--radius-lg)",
                  padding: 18,
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
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                      fontSize: 12,
                      color: "var(--fg-tertiary)",
                      fontFamily: "var(--font-mono)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <span>{c.postcode}</span>
                    <span>·</span>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {CATEGORY_LABEL_NL[c.category]}
                    </span>
                    <span>·</span>
                    <span>ernst {c.severity}/5</span>
                    <span>·</span>
                    <span>{formatDateTime(c.submittedAt)}</span>
                  </div>
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

                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--ink-700)" }}>
                  {snippet(c.concernText)}
                </p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {showInReviewBtn && (
                    <button
                      type="button"
                      onClick={() => setStatus(c.id, "in_review", status)}
                      style={statusButtonStyle("amber")}
                    >
                      Markeer in behandeling
                    </button>
                  )}
                  {showAnsweredBtn && (
                    <button
                      type="button"
                      onClick={() => setStatus(c.id, "answered", status)}
                      style={statusButtonStyle("moss")}
                    >
                      Markeer beantwoord
                    </button>
                  )}
                </div>

                {errors[c.id] && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--rose-500)",
                      background: "var(--rose-50)",
                      padding: "6px 10px",
                      borderRadius: "var(--radius-sm, 6px)",
                    }}
                  >
                    {errors[c.id]}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function statusButtonStyle(tone: "moss" | "amber"): React.CSSProperties {
  const bg = tone === "moss" ? "var(--moss-500)" : "var(--amber-500)";
  return {
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "var(--font-sans)",
    background: bg,
    color: "var(--paper-50)",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
  };
}

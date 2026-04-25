"use client";

import { useRef, useState } from "react";
import {
  CATEGORY_LABEL_NL,
  CONCERN_CATEGORIES,
  STATUS_LABEL_NL,
  type Concern,
  type ConcernCategory,
  type ConcernStatus,
} from "@/lib/data/types";
import { groupByCategory } from "@/lib/data/concerns";
import { severityTone } from "./severity-utils";

type FilterValue = "all" | ConcernStatus;
type ViewMode = "list" | "thema";

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

function averageSeverity(concerns: Concern[]): number {
  if (concerns.length === 0) return 0;
  return Math.round((concerns.reduce((s, c) => s + c.severity, 0) / concerns.length) * 10) / 10;
}

type SuggestionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; responseAdvice: string; planAdjustment: string }
  | { status: "error"; message: string };

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function RecenteInzendingen({
  concerns,
}: {
  concerns: Concern[];
}) {
  const [filter, setFilter] = useState<FilterValue>("new");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [overrides, setOverrides] = useState<Record<string, ConcernStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Record<string, SuggestionState>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const inFlight = useRef<Record<string, boolean>>({});
  const suggestInFlight = useRef<Record<string, boolean>>({});
  const bulkInFlight = useRef<Record<string, boolean>>({});

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

  async function markAllAnswered(category: ConcernCategory, ids: string[]) {
    const safeIds = ids.filter((id) => !inFlight.current[id]);
    if (bulkInFlight.current[category] || safeIds.length === 0) return;
    bulkInFlight.current[category] = true;
    const prevStatuses = Object.fromEntries(
      safeIds.map((id) => [id, enriched.find((c) => c.id === id)?.status ?? ("new" as ConcernStatus)]),
    );
    setOverrides((o) => ({
      ...o,
      ...Object.fromEntries(safeIds.map((id) => [id, "answered" as ConcernStatus])),
    }));
    try {
      const results = await Promise.allSettled(
        safeIds.map((id) =>
          fetch(`/api/concerns/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "answered" }),
          }),
        ),
      );
      results.forEach((r, i) => {
        if (r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)) {
          const id = safeIds[i];
          setOverrides((o) => ({ ...o, [id]: prevStatuses[id] }));
          console.warn(`[bulk-mark] PATCH mislukt voor ${safeIds[i]}`);
        }
      });
    } finally {
      bulkInFlight.current[category] = false;
    }
  }

  async function fetchSuggestion(category: ConcernCategory, categoryEnriched: Concern[]) {
    if (suggestInFlight.current[category]) return;
    suggestInFlight.current[category] = true;
    setSuggestions((prev) => ({ ...prev, [category]: { status: "loading" } }));
    try {
      const res = await fetch("/api/concerns/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          concerns: categoryEnriched.map((c) => ({
            concernText: c.concernText,
            severity: c.severity,
            personaType: c.personaType,
            neighbourhood: c.neighbourhood,
          })),
        }),
      });
      const data = await res.json() as { responseAdvice?: string; planAdjustment?: string; error?: string };
      if (!res.ok) {
        setSuggestions((prev) => ({
          ...prev,
          [category]: { status: "error", message: "Voorstel ophalen mislukt." },
        }));
      } else {
        setSuggestions((prev) => ({
          ...prev,
          [category]: {
            status: "done",
            responseAdvice: data.responseAdvice ?? "",
            planAdjustment: data.planAdjustment ?? "",
          },
        }));
      }
    } catch {
      setSuggestions((prev) => ({
        ...prev,
        [category]: { status: "error", message: "Verbinding mislukt." },
      }));
    } finally {
      suggestInFlight.current[category] = false;
    }
  }

  function toggleGroup(category: ConcernCategory) {
    setExpandedGroups((prev) => ({
      ...prev,
      [category]: !(prev[category] !== false),
    }));
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

  const grouped = groupByCategory(enriched);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* View mode toggle */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--fg-tertiary)", fontWeight: 500 }}>Weergave:</span>
        {(["list", "thema"] as ViewMode[]).map((mode) => {
          const active = viewMode === mode;
          const label = mode === "list" ? "Per inzending" : "Per thema";
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
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
              {label}
            </button>
          );
        })}
      </div>

      {viewMode === "list" ? (
        <>
          {/* Status filter chips */}
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
                        {(() => {
                          const tone = severityTone(c.severity);
                          return (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "2px 8px",
                                borderRadius: "var(--radius-full)",
                                background: tone.bg,
                                color: tone.fg,
                                fontWeight: 500,
                                textTransform: "none",
                                letterSpacing: 0,
                              }}
                              title={`${tone.label} prioriteit`}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: tone.fg,
                                  display: "inline-block",
                                }}
                              />
                              ernst {c.severity}/5
                            </span>
                          );
                        })()}
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
        </>
      ) : (
        /* Per-thema view */
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {CONCERN_CATEGORIES.map((category) => {
            const groupConcerns = grouped[category];
            if (groupConcerns.length === 0) return null;

            const isExpanded = expandedGroups[category] !== false;
            const unansweredIds = groupConcerns
              .filter((c) => c.status !== "answered")
              .map((c) => c.id);
            const avgSev = averageSeverity(groupConcerns);
            const suggestion: SuggestionState = suggestions[category] ?? { status: "idle" };

            return (
              <div
                key={category}
                style={{
                  background: "var(--paper-0)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
                  overflow: "hidden",
                }}
              >
                {/* Group header */}
                <div
                  style={{
                    background: "var(--paper-50)",
                    padding: "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    borderBottom: isExpanded ? "1px solid var(--border-soft)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(category)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink-900)" }}>
                        {CATEGORY_LABEL_NL[category]}
                      </span>
                      <ChevronIcon open={isExpanded} />
                    </button>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "3px 9px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--moss-50)",
                        color: "var(--moss-700)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {groupConcerns.length} zienswijzen
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--fg-tertiary)",
                        fontFamily: "var(--font-mono)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      ernst {avgSev.toFixed(1)} / 5
                    </span>
                  </div>
                  {unansweredIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllAnswered(category, unansweredIds)}
                      style={statusButtonStyle("moss")}
                    >
                      Markeer alle als beantwoord ({unansweredIds.length})
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Concern list */}
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {groupConcerns.map((c) => {
                        const tone = severityTone(c.severity);
                        const sty = STATUS_BADGE[c.status ?? "new"];
                        return (
                          <li
                            key={c.id}
                            style={{
                              background: "var(--paper-50)",
                              borderRadius: "var(--radius-md)",
                              padding: "10px 14px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                flexWrap: "wrap",
                                justifyContent: "space-between",
                              }}
                            >
                              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                    padding: "2px 8px",
                                    borderRadius: "var(--radius-full)",
                                    background: tone.bg,
                                    color: tone.fg,
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  ernst {c.severity}/5
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "var(--fg-tertiary)",
                                    fontFamily: "var(--font-mono)",
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  {c.postcode} · {formatDateTime(c.submittedAt)}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 500,
                                  padding: "2px 8px",
                                  borderRadius: "var(--radius-full)",
                                  background: sty.bg,
                                  color: sty.fg,
                                  boxShadow: "var(--shadow-hairline)",
                                }}
                              >
                                {STATUS_LABEL_NL[c.status ?? "new"]}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-700)" }}>
                              {snippet(c.concernText, 200)}
                            </p>
                          </li>
                        );
                      })}
                    </ul>

                    {/* AI suggestion area */}
                    <div
                      style={{
                        borderTop: "1px solid var(--border-soft)",
                        paddingTop: 12,
                        marginTop: 4,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {suggestion.status === "idle" && (
                        <button
                          type="button"
                          onClick={() => fetchSuggestion(category, groupConcerns)}
                          style={{
                            alignSelf: "flex-start",
                            padding: "8px 14px",
                            borderRadius: "var(--radius-md)",
                            background: "var(--paper-50)",
                            color: "var(--ink-700)",
                            border: "none",
                            fontFamily: "var(--font-sans)",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            boxShadow: "var(--shadow-hairline)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <SparkIcon />
                          AI-voorstel genereren
                        </button>
                      )}

                      {suggestion.status === "loading" && (
                        <div
                          style={{
                            fontSize: 13,
                            color: "var(--fg-tertiary)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <SparkIcon />
                          Voorstel wordt gegenereerd…
                        </div>
                      )}

                      {suggestion.status === "done" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div
                            style={{
                              background: "var(--moss-50)",
                              borderLeft: "3px solid var(--moss-300)",
                              borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                              padding: "10px 14px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 500,
                                textTransform: "uppercase",
                                letterSpacing: "0.12em",
                                color: "var(--moss-700)",
                              }}
                            >
                              Suggestie antwoord aan bewoners
                            </span>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--ink-700)" }}>
                              {suggestion.responseAdvice}
                            </p>
                          </div>
                          <div
                            style={{
                              background: "var(--sky-100)",
                              borderLeft: "3px solid var(--sky-300)",
                              borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                              padding: "10px 14px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 500,
                                textTransform: "uppercase",
                                letterSpacing: "0.12em",
                                color: "var(--sky-500)",
                              }}
                            >
                              Suggestie plan-aanpassing
                            </span>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--ink-700)" }}>
                              {suggestion.planAdjustment}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSuggestions((prev) => ({ ...prev, [category]: { status: "idle" } }))
                            }
                            style={{
                              alignSelf: "flex-start",
                              padding: "6px 12px",
                              background: "transparent",
                              border: "none",
                              fontSize: 12,
                              color: "var(--fg-tertiary)",
                              cursor: "pointer",
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            Opnieuw genereren
                          </button>
                        </div>
                      )}

                      {suggestion.status === "error" && (
                        <div
                          style={{
                            background: "var(--rose-50)",
                            borderRadius: "var(--radius-sm)",
                            padding: "8px 12px",
                            fontSize: 13,
                            color: "var(--rose-500)",
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          {suggestion.message}
                          <button
                            type="button"
                            onClick={() =>
                              setSuggestions((prev) => ({ ...prev, [category]: { status: "idle" } }))
                            }
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: 12,
                              color: "var(--rose-500)",
                              cursor: "pointer",
                              textDecoration: "underline",
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            Opnieuw proberen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

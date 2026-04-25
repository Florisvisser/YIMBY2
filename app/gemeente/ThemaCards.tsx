"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  PERSONA_LABEL_NL,
  type CategoryStats,
  type Concern,
  type ConcernCategory,
  type PersonaType,
} from "@/lib/data/types";
import { severityTone } from "./severity-utils";

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

type ThemaCardsProps = {
  stats: CategoryStats[];
  concerns: Concern[];
};

export default function ThemaCards({ stats, concerns }: ThemaCardsProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ConcernCategory | null>(null);
  const [hoveredCategory, setHoveredCategory] =
    useState<ConcernCategory | null>(null);

  const selectedStat = stats.find((s) => s.category === selectedCategory);
  const selectedConcerns = concerns.filter(
    (c) => c.category === selectedCategory,
  );

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {stats.map((stat) => {
          const isHovered = hoveredCategory === stat.category;
          return (
            <div
              key={stat.category}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCategory(stat.category)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedCategory(stat.category);
                }
              }}
              onMouseEnter={() => setHoveredCategory(stat.category)}
              onMouseLeave={() => setHoveredCategory(null)}
              onFocus={() => setHoveredCategory(stat.category)}
              onBlur={() => setHoveredCategory(null)}
              style={{
                background: "var(--paper-0)",
                borderRadius: "var(--radius-lg)",
                padding: 22,
                boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                cursor: "pointer",
                outline: isHovered
                  ? "2px solid var(--moss-200)"
                  : "2px solid transparent",
                transition: "outline-color 120ms ease",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--ink-900)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                  }}
                >
                  {stat.label}
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--moss-50)",
                    color: "var(--moss-700)",
                    boxShadow: "var(--shadow-hairline)",
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {stat.count} zienswijzen
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 18,
                  fontSize: 13,
                  color: "var(--fg-tertiary)",
                }}
              >
                <span>
                  Ernst{" "}
                  <b
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--ink-700)",
                      fontWeight: 500,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {stat.severityAverage.toFixed(1)} / 5
                  </b>
                </span>
                <span style={{ color: "var(--moss-500)", fontSize: 12 }}>
                  Klik voor details →
                </span>
              </div>
              {stat.representative && (
                <blockquote
                  style={{
                    margin: 0,
                    paddingLeft: 12,
                    borderLeft: "2px solid var(--moss-300)",
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: "var(--ink-700)",
                    fontVariationSettings: "'opsz' 14, 'SOFT' 80",
                  }}
                >
                  &ldquo;
                  {stat.representative.concernText.length > 120
                    ? stat.representative.concernText.slice(0, 120).trimEnd() +
                      "…"
                    : stat.representative.concernText}
                  &rdquo;
                </blockquote>
              )}
            </div>
          );
        })}
      </div>

      {selectedCategory && selectedStat && (
        <ThemaModal
          stat={selectedStat}
          concerns={selectedConcerns}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </>
  );
}

function ThemaModal({
  stat,
  concerns,
  onClose,
}: {
  stat: CategoryStats;
  concerns: Concern[];
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const severityCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of concerns) severityCounts[c.severity] = (severityCounts[c.severity] ?? 0) + 1;
  const maxSevCount = Math.max(...Object.values(severityCounts), 1);

  const personaCounts: Partial<Record<PersonaType, number>> = {};
  for (const c of concerns) {
    personaCounts[c.personaType] = (personaCounts[c.personaType] ?? 0) + 1;
  }
  const personaTotal = concerns.length || 1;

  const neighbourhoodCounts: Record<string, number> = {};
  for (const c of concerns) {
    neighbourhoodCounts[c.neighbourhood] =
      (neighbourhoodCounts[c.neighbourhood] ?? 0) + 1;
  }
  const neighbourhoodEntries = Object.entries(neighbourhoodCounts).sort(
    (a, b) => b[1] - a[1],
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Details: ${stat.label}`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26, 22, 18, 0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper-0)",
          borderRadius: "var(--radius-xl)",
          padding: 28,
          boxShadow: "var(--shadow-md), var(--shadow-hairline)",
          maxWidth: 700,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "var(--fg-tertiary)",
                marginBottom: 6,
              }}
            >
              Thema-analyse
            </p>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: 24,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                color: "var(--ink-900)",
                fontVariationSettings: "'opsz' 144, 'SOFT' 50",
              }}
            >
              {stat.label}
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: 13,
                color: "var(--fg-tertiary)",
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.count} zienswijzen · gemiddelde ernst{" "}
              {stat.severityAverage.toFixed(1)} / 5
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluit"
            style={{
              background: "var(--paper-50)",
              border: "none",
              borderRadius: "var(--radius-full)",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--fg-secondary)",
              flexShrink: 0,
              boxShadow: "var(--shadow-hairline)",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {concerns.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: "var(--fg-tertiary)" }}>
            Geen zienswijzen in dit thema.
          </p>
        ) : (
          <>
            {/* Severity distribution */}
            <section>
              <SectionLabel>Verdeling ernst</SectionLabel>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 10,
                  height: 120,
                  padding: "0 4px",
                }}
              >
                {([1, 2, 3, 4, 5] as const).map((sev) => {
                  const count = severityCounts[sev] ?? 0;
                  const heightPct = (count / maxSevCount) * 100;
                  const tone = severityTone(sev);
                  return (
                    <div
                      key={sev}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        height: "100%",
                        justifyContent: "flex-end",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          color: "var(--fg-tertiary)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {count}
                      </span>
                      <div
                        style={{
                          width: "100%",
                          height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%`,
                          background: tone.bg,
                          border: `1.5px solid ${tone.fg}`,
                          borderRadius: "var(--radius-sm)",
                          minHeight: count > 0 ? 6 : 0,
                          transition: "height 200ms ease",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--fg-tertiary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {sev}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: 11,
                  color: "var(--fg-tertiary)",
                  textAlign: "center",
                }}
              >
                ernst (1 = laag, 5 = hoog)
              </p>
            </section>

            {/* Persona breakdown */}
            <section>
              <SectionLabel>Wie dient in</SectionLabel>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                {(
                    Object.entries(PERSONA_LABEL_NL) as [
                      PersonaType,
                      string,
                    ][]
                  ).map(([type, label]) => {
                    const count = personaCounts[type] ?? 0;
                    const pct = (count / personaTotal) * 100;
                    return (
                      <div
                        key={type}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--fg-secondary)",
                            minWidth: 190,
                          }}
                        >
                          {label}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            background: "var(--paper-100)",
                            borderRadius: "var(--radius-full)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: "var(--clay-300)",
                              borderRadius: "var(--radius-full)",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontFamily: "var(--font-mono)",
                            color: "var(--fg-tertiary)",
                            fontVariantNumeric: "tabular-nums",
                            minWidth: 20,
                            textAlign: "right",
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* Neighbourhood breakdown */}
            {neighbourhoodEntries.length > 0 && (
              <section>
                <SectionLabel>Per wijk / buurt</SectionLabel>
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {neighbourhoodEntries.map(([neighbourhood, count]) => (
                    <li
                      key={neighbourhood}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 12px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--paper-50)",
                        boxShadow: "var(--shadow-hairline)",
                        fontSize: 13,
                        color: "var(--ink-700)",
                      }}
                    >
                      {neighbourhood}
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          fontVariantNumeric: "tabular-nums",
                          color: "var(--fg-tertiary)",
                        }}
                      >
                        {count}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* All concerns */}
            <section>
              <SectionLabel>Alle zienswijzen ({concerns.length})</SectionLabel>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {concerns
                  .slice()
                  .sort((a, b) => b.severity - a.severity)
                  .map((c) => {
                    const tone = severityTone(c.severity);
                    return (
                      <li
                        key={c.id}
                        style={{
                          background: "var(--paper-50)",
                          borderRadius: "var(--radius-md)",
                          padding: "12px 14px",
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
                          }}
                        >
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
                            }}
                          >
                            {c.neighbourhood} · {c.postcode}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.55,
                            color: "var(--ink-700)",
                          }}
                        >
                          {c.concernText}
                        </p>
                      </li>
                    );
                  })}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 10px 0",
        fontSize: 10,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "var(--fg-tertiary)",
      }}
    >
      {children}
    </p>
  );
}

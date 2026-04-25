"use client";

import { CATEGORY_LABEL_NL, type PlanUitlegReport, type ConcernCategory } from "@/lib/data/types";
import { Eyebrow, Lead } from "../ui";

const CATEGORY_ICON: Record<ConcernCategory, string> = {
  traffic_parking: "🚗",
  building_height: "🏢",
  green_nature: "🌳",
  noise_livability: "🔊",
};

const IMPACT_STYLE: Record<
  "laag" | "gemiddeld" | "hoog",
  { bg: string; fg: string; label: string }
> = {
  laag: { bg: "var(--moss-50)", fg: "var(--moss-700)", label: "Laag effect" },
  gemiddeld: { bg: "var(--amber-50)", fg: "var(--amber-500)", label: "Gemiddeld effect" },
  hoog: { bg: "var(--rose-50)", fg: "var(--rose-500)", label: "Hoog effect" },
};

export default function PlanUitlegStep({
  planUitleg,
  voornaam,
  onVraag,
  onZorg,
  onGeen,
}: {
  planUitleg: PlanUitlegReport;
  voornaam: string;
  onVraag: () => void;
  onZorg: () => void;
  onGeen: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <Eyebrow>Schapenweide · Bilthoven · 2026</Eyebrow>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(26px, 5.5vw, 34px)",
        fontWeight: 500,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        color: "var(--ink-900)",
        margin: "0 0 14px 0",
        textWrap: "balance",
        fontVariationSettings: "'opsz' 144, 'SOFT' 50",
      }}>
        Wat dit plan voor {voornaam ? `jou, ${voornaam},` : "jou"} betekent
      </h1>
      <Lead>{planUitleg.intro}</Lead>

      {/* Impact cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {planUitleg.sections.map((section) => {
          const impact = IMPACT_STYLE[section.impactLevel];
          return (
            <div
              key={section.category}
              style={{
                background: "var(--paper-0)",
                borderRadius: "var(--radius-lg)",
                padding: 18,
                boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{CATEGORY_ICON[section.category]}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {CATEGORY_LABEL_NL[section.category]}
                  </span>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  background: impact.bg,
                  color: impact.fg,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                  {impact.label}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink-900)", lineHeight: 1.3 }}>
                {section.headline}
              </p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--fg-secondary)" }}>
                {section.bodyText}
              </p>
            </div>
          );
        })}
      </div>

      {planUitleg.source === "fallback" && (
        <p style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 16 }}>
          * Algemene uitleg — gepersonaliseerde versie tijdelijk niet beschikbaar.
        </p>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          type="button"
          onClick={onVraag}
          style={{
            width: "100%",
            padding: "15px 20px",
            borderRadius: "var(--radius-md)",
            background: "var(--moss-500)",
            color: "var(--paper-50)",
            border: "none",
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          Ik heb een vraag over dit plan
        </button>
        <button
          type="button"
          onClick={onZorg}
          style={{
            width: "100%",
            padding: "15px 20px",
            borderRadius: "var(--radius-md)",
            background: "var(--paper-0)",
            color: "var(--ink-900)",
            border: "1px solid var(--border-soft)",
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          Ik heb een zorg om door te geven
        </button>
        <button
          type="button"
          onClick={onGeen}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--fg-tertiary)",
            textDecoration: "underline",
            padding: "8px 0",
          }}
        >
          Geen opmerkingen — terug naar begin
        </button>
      </div>
    </div>
  );
}

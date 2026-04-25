"use client";

import { useEffect, useState } from "react";
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

const IMPACT_LEVELS: Array<"laag" | "gemiddeld" | "hoog"> = ["laag", "gemiddeld", "hoog"];

const CARD_DETAIL: Record<ConcernCategory, { facts: string[]; tip: string }> = {
  traffic_parking: {
    facts: [
      "450 nieuwe woningen genereren ~900 extra autobewegingen per dag.",
      "De Emmalaan en Nachtegaallaan zijn de primaire ontsluitingswegen.",
      "De gemeente heeft een mobiliteitstoets uitgevoerd (2024).",
    ],
    tip: "Geef aan welke specifieke kruising of weg voor jou een probleem vormt.",
  },
  building_height: {
    facts: [
      "De hoogste blokken gaan richting 6 bouwlagen (circa 18 meter).",
      "Naastgelegen woningen kunnen meer schaduw en minder uitzicht krijgen.",
      "De bestaande woonschaal van Bilthoven is overwegend 2–3 lagen.",
    ],
    tip: "Beschrijf of het om bezonning, uitzicht of de schaalbreuk gaat.",
  },
  green_nature: {
    facts: [
      "Op het terrein leven beschermde dassen (Wet Natuurbescherming).",
      "Diverse volwassen bomen staan op de kaplijst.",
      "De gemeente is verplicht compenserende groenmaatregelen te nemen.",
    ],
    tip: "Benoem een specifieke boom, soort of habitat als je die kent.",
  },
  noise_livability: {
    facts: [
      "De bouwperiode loopt naar verwachting 6–8 jaar.",
      "Bouwgeluid is wettelijk toegestaan van 07:00–19:00 op werkdagen.",
      "De gemeente stelt een klachten-meldpunt in voor omwonenden.",
    ],
    tip: "Beschrijf hoe het nu al is en wat de verwachte extra overlast voor jou is.",
  },
};

function ChevronIcon({ down }: { down: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: down ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SchapenweideSchematic() {
  return (
    <svg
      viewBox="0 0 280 200"
      width="100%"
      style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
      aria-label="Schematisch overzicht Schapenweide ontwikkelgebied"
    >
      <rect width="280" height="200" fill="#FAF6EC" rx="8" />

      {/* Roads */}
      <rect x="0" y="90" width="280" height="14" fill="#D6CFB8" />
      <rect x="125" y="0" width="14" height="200" fill="#D6CFB8" />

      {/* Green areas */}
      <rect x="10" y="10" width="55" height="70" fill="#C8DEB4" rx="4" />
      <rect x="155" y="115" width="55" height="70" fill="#C8DEB4" rx="4" />
      <rect x="220" y="10" width="50" height="40" fill="#C8DEB4" rx="4" />

      {/* Building blocks */}
      <rect x="75" y="10" width="40" height="30" fill="#406A2C" rx="3" opacity="0.7" />
      <rect x="75" y="48" width="40" height="32" fill="#406A2C" rx="3" opacity="0.55" />
      <rect x="155" y="10" width="55" height="30" fill="#406A2C" rx="3" opacity="0.7" />
      <rect x="155" y="48" width="55" height="32" fill="#406A2C" rx="3" opacity="0.55" />
      <rect x="10" y="115" width="55" height="70" fill="#406A2C" rx="3" opacity="0.6" />
      <rect x="75" y="115" width="40" height="30" fill="#406A2C" rx="3" opacity="0.7" />
      <rect x="75" y="153" width="40" height="32" fill="#406A2C" rx="3" opacity="0.55" />
      <rect x="220" y="60" width="50" height="125" fill="#406A2C" rx="3" opacity="0.6" />

      {/* Road labels */}
      <text x="60" y="100" fontSize="8" fill="#8C8070" textAnchor="middle" fontFamily="monospace">
        Emmalaan
      </text>
      <text
        x="132"
        y="55"
        fontSize="8"
        fill="#8C8070"
        textAnchor="middle"
        fontFamily="monospace"
        transform="rotate(90, 132, 55)"
      >
        Nachtegaallaan
      </text>

      {/* Legend */}
      <rect x="10" y="178" width="9" height="9" fill="#406A2C" rx="1" opacity="0.65" />
      <text x="23" y="186" fontSize="8" fill="#5C5040" fontFamily="monospace">
        bebouwing
      </text>
      <rect x="85" y="178" width="9" height="9" fill="#C8DEB4" rx="1" />
      <text x="98" y="186" fontSize="8" fill="#5C5040" fontFamily="monospace">
        groen
      </text>

      {/* Footer label */}
      <text x="140" y="197" fontSize="7.5" fill="#8C8070" textAnchor="middle" fontFamily="monospace">
        Schapenweide · schematisch · niet op schaal
      </text>
    </svg>
  );
}

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
  const [narrow, setNarrow] = useState(false);
  const [expandedCard, setExpandedCard] = useState<ConcernCategory | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
        gap: narrow ? 32 : 48,
        alignItems: "start",
      }}
    >
      {/* Left: plan info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <Eyebrow>Schapenweide · Bilthoven · 2026</Eyebrow>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 5.5vw, 34px)",
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "var(--ink-900)",
            margin: "0 0 14px 0",
            textWrap: "balance",
            fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          }}
        >
          Wat dit plan voor {voornaam ? `jou, ${voornaam},` : "jou"} betekent
        </h1>
        <Lead>{planUitleg.intro}</Lead>

        {/* Impact cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {planUitleg.sections.map((section) => {
            const impact = IMPACT_STYLE[section.impactLevel];
            const isExpanded = expandedCard === section.category;
            const detail = CARD_DETAIL[section.category];
            return (
              <div key={section.category}>
                <button
                  type="button"
                  onClick={() => setExpandedCard(isExpanded ? null : section.category)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "var(--paper-0)",
                    borderRadius: isExpanded
                      ? "var(--radius-lg) var(--radius-lg) 0 0"
                      : "var(--radius-lg)",
                    padding: 18,
                    boxShadow: isExpanded ? "none" : "var(--shadow-sm), var(--shadow-hairline)",
                    border: "1px solid var(--border-soft)",
                    borderBottom: isExpanded ? "none" : "1px solid var(--border-soft)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                    transition: "box-shadow 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22, lineHeight: 1 }}>
                        {CATEGORY_ICON[section.category]}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--fg-secondary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {CATEGORY_LABEL_NL[section.category]}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "3px 10px",
                          borderRadius: "var(--radius-full)",
                          background: impact.bg,
                          color: impact.fg,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {impact.label}
                      </span>
                      <span style={{ color: "var(--fg-tertiary)" }}>
                        <ChevronIcon down={isExpanded} />
                      </span>
                    </div>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--ink-900)",
                      lineHeight: 1.3,
                    }}
                  >
                    {section.headline}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "var(--fg-secondary)",
                    }}
                  >
                    {section.bodyText}
                  </p>
                </button>

                {/* Expanded detail panel */}
                <div
                  style={{
                    maxHeight: isExpanded ? 400 : 0,
                    overflow: "hidden",
                    transition: "max-height 0.25s ease-out",
                  }}
                >
                  <div
                    style={{
                      background: "var(--paper-0)",
                      borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
                      border: "1px solid var(--border-soft)",
                      borderTop: "none",
                      padding: "14px 18px 18px",
                      boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {/* Impact meter */}
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "var(--fg-tertiary)",
                          margin: "0 0 8px 0",
                        }}
                      >
                        Impact niveau
                      </p>
                      <div style={{ display: "flex", gap: 4 }}>
                        {IMPACT_LEVELS.map((level) => {
                          const s = IMPACT_STYLE[level];
                          const active = level === section.impactLevel;
                          return (
                            <div
                              key={level}
                              style={{
                                flex: 1,
                                padding: "4px 8px",
                                borderRadius: "var(--radius-sm)",
                                background: active ? s.bg : "var(--paper-100)",
                                textAlign: "center",
                                fontSize: 11,
                                fontWeight: active ? 600 : 400,
                                color: active ? s.fg : "var(--fg-muted)",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {s.label.split(" ")[0]}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Facts */}
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "var(--fg-tertiary)",
                          margin: "0 0 6px 0",
                        }}
                      >
                        Feiten
                      </p>
                      <ul
                        style={{
                          margin: 0,
                          padding: "0 0 0 14px",
                          fontSize: 13,
                          color: "var(--fg-secondary)",
                          lineHeight: 1.6,
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                        }}
                      >
                        {detail.facts.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Tip */}
                    <div
                      style={{
                        background: "var(--moss-50)",
                        borderRadius: "var(--radius-md)",
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>💡</span>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: "var(--moss-700)",
                          lineHeight: 1.5,
                        }}
                      >
                        {detail.tip}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onZorg}
                      style={{
                        alignSelf: "flex-start",
                        padding: "8px 14px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--moss-500)",
                        color: "var(--paper-50)",
                        border: "none",
                        fontFamily: "var(--font-sans)",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Geef deze zorg door →
                    </button>
                  </div>
                </div>
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
            Ik heb een vraag of zorg over dit plan
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

      {/* Right: map + schematic */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--fg-tertiary)",
            margin: 0,
          }}
        >
          Locatie
        </p>
        <iframe
          title="Schapenweide locatie"
          src="https://www.openstreetmap.org/export/embed.html?bbox=5.175%2C52.118%2C5.215%2C52.134&layer=mapnik&marker=52.126%2C5.195"
          style={{
            width: "100%",
            aspectRatio: "4/3",
            border: "none",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
          }}
          loading="lazy"
        />
        <a
          href="https://www.openstreetmap.org/?mlat=52.126&mlon=5.195#map=15/52.126/5.195"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "var(--fg-muted)", textDecoration: "underline" }}
        >
          Vergroot kaart
        </a>

        <div style={{ marginTop: 8 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--fg-tertiary)",
              margin: "0 0 10px 0",
            }}
          >
            Ontwikkelgebied Schapenweide
          </p>
          <SchapenweideSchematic />
        </div>
      </div>
    </div>
  );
}

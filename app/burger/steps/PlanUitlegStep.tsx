"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  CATEGORY_LABEL_NL,
  type PlanUitlegReport,
  type ConcernCategory,
  type PublishedReport,
} from "@/lib/data/types";
import {
  SCHAPENWEIDE_LAT,
  SCHAPENWEIDE_LON,
  haversineKm,
  bearingLabel,
} from "@/lib/geo/schapenweide";
import { Eyebrow, Lead } from "../ui";
import OfficieleStukkenSectie from "./OfficieleStukkenSectie";

const PlanLocatieMap = dynamic(() => import("./PlanLocatieMap"), { ssr: false });

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

export default function PlanUitlegStep({
  planUitleg,
  voornaam,
  userLat,
  userLon,
  publishedReports = [],
  onVraag,
  onZorg,
  onGeen,
}: {
  planUitleg: PlanUitlegReport;
  voornaam: string;
  userLat?: number;
  userLon?: number;
  publishedReports?: PublishedReport[];
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

        <OfficieleStukkenSectie publishedReports={publishedReports} />

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
        {(() => {
          const hasUser = typeof userLat === "number" && typeof userLon === "number";
          const distanceKm = hasUser
            ? haversineKm(userLat as number, userLon as number, SCHAPENWEIDE_LAT, SCHAPENWEIDE_LON)
            : 0;
          const direction = hasUser
            ? bearingLabel(userLat as number, userLon as number, SCHAPENWEIDE_LAT, SCHAPENWEIDE_LON)
            : "";
          return (
            <>
              <PlanLocatieMap
                userLat={userLat}
                userLon={userLon}
                schapenweideLat={SCHAPENWEIDE_LAT}
                schapenweideLon={SCHAPENWEIDE_LON}
              />
              {hasUser && distanceKm > 0.05 ? (
                <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
                  📍 Jouw adres · plangebied Schapenweide ligt {distanceKm.toFixed(1)} km {direction}
                </p>
              ) : (
                <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
                  📍 Plangebied Schapenweide
                </p>
              )}
            </>
          );
        })()}

        <OmgevingsvisieFigure />
      </div>
    </div>
  );
}

function OmgevingsvisieFigure() {
  const [tab, setTab] = useState<"plankaart" | "luchtfoto" | "randvoorwaardenkaart">(
    "plankaart",
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);
  const sources: Record<typeof tab, { src: string; alt: string; caption: string; label: string }> = {
    plankaart: {
      src: "/schapenweide/plankaart-toekomstige-situatie.jpg",
      alt: "Plankaart toekomstige situatie gemeente De Bilt met Schapenweide gemarkeerd",
      caption: "Toekomstige situatie · regio De Bilt met Schapenweide gemarkeerd",
      label: "Plankaart",
    },
    luchtfoto: {
      src: "/schapenweide/luchtfoto-terrein.jpg",
      alt: "Luchtfoto van het Schapenweide-terrein in de huidige situatie",
      caption: "Huidige situatie · luchtfoto Schapenweide-terrein",
      label: "Luchtfoto",
    },
    randvoorwaardenkaart: {
      src: "/schapenweide/randvoorwaardenkaart.jpg",
      alt: "Randvoorwaardenkaart Schapenweide met groenstructuur, bouwvelden en overige randvoorwaarden",
      caption: "Randvoorwaardenkaart · groenstructuur, bouwvelden en zoneringen",
      label: "Randvoorwaardenkaart",
    },
  };
  const active = sources[tab];

  return (
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
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {(["plankaart", "luchtfoto", "randvoorwaardenkaart"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
              borderRadius: "var(--radius-full)",
              border: "1px solid",
              borderColor: tab === t ? "var(--moss-500)" : "var(--border-medium)",
              background: tab === t ? "var(--moss-50)" : "var(--paper-0)",
              color: tab === t ? "var(--moss-700)" : "var(--fg-secondary)",
              cursor: "pointer",
              fontWeight: tab === t ? 500 : 400,
            }}
          >
            {sources[t].label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label="Vergroot afbeelding"
        style={{
          display: "block",
          width: "100%",
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "zoom-in",
          borderRadius: "var(--radius-lg)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.src}
          alt={active.alt}
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-sm)",
            display: "block",
          }}
        />
      </button>
      <p style={{ fontSize: 11, color: "var(--fg-muted)", margin: "8px 0 4px 0" }}>
        {active.caption}
      </p>
      <a
        href="https://www.debilt.nl/fileadmin/bestanden/Over_De_Bilt/Projecten/Schapenweide/Ontwikkelperspectief_Schapenweide.pdf"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 11, color: "var(--fg-muted)", textDecoration: "underline" }}
      >
        Bron: Ontwikkelperspectief Schapenweide · Gemeente De Bilt (PDF)
      </a>
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26, 22, 18, 0.88)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "zoom-out",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            aria-label="Sluit afbeelding"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--paper-0)",
              color: "var(--ink-900)",
              border: "none",
              fontSize: 20,
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "var(--shadow-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.src}
            alt={active.alt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
              cursor: "default",
            }}
          />
        </div>
      )}
    </div>
  );
}


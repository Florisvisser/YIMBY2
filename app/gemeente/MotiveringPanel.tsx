"use client";

import { useRef, useState } from "react";
import type { CategoryStats, Concern, ThemaAntwoordenMap } from "@/lib/data/types";

interface ReportSection {
  category: string;
  concernCount: number;
  severityAverage: number;
  officialMotivation: string;
  residentExplanation: string;
  suggestedPlanAdjustment: string;
  evidenceSummary: string;
  reviewWarnings: string[];
}

interface MotiveringReport {
  source: string;
  generatedAt: string;
  title: string;
  status: string;
  summary: string;
  sections: ReportSection[];
}

function WarnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.39 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}


type PublishState =
  | { status: "idle" }
  | { status: "publishing" }
  | { status: "published"; reference: string; signedAt: string }
  | { status: "error"; error: string };

export default function MotiveringPanel({
  concerns: _concerns,
  stats: _stats,
  antwoorden: _antwoorden,
}: {
  concerns: Concern[];
  stats: CategoryStats[];
  antwoorden: ThemaAntwoordenMap;
}) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MotiveringReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [publishState, setPublishState] = useState<PublishState>({ status: "idle" });
  const requestInFlight = useRef(false);
  const publishInFlight = useRef(false);

  function openSignModal() {
    if (publishState.status === "published") return;
    setSignModalOpen(true);
  }

  async function confirmSign() {
    if (!report || publishInFlight.current) return;
    publishInFlight.current = true;
    setPublishState({ status: "publishing" });
    try {
      const res = await fetch("/api/reports/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishState({
          status: "error",
          error: typeof data?.error === "string" ? data.error : "Publiceren mislukt.",
        });
      } else {
        setPublishState({
          status: "published",
          reference: data.reference as string,
          signedAt: data.signedAt as string,
        });
        setSignModalOpen(false);
      }
    } catch {
      setPublishState({ status: "error", error: "Verbinding mislukt bij publiceren." });
    } finally {
      publishInFlight.current = false;
    }
  }

  function cancelSign() {
    if (publishState.status === "publishing") return;
    setSignModalOpen(false);
  }

  const handleClick = async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/motivering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: "schapenweide" }),
      });
      const data = await res.json();
      setReport(data);
    } catch {
      setError("Verslag kon niet worden gegenereerd. Probeer opnieuw.");
    } finally {
      setLoading(false);
      requestInFlight.current = false;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Generate panel */}
      {!report && (
        <div style={{
          background: "var(--paper-0)",
          borderRadius: "var(--radius-xl)",
          padding: 28,
          boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--fg-tertiary)" }}>
            Verslag
          </div>
          <h2 style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink-900)",
            fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          }}>
            Rond alle zienswijzen af in één verslag
          </h2>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--fg-secondary)", maxWidth: 640 }}>
            Het verslag bundelt per thema de zienswijzen, jouw antwoord aan bewoners en de voorgestelde planwijziging. U reviewt en ondertekent.
          </p>

          <button
            onClick={handleClick}
            disabled={loading}
            style={{
              alignSelf: "flex-start",
              padding: "14px 22px",
              borderRadius: "var(--radius-md)",
              background: loading ? "var(--moss-600)" : "var(--moss-500)",
              color: "var(--paper-50)",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              fontWeight: 500,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "var(--shadow-sm)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              position: "relative",
              overflow: "hidden",
              minWidth: 240,
              transition: `background var(--dur-fast) var(--ease-out)`,
            }}
          >
            <SparkIcon />
            {loading ? "Verslag wordt gegenereerd…" : "Genereer concept-verslag"}
            {loading && (
              <span style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                animation: "shimmer 1.4s linear infinite",
              }} />
            )}
          </button>

          {loading && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--fg-muted)" }}>
              Dit duurt ongeveer 60–90 seconden.
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "var(--rose-50)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          fontSize: 14,
          color: "var(--rose-500)",
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
        }}>
          <WarnIcon />
          {error}
        </div>
      )}

      {/* Report */}
      {report && (
        <div style={{
          background: "var(--paper-0)",
          borderRadius: "var(--radius-xl)",
          padding: 28,
          boxShadow: "var(--shadow-md), var(--shadow-hairline)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}>
          {/* Report header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--fg-tertiary)", marginBottom: 8 }}>
                Concept-participatieverslag
              </div>
              <h2 style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: 30,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "var(--ink-900)",
                fontVariationSettings: "'opsz' 144, 'SOFT' 50",
              }}>
                {report.title}
              </h2>
              <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "var(--fg-muted)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                Gegenereerd op{" "}
                {new Date(report.generatedAt).toLocaleString("nl-NL", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
                {report.source === "fallback" && " · concept-fallback"}
              </p>
            </div>
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--amber-50)",
              color: "var(--amber-500)",
              boxShadow: "var(--shadow-hairline)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber-300)", display: "inline-block" }} />
              {report.status}
            </span>
          </div>

          {/* Summary */}
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--fg-secondary)" }}>
            {report.summary}
          </p>

          {/* Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {report.sections.map((section) => (
              <div key={section.category} style={{
                background: "var(--paper-50)",
                borderRadius: "var(--radius-lg)",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink-900)" }}>
                    {section.category}
                  </h3>
                  <span style={{ fontSize: 12, color: "var(--fg-tertiary)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                    {section.concernCount} zienswijzen · ernst {section.severityAverage.toFixed(1)} / 5
                  </span>
                </div>

                {/* Ambtelijke motivering */}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 3, background: "var(--ink-900)", borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-600)", marginBottom: 6 }}>
                      Ambtelijke motivering
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--fg-secondary)" }}>
                      {section.officialMotivation}
                    </p>
                  </div>
                </div>

                {/* Bewoners uitleg */}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 3, background: "var(--clay-400)", borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--clay-500)", marginBottom: 6 }}>
                      Uitleg voor bewoners
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--fg-secondary)" }}>
                      {section.residentExplanation}
                    </p>
                  </div>
                </div>

                {/* Voorgestelde aanpassing */}
                {section.suggestedPlanAdjustment && (
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 3, background: "var(--sky-400)", borderRadius: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--sky-500)", marginBottom: 6 }}>
                        Voorgestelde aanpassing
                      </div>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--fg-secondary)" }}>
                        {section.suggestedPlanAdjustment}
                      </p>
                    </div>
                  </div>
                )}

                {/* Onderbouwing */}
                {section.evidenceSummary && (
                  <div style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "var(--paper-100)", fontSize: 13, lineHeight: 1.55, color: "var(--fg-tertiary)", fontStyle: "italic" }}>
                    {section.evidenceSummary}
                  </div>
                )}

                {/* Review warnings */}
                {section.reviewWarnings.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {section.reviewWarnings.map((warning, i) => (
                      <div key={i} style={{
                        background: "var(--amber-50)",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 12px",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        color: "var(--amber-500)",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}>
                        <WarnIcon />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {publishState.status === "published" ? (
              <span
                style={{
                  padding: "12px 20px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--moss-50)",
                  color: "var(--moss-700)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "var(--shadow-hairline)",
                }}
              >
                <CheckIcon />
                Gepubliceerd op{" "}
                {new Date(publishState.signedAt).toLocaleDateString("nl-NL", {
                  day: "numeric", month: "long", year: "numeric",
                })}
                {" · "}
                <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                  {publishState.reference}
                </span>
              </span>
            ) : (
              <button
                type="button"
                onClick={openSignModal}
                disabled={publishState.status === "publishing"}
                style={{
                  padding: "12px 20px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--moss-500)",
                  color: "var(--paper-50)",
                  border: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: publishState.status === "publishing" ? "wait" : "pointer",
                  boxShadow: "var(--shadow-sm)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: publishState.status === "publishing" ? 0.7 : 1,
                }}
              >
                <CheckIcon />
                Onderteken &amp; publiceer
              </button>
            )}
            <button style={{
              padding: "12px 20px",
              borderRadius: "var(--radius-md)",
              background: "var(--paper-0)",
              color: "var(--ink-900)",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
            }}>
              Bewerken
            </button>
            <button
              onClick={() => { setReport(null); setError(null); setPublishState({ status: "idle" }); }}
              style={{
                padding: "12px 20px",
                borderRadius: "var(--radius-md)",
                background: "transparent",
                color: "var(--fg-secondary)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Opnieuw genereren
            </button>
            </div>
            {publishState.status === "error" && (
              <div style={{
                background: "var(--rose-50)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--rose-500)",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}>
                <WarnIcon />
                {publishState.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onderteken & publiceer modal */}
      {signModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-modal-title"
          onClick={cancelSign}
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
              maxWidth: 440,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <p style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "var(--fg-tertiary)",
            }}>
              Officiële publicatie
            </p>
            <h3
              id="sign-modal-title"
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
              Onderteken & publiceer
            </h3>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--fg-secondary)" }}>
              Dit verslag wordt gepubliceerd als officieel participatierapport voor Schapenweide.
              Bewoners zien hierna het antwoord op hun zienswijze.
            </p>
            <div style={{
              background: "var(--paper-50)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              boxShadow: "var(--shadow-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 13,
            }}>
              <span style={{ color: "var(--fg-tertiary)" }}>Referentienummer</span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--ink-900)",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.04em",
              }}>
                SP-2026-…
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button
                type="button"
                onClick={cancelSign}
                disabled={publishState.status === "publishing"}
                style={{
                  padding: "10px 18px",
                  borderRadius: "var(--radius-md)",
                  background: "transparent",
                  color: "var(--fg-secondary)",
                  border: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: publishState.status === "publishing" ? "not-allowed" : "pointer",
                  opacity: publishState.status === "publishing" ? 0.5 : 1,
                }}
              >
                Annuleer
              </button>
              <button
                type="button"
                onClick={confirmSign}
                disabled={publishState.status === "publishing"}
                style={{
                  padding: "10px 18px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--moss-500)",
                  color: "var(--paper-50)",
                  border: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: publishState.status === "publishing" ? "wait" : "pointer",
                  boxShadow: "var(--shadow-sm)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: publishState.status === "publishing" ? 0.7 : 1,
                }}
              >
                <CheckIcon />
                {publishState.status === "publishing" ? "Publiceren…" : "Bevestig & publiceer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { PublishedReport } from "@/lib/data/types";

const PDF_URL =
  "https://www.debilt.nl/fileadmin/bestanden/Over_De_Bilt/Projecten/Schapenweide/Ontwikkelperspectief_Schapenweide.pdf";

export default function OfficieleStukkenSectie({
  publishedReports,
}: {
  publishedReports: PublishedReport[];
}) {
  const [openReport, setOpenReport] = useState<PublishedReport | null>(null);

  useEffect(() => {
    if (!openReport) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenReport(null);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [openReport]);

  return (
    <section
      style={{
        background: "var(--paper-0)",
        border: "1px solid var(--border-soft)",
        borderRadius: "var(--radius-lg)",
        padding: 18,
        marginBottom: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "var(--fg-tertiary)",
        }}
      >
        Officiële stukken
      </div>

      <a
        href={PDF_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          borderRadius: "var(--radius-md)",
          background: "var(--paper-50)",
          textDecoration: "none",
          color: "inherit",
          fontFamily: "var(--font-sans)",
        }}
      >
        <span style={{ fontSize: 22 }}>📄</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-900)" }}>
            Ontwikkelperspectief Schapenweide
          </span>
          <span style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
            Gemeente De Bilt · 29 februari 2024 · PDF (opent in nieuw tabblad)
          </span>
        </div>
        <span style={{ fontSize: 14, color: "var(--moss-700)" }}>↗</span>
      </a>

      {publishedReports.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--fg-tertiary)",
              marginTop: 4,
            }}
          >
            Eerder gepubliceerde verslagen ({publishedReports.length})
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            {publishedReports.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpenReport(r)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--moss-50)",
                    color: "var(--moss-700)",
                    border: "none",
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 16 }}>📋</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                    {r.reference}
                  </span>
                  <span style={{ color: "var(--fg-tertiary)" }}>·</span>
                  <span>
                    {new Date(r.signedAt).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {openReport && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenReport(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26, 22, 18, 0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--paper-0)",
              borderRadius: "var(--radius-xl)",
              padding: 28,
              boxShadow: "var(--shadow-md)",
              maxWidth: 720,
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "var(--fg-tertiary)",
                  }}
                >
                  Gepubliceerd verslag · ref. {openReport.reference}
                </p>
                <h2
                  style={{
                    margin: "6px 0 0 0",
                    fontFamily: "var(--font-display)",
                    fontSize: 24,
                    fontWeight: 500,
                    color: "var(--ink-900)",
                    fontVariationSettings: "'opsz' 144, 'SOFT' 50",
                  }}
                >
                  {openReport.title}
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--fg-tertiary)" }}>
                  Ondertekend op{" "}
                  {new Date(openReport.signedAt).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenReport(null)}
                aria-label="Sluit"
                style={{
                  background: "var(--paper-50)",
                  border: "none",
                  borderRadius: "var(--radius-full)",
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  fontSize: 16,
                  color: "var(--fg-secondary)",
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--fg-secondary)" }}>
              {openReport.summary}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {openReport.sections.map((section) => (
                <div
                  key={section.category}
                  style={{
                    background: "var(--paper-50)",
                    borderRadius: "var(--radius-md)",
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ink-900)",
                    }}
                  >
                    {section.category}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--fg-secondary)" }}>
                    {section.residentExplanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

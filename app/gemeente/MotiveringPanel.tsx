"use client";

import { useRef, useState } from "react";

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

export default function MotiveringPanel() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MotiveringReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestInFlight = useRef(false);

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
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={handleClick}
          disabled={loading}
          className="rounded-lg bg-neutral-900 text-white px-6 py-3 font-medium hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verslag wordt gegenereerd…" : "Genereer verslag"}
        </button>
        {loading && (
          <p className="text-sm text-neutral-400">
            Dit duurt ongeveer 60–90 seconden.
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {report && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                {report.title}
              </h2>
              <p className="text-sm text-neutral-400 mt-1">
                Gegenereerd op{" "}
                {new Date(report.generatedAt).toLocaleString("nl-NL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {report.source === "fallback" && " · concept-fallback"}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
              {report.status}
            </span>
          </div>

          <p className="text-neutral-600 leading-relaxed">{report.summary}</p>

          <div className="space-y-6">
            {report.sections.map((section) => (
              <div
                key={section.category}
                className="bg-white border border-neutral-200 rounded-lg p-6 space-y-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {section.category}
                  </h3>
                  <div className="text-sm text-neutral-500 shrink-0">
                    {section.concernCount} zienswijzen ·{" "}
                    <span className="font-medium text-neutral-700">
                      ernst {section.severityAverage.toFixed(1)} / 5
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1">
                      Ambtelijke motivering
                    </p>
                    <p className="text-neutral-700 leading-relaxed">
                      {section.officialMotivation}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1">
                      Uitleg voor bewoners
                    </p>
                    <p className="text-neutral-700 leading-relaxed">
                      {section.residentExplanation}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1">
                      Voorgestelde aanpassing
                    </p>
                    <p className="text-neutral-700 leading-relaxed">
                      {section.suggestedPlanAdjustment}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1">
                      Onderbouwing
                    </p>
                    <p className="text-neutral-600 leading-relaxed italic">
                      {section.evidenceSummary}
                    </p>
                  </div>

                  {section.reviewWarnings.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-amber-600 mb-2">
                        Aandachtspunten voor review
                      </p>
                      <ul className="space-y-1">
                        {section.reviewWarnings.map((warning, i) => (
                          <li
                            key={i}
                            className="flex gap-2 text-amber-700 bg-amber-50 rounded px-3 py-1.5"
                          >
                            <span className="shrink-0">⚠</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import FeedbackForm from "./components/FeedbackForm";
import SynthesisPanel from "./components/SynthesisPanel";
import type { Response } from "./lib/types";

// Map must be loaded client-side only — Leaflet needs window
const SchapenweideMap = dynamic(() => import("./components/SchapenweideMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-xl bg-stone-100 animate-pulse" style={{ height: "360px" }} />
  ),
});

const SEEDED_COUNT = 94;

export default function Home() {
  const [synthesis, setSynthesis] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveResponses, setLiveResponses] = useState<Response[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Load baseline synthesis on mount
  useEffect(() => {
    fetch("/api/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seeded_count: SEEDED_COUNT, live_responses: [] }),
    })
      .then((r) => r.text())
      .then((text) => setSynthesis(text))
      .catch(() => {});
  }, []);

  async function handleSubmit(responses: Response[]) {
    setIsStreaming(true);
    setLiveResponses(responses);
    setSynthesis("");

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seeded_count: SEEDED_COUNT,
          live_responses: responses,
        }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setSynthesis(text);
      }

      setSubmitted(true);
    } catch {
      setSynthesis("Something went wrong. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-2xl font-bold text-amber-500">YIMBY</span>
          <span className="text-stone-400 text-sm">Yes, in my backyard</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Project intro */}
        <section>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Schapenweide, Bilthoven</h1>
          <p className="text-stone-500 text-sm mb-4">De Bilt · Utrecht · 10 years without development</p>
          <p className="text-stone-700 leading-relaxed">
            This plot has been ready for housing for over a decade. Legal proceedings and hardened
            objections have kept it empty. <strong>YIMBY asks the neighbourhood first</strong> — before
            plans are finalised, before positions harden.
          </p>
          <p className="text-stone-700 leading-relaxed mt-2">
            Answer 4 design questions below. Your preferences are shared anonymously with the developer
            and municipality — giving the silent majority a voice in what gets built here.
          </p>
        </section>

        {/* Map */}
        <section>
          <SchapenweideMap />
          <p className="text-xs text-stone-400 mt-2">
            Map data © Kadaster / OpenStreetMap contributors
          </p>
        </section>

        {/* Current synthesis */}
        {synthesis && (
          <SynthesisPanel
            text={synthesis}
            isStreaming={isStreaming}
            responseCount={SEEDED_COUNT + liveResponses.length}
          />
        )}

        {/* Feedback form */}
        {!submitted ? (
          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-4">Your preferences</h2>
            <FeedbackForm onSubmit={handleSubmit} disabled={isStreaming} />
          </section>
        ) : (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-center">
            <p className="text-amber-800 font-semibold">Thanks for your input.</p>
            <p className="text-amber-700 text-sm mt-1">
              Your preferences have been added to the neighbourhood summary above.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

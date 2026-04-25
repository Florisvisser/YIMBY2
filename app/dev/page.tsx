"use client";

import { useEffect, useState } from "react";
import { DESIGN_QUESTIONS } from "../lib/questions";
import type { QuestionBreakdown } from "../lib/types";

const SEEDED_COUNT = 94;
const DEV_PASSWORD = "demo";

function computeBreakdowns(responses: Array<{ question_id: string; chosen_option: string }>): QuestionBreakdown[] {
  return DESIGN_QUESTIONS.map((q) => {
    const qResponses = responses.filter((r) => r.question_id === q.id);
    const total = qResponses.length;
    const a = qResponses.filter((r) => r.chosen_option === "A").length;
    const b = total - a;
    return {
      question_id: q.id,
      total,
      option_a_count: a,
      option_b_count: b,
      option_a_pct: total > 0 ? Math.round((a / total) * 100) : 0,
      option_b_pct: total > 0 ? Math.round((b / total) * 100) : 0,
    };
  });
}

export default function DevPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [synthesis, setSynthesis] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [breakdowns, setBreakdowns] = useState<QuestionBreakdown[]>([]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === DEV_PASSWORD) setAuthenticated(true);
  }

  useEffect(() => {
    if (!authenticated) return;

    // Load seeded responses for breakdowns
    fetch("/api/seeded-responses")
      .then((r) => r.json())
      .then((responses) => {
        setBreakdowns(computeBreakdowns(responses));
      })
      .catch(() => {});

    // Load synthesis
    setIsStreaming(true);
    fetch("/api/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seeded_count: SEEDED_COUNT, live_responses: [] }),
    })
      .then(async (res) => {
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setSynthesis(text);
        }
      })
      .catch(() => {})
      .finally(() => setIsStreaming(false));
  }, [authenticated]);

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-stone-900 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white rounded-xl p-8 w-80 shadow-xl space-y-4">
          <h1 className="text-lg font-bold text-stone-800">Developer view</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg py-2 transition-colors"
          >
            Enter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-900 text-white">
      <header className="border-b border-stone-700 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <span className="text-xl font-bold text-amber-400">YIMBY</span>
          <span className="text-stone-400 text-sm">Developer view · Schapenweide, Bilthoven</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-stone-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">127</p>
            <p className="text-stone-400 text-sm mt-1">Citizens reached</p>
          </div>
          <div className="bg-stone-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{SEEDED_COUNT}</p>
            <p className="text-stone-400 text-sm mt-1">Responded</p>
          </div>
          <div className="bg-stone-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">74%</p>
            <p className="text-stone-400 text-sm mt-1">Response rate</p>
          </div>
        </div>

        {/* Question breakdowns */}
        <section>
          <h2 className="text-lg font-semibold text-stone-200 mb-4">Design preferences</h2>
          <div className="space-y-4">
            {breakdowns.map((bd) => {
              const q = DESIGN_QUESTIONS.find((q) => q.id === bd.question_id)!;
              return (
                <div key={bd.question_id} className="bg-stone-800 rounded-xl p-5">
                  <p className="font-medium text-stone-200 mb-3">{q.question}</p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-stone-300">{q.optionA.label}</span>
                        <span className="text-amber-400 font-semibold">{bd.option_a_pct}%</span>
                      </div>
                      <div className="w-full bg-stone-700 rounded-full h-2">
                        <div
                          className="bg-amber-400 h-2 rounded-full transition-all"
                          style={{ width: `${bd.option_a_pct}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-stone-300">{q.optionB.label}</span>
                        <span className="text-stone-400 font-semibold">{bd.option_b_pct}%</span>
                      </div>
                      <div className="w-full bg-stone-700 rounded-full h-2">
                        <div
                          className="bg-stone-500 h-2 rounded-full transition-all"
                          style={{ width: `${bd.option_b_pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* AI synthesis */}
        <section>
          <h2 className="text-lg font-semibold text-stone-200 mb-4">AI synthesis</h2>
          <div className="bg-stone-800 rounded-xl p-5">
            <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">
              {synthesis}
              {isStreaming && (
                <span className="inline-block w-1 h-4 bg-amber-400 animate-pulse ml-0.5 align-middle" />
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

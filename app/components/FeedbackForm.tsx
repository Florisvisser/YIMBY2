"use client";

import { useState } from "react";
import { DESIGN_QUESTIONS } from "../lib/questions";
import type { Response } from "../lib/types";

interface Props {
  onSubmit: (responses: Response[]) => void;
  disabled: boolean;
}

export default function FeedbackForm({ onSubmit, disabled }: Props) {
  const [answers, setAnswers] = useState<Partial<Record<string, "A" | "B">>>({});
  const [comments, setComments] = useState<Partial<Record<string, string>>>({});

  const allAnswered = DESIGN_QUESTIONS.every((q) => answers[q.id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered || disabled) return;

    const responses: Response[] = DESIGN_QUESTIONS.map((q) => ({
      question_id: q.id,
      chosen_option: answers[q.id]!,
      optional_comment: comments[q.id] ?? "",
    }));

    onSubmit(responses);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {DESIGN_QUESTIONS.map((q) => (
        <div key={q.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-stone-800 mb-4">{q.question}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["A", "B"] as const).map((opt) => {
              const option = opt === "A" ? q.optionA : q.optionB;
              const selected = answers[q.id] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  className={`text-left rounded-lg border-2 p-4 transition-all ${
                    selected
                      ? "border-amber-500 bg-amber-50"
                      : "border-stone-200 hover:border-amber-300 hover:bg-amber-50/50"
                  }`}
                >
                  <span className={`block font-medium ${selected ? "text-amber-800" : "text-stone-700"}`}>
                    {option.label}
                  </span>
                  <span className="block text-sm text-stone-500 mt-1">{option.description}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3">
            <textarea
              placeholder="Optional: add a comment (max 280 characters)"
              maxLength={280}
              rows={2}
              value={comments[q.id] ?? ""}
              onChange={(e) =>
                setComments((prev) => ({ ...prev, [q.id]: e.target.value }))
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={!allAnswered || disabled}
        className={`w-full rounded-xl py-3 font-semibold text-white transition-all ${
          allAnswered && !disabled
            ? "bg-amber-500 hover:bg-amber-600 cursor-pointer"
            : "bg-stone-300 cursor-not-allowed"
        }`}
      >
        {disabled ? "Submitting…" : allAnswered ? "Submit my preferences" : "Answer all 4 questions to submit"}
      </button>
    </form>
  );
}

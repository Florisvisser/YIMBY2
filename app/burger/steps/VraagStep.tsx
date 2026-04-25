"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/data/types";

const MAX_TURNS = 5;

export default function VraagStep({
  history,
  onSend,
  sendInFlight,
  onZorg,
  onGeen,
}: {
  history: ChatMessage[];
  onSend: (q: string) => Promise<void>;
  sendInFlight: boolean;
  onZorg: () => void;
  onGeen: () => void;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const userTurns = history.filter((m) => m.role === "user").length;
  const maxReached = userTurns >= MAX_TURNS;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  async function handleSend() {
    const q = input.trim();
    if (!q || sendInFlight || maxReached) return;
    setInput("");
    await onSend(q);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{
        fontSize: 12,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        color: "var(--fg-tertiary)",
        marginBottom: 12,
      }}>
        Schapenweide · Bilthoven · 2026
      </div>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(26px, 5.5vw, 34px)",
        fontWeight: 500,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        color: "var(--ink-900)",
        margin: "0 0 8px 0",
        fontVariationSettings: "'opsz' 144, 'SOFT' 50",
      }}>
        Stel je vraag
      </h1>
      <p style={{ fontSize: 14, color: "var(--fg-secondary)", margin: "0 0 20px 0" }}>
        Stel maximaal {MAX_TURNS} vragen over het Schapenweide-plan. Daarna kun je jouw zorg doorgeven.
      </p>

      {/* Chat bubbles */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginBottom: 16,
        maxHeight: 340,
        overflowY: "auto",
        padding: "4px 0",
      }}>
        {history.length === 0 && (
          <p style={{ fontSize: 14, color: "var(--fg-muted)", fontStyle: "italic" }}>
            Typ een vraag hieronder, bijvoorbeeld: &ldquo;Wat verandert er voor mijn tuin?&rdquo;
          </p>
        )}
        {history.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
            }}
          >
            <div style={{
              padding: "10px 14px",
              borderRadius: msg.role === "user"
                ? "var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg)"
                : "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-xs)",
              background: msg.role === "user" ? "var(--moss-500)" : "var(--paper-0)",
              color: msg.role === "user" ? "var(--paper-50)" : "var(--ink-900)",
              boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
              fontSize: 14,
              lineHeight: 1.55,
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {sendInFlight && (
          <div style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
            <div style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-xs)",
              background: "var(--paper-0)",
              boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
              fontSize: 14,
              color: "var(--fg-muted)",
              fontStyle: "italic",
            }}>
              Antwoord wordt opgehaald…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {maxReached ? (
        <p style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 16, fontStyle: "italic" }}>
          Maximaal aantal vragen bereikt. Geef hieronder jouw zorg door of sluit af.
        </p>
      ) : (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Stel een vraag… (Enter om te verzenden)"
            disabled={sendInFlight}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-medium)",
              background: "var(--paper-0)",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              lineHeight: 1.4,
              color: "var(--ink-900)",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sendInFlight}
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: !input.trim() || sendInFlight ? "var(--paper-100)" : "var(--moss-500)",
              color: !input.trim() || sendInFlight ? "var(--ink-300)" : "var(--paper-50)",
              border: "none",
              cursor: !input.trim() || sendInFlight ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: 500,
              flexShrink: 0,
              alignSelf: "stretch",
              display: "flex",
              alignItems: "center",
            }}
          >
            Stuur
          </button>
        </div>
      )}

      <p style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 20 }}>
        {userTurns} / {MAX_TURNS} vragen gesteld
      </p>

      {/* Navigation */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          type="button"
          onClick={onZorg}
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
          Mijn zorg doorgeven
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
          Geen zorgen — klaar
        </button>
      </div>
    </div>
  );
}

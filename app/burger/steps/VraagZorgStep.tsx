"use client";

import { useEffect, useRef, useState } from "react";
import {
  CATEGORY_LABEL_NL,
  type ConcernCategory,
  type ChatMessage,
  type ProfileData,
} from "@/lib/data/types";
import { PrimaryBtn } from "../ui";

const MIN_TEXT = 10;
const MAX_TEXT = 1500;

const CATEGORY_OPTIONS: ConcernCategory[] = [
  "traffic_parking",
  "building_height",
  "green_nature",
  "noise_livability",
];

const CATEGORY_ICON: Record<ConcernCategory, string> = {
  traffic_parking: "🚗",
  building_height: "🏢",
  green_nature: "🌳",
  noise_livability: "🔊",
};

const SEVERITY_LABELS: Record<number, string> = {
  1: "klein ongemak",
  2: "merkbaar nadeel",
  3: "duidelijk probleem",
  4: "groot probleem",
  5: "onaanvaardbaar",
};

const CATEGORY_CONTEXT: Record<ConcernCategory, { uitleg: string; tips: string[] }> = {
  traffic_parking: {
    uitleg:
      "Het plan voorziet in ~450 woningen die de verkeersdruk op de Emmalaan en Nachtegaallaan verhogen. De gemeente werkt aan een verkeersonderzoek.",
    tips: [
      "Noem de specifieke straat of kruising die jou zorgen baart.",
      "Beschrijf hoe het nu al is en wat je verwacht dat het erger maakt.",
    ],
  },
  building_height: {
    uitleg:
      "De hoogste bebouwing gaat richting 6 bouwlagen (circa 18 meter). Dat is een breuk met de bestaande woonschaal van Bilthoven.",
    tips: [
      "Geef aan of het om bezonning, uitzicht of schaalbreuk gaat.",
      "Benoem welk gebouw of perceel voor jou de referentie is.",
    ],
  },
  green_nature: {
    uitleg:
      "Op het terrein leven beschermde dassen (Wet Natuurbescherming). Ook meerdere volwassen bomen staan op de kaplijst.",
    tips: [
      "Als je een specifieke boom of habitat kent, vermeld dat.",
      "Geef aan wat het groen voor jouw dagelijkse gebruik betekent.",
    ],
  },
  noise_livability: {
    uitleg:
      "De bouwperiode loopt naar verwachting 6–8 jaar. Bouwgeluid is toegestaan van 07:00–19:00 op werkdagen.",
    tips: [
      "Beschrijf of het om bouwgeluid, verkeerslawaai of iets anders gaat.",
      "Noem hoe je nu jouw straat of tuin beleeft.",
    ],
  },
};

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--clay-400)" : "currentColor"}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

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

export default function VraagZorgStep({
  history,
  onSend,
  sendInFlight,
  profile,
  category,
  setCategory,
  severity,
  setSeverity,
  concernText,
  setConcernText,
  submitLoading,
  submitError,
  recording,
  voiceLoading,
  voiceError,
  onVoiceToggle,
  onSubmit,
  onBack,
  onGeen,
}: {
  history: ChatMessage[];
  onSend: (q: string) => Promise<void>;
  sendInFlight: boolean;
  profile: ProfileData | null;
  category: ConcernCategory | null;
  setCategory: (c: ConcernCategory) => void;
  severity: number;
  setSeverity: (s: number) => void;
  concernText: string;
  setConcernText: (t: string) => void;
  submitLoading: boolean;
  submitError: string | null;
  recording: boolean;
  voiceLoading: boolean;
  voiceError: string | null;
  onVoiceToggle: () => Promise<void>;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  onGeen: () => void;
}) {
  const [narrow, setNarrow] = useState(false);
  const [input, setInput] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<ConcernCategory | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  async function handleSend() {
    const q = input.trim();
    if (!q || sendInFlight) return;
    setInput("");
    await onSend(q);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const addressLine = [profile?.straatnaam, profile?.huis_nlt].filter(Boolean).join(" ");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
        gap: narrow ? 32 : 40,
        alignItems: "start",
      }}
    >
      {/* Left: Chat */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px, 4vw, 28px)",
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: "var(--ink-900)",
            margin: "0 0 6px 0",
            fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          }}
        >
          Stel je vraag
        </h2>
        <p style={{ fontSize: 14, color: "var(--fg-secondary)", margin: "0 0 16px 0" }}>
          Stel je vragen over het Schapenweide-plan — zoveel als je wilt.
        </p>

        {profile && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--paper-0)",
              borderRadius: "var(--radius-full)",
              padding: "5px 12px",
              fontSize: 13,
              color: "var(--fg-secondary)",
              boxShadow: "var(--shadow-xs), var(--shadow-hairline)",
              marginBottom: 16,
              alignSelf: "flex-start",
            }}
          >
            📍 {addressLine || profile.postcode} · {profile.neighbourhood}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 16,
            maxHeight: 360,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {history.length === 0 && (
            <p style={{ fontSize: 14, color: "var(--fg-muted)", fontStyle: "italic" }}>
              Typ een vraag hieronder, bijv. &ldquo;Wat verandert er voor mijn tuin?&rdquo;
            </p>
          )}
          {history.map((msg, i) => (
            <div
              key={i}
              style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius:
                    msg.role === "user"
                      ? "var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg)"
                      : "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-xs)",
                  background: msg.role === "user" ? "var(--moss-500)" : "var(--paper-0)",
                  color: msg.role === "user" ? "var(--paper-50)" : "var(--ink-900)",
                  boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {sendInFlight && (
            <div style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-xs)",
                  background: "var(--paper-0)",
                  boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
                  fontSize: 14,
                  color: "var(--fg-muted)",
                  fontStyle: "italic",
                }}
              >
                Antwoord wordt opgehaald…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

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
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-medium)",
              background: "var(--paper-0)",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
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
              padding: "10px 14px",
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

        <button
          type="button"
          onClick={onGeen}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "var(--fg-tertiary)",
            textDecoration: "underline",
            padding: "4px 0",
            textAlign: "left",
          }}
        >
          Geen vragen — ik ga terug
        </button>
      </div>

      {/* Right: Concern form */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          borderLeft: narrow ? "none" : "1px solid var(--border-soft)",
          paddingLeft: narrow ? 0 : 40,
          borderTop: narrow ? "1px solid var(--border-soft)" : "none",
          paddingTop: narrow ? 32 : 0,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px, 4vw, 28px)",
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: "var(--ink-900)",
            margin: "0 0 6px 0",
            fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          }}
        >
          Vertel jouw zorg
        </h2>
        <p style={{ fontSize: 14, color: "var(--fg-secondary)", margin: "0 0 20px 0" }}>
          Kies een thema en beschrijf wat je bezighoudt. Jouw inbreng komt geanonimiseerd bij de gemeente.
        </p>

        {/* Category cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-secondary)", marginBottom: 4 }}>
            Over welk thema wil je je zorg uiten?
          </span>
          {CATEGORY_OPTIONS.map((opt) => {
            const sel = category === opt;
            const exp = expandedCategory === opt;
            const ctx = CATEGORY_CONTEXT[opt];
            return (
              <div key={opt}>
                <button
                  type="button"
                  onClick={() => {
                    setCategory(opt);
                    setExpandedCategory(exp ? null : opt);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: exp
                      ? "var(--radius-lg) var(--radius-lg) 0 0"
                      : "var(--radius-lg)",
                    background: sel ? "var(--moss-50)" : "var(--paper-0)",
                    border: sel ? "1.5px solid var(--moss-400)" : "1px solid var(--border-soft)",
                    borderBottom: exp
                      ? sel
                        ? "1.5px solid color-mix(in oklab, var(--moss-400) 30%, transparent)"
                        : "1px solid var(--border-soft)"
                      : undefined,
                    boxShadow: sel
                      ? `0 0 0 3px color-mix(in oklab, var(--moss-300) 30%, transparent)`
                      : "var(--shadow-xs)",
                    cursor: "pointer",
                    transition: "all var(--dur-fast) var(--ease-out)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{CATEGORY_ICON[opt]}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>
                      {CATEGORY_LABEL_NL[opt]}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {sel && (
                      <span style={{ color: "var(--moss-500)", fontSize: 14 }}>✓</span>
                    )}
                    <span style={{ color: "var(--fg-tertiary)" }}>
                      <ChevronIcon down={exp} />
                    </span>
                  </div>
                </button>
                <div
                  style={{
                    maxHeight: exp ? 300 : 0,
                    overflow: "hidden",
                    transition: "max-height 0.25s ease-out",
                  }}
                >
                  <div
                    style={{
                      background: sel ? "var(--moss-50)" : "var(--paper-0)",
                      borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
                      border: sel ? "1.5px solid var(--moss-400)" : "1px solid var(--border-soft)",
                      borderTop: "none",
                      padding: "12px 14px 16px",
                      boxShadow: sel
                        ? `0 0 0 3px color-mix(in oklab, var(--moss-300) 30%, transparent)`
                        : "var(--shadow-xs)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--fg-secondary)",
                        margin: "0 0 10px 0",
                        lineHeight: 1.55,
                      }}
                    >
                      <strong style={{ fontWeight: 600, color: "var(--ink-900)" }}>
                        Schapenweide:{" "}
                      </strong>
                      {ctx.uitleg}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--fg-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        margin: "0 0 6px 0",
                      }}
                    >
                      Tips voor je toelichting
                    </p>
                    <ul
                      style={{
                        margin: 0,
                        padding: "0 0 0 14px",
                        fontSize: 13,
                        color: "var(--fg-secondary)",
                        lineHeight: 1.55,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {ctx.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Severity */}
        <div
          style={{
            background: "var(--paper-0)",
            borderRadius: "var(--radius-lg)",
            padding: 16,
            boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
            marginBottom: 12,
          }}
        >
          <label
            htmlFor="severity-vz"
            style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--fg-secondary)", marginBottom: 4 }}
          >
            Hoe groot is het probleem voor jou?
          </label>
          <p style={{ margin: "0 0 10px 0", fontSize: 13, color: "var(--fg-muted)" }}>
            {severity} / 5 —{" "}
            <span style={{ color: "var(--fg-secondary)" }}>{SEVERITY_LABELS[severity]}</span>
          </p>
          <input
            id="severity-vz"
            type="range"
            min={1}
            max={5}
            step={1}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--moss-500)" }}
          />
        </div>

        {/* Concern text */}
        <div
          style={{
            background: "var(--paper-0)",
            borderRadius: "var(--radius-lg)",
            padding: 16,
            boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
            marginBottom: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <label
            htmlFor="concernText-vz"
            style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-secondary)" }}
          >
            Beschrijf je zorg
          </label>
          <textarea
            id="concernText-vz"
            value={concernText}
            onChange={(e) => setConcernText(e.target.value.slice(0, MAX_TEXT))}
            rows={5}
            placeholder="Tijdens de spits is de Emmalaan al overbelast…"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-medium)",
              background: "var(--paper-50)",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--ink-900)",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
            {concernText.length}/{MAX_TEXT} tekens
            {concernText.length < MIN_TEXT && (
              <span style={{ color: "var(--rose-300)" }}> · minimaal {MIN_TEXT} tekens</span>
            )}
          </p>
        </div>

        {/* Voice */}
        <button
          type="button"
          onClick={onVoiceToggle}
          disabled={voiceLoading}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: recording ? "var(--clay-50)" : "var(--paper-0)",
            border: recording ? "1.5px solid var(--clay-300)" : "1px solid var(--border-soft)",
            color: recording
              ? "var(--clay-500)"
              : voiceLoading
              ? "var(--fg-tertiary)"
              : "var(--fg-secondary)",
            cursor: voiceLoading ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "var(--font-sans)",
            marginBottom: voiceError ? 8 : 16,
            transition: "all var(--dur-fast) var(--ease-out)",
          }}
        >
          <MicIcon active={recording} />
          {voiceLoading ? "Transcriptie…" : recording ? "Stop opnemen" : "Inspreken in plaats van typen"}
        </button>

        {voiceError && (
          <p style={{ fontSize: 12, color: "var(--rose-500)", margin: "0 0 12px 0" }}>
            {voiceError}
          </p>
        )}

        {submitError && (
          <div
            style={{
              background: "var(--rose-50)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--rose-500)",
              marginBottom: 12,
            }}
          >
            {submitError}
          </div>
        )}

        <PrimaryBtn
          onClick={onSubmit}
          disabled={submitLoading || !category || concernText.length < MIN_TEXT}
        >
          {submitLoading ? "Versturen…" : "Verstuur mijn zorg"}
        </PrimaryBtn>

        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "var(--fg-tertiary)",
            textDecoration: "underline",
            padding: "12px 0 0 0",
          }}
        >
          ← Terug naar plan-uitleg
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  CATEGORY_LABEL_NL,
  type ConcernCategory,
  type ProfileData,
  type PlanUitlegReport,
  type ChatMessage,
  type VraagResponse,
} from "@/lib/data/types";
import { ArrowIcon, PrimaryBtn, Eyebrow } from "./ui";
import ProfileStep from "./steps/ProfileStep";
import OutOfAreaStep from "./steps/OutOfAreaStep";
import PlanUitlegStep from "./steps/PlanUitlegStep";
import VraagStep from "./steps/VraagStep";

type Step =
  | "profile"
  | "out_of_area"
  | "plan_uitleg"
  | "vraag"
  | "concern"
  | "done";

type AddressInfo = {
  postcode: string;
  neighbourhood: string;
  streetReference?: string;
};

const CATEGORY_OPTIONS: ConcernCategory[] = [
  "traffic_parking",
  "building_height",
  "green_nature",
  "noise_livability",
];

const SEVERITY_LABELS: Record<number, string> = {
  1: "klein ongemak",
  2: "merkbaar nadeel",
  3: "duidelijk probleem",
  4: "groot probleem",
  5: "onaanvaardbaar",
};

const NEAR_POSTCODES = new Set(["3721", "3722", "3723"]);
function isNear(postcode: string): boolean {
  return NEAR_POSTCODES.has(postcode.replace(/\s/g, "").slice(0, 4));
}

const STEP_INDEX: Partial<Record<Step, number>> = {
  profile: 1,
  plan_uitleg: 2,
  vraag: 3,
  concern: 4,
  done: 5,
};
const TOTAL_STEPS = 5;

const MIN_TEXT = 10;
const MAX_TEXT = 1500;

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--clay-400)" : "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function BurgerForm() {
  const [step, setStep] = useState<Step>("profile");

  // Profile
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Plan uitleg
  const [planUitleg, setPlanUitleg] = useState<PlanUitlegReport | null>(null);
  const [planUitlegLoading, setPlanUitlegLoading] = useState(false);
  const planUitlegInFlight = useRef(false);

  // Q&A
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatSendInFlight, setChatSendInFlight] = useState(false);
  const chatInFlight = useRef(false);

  // Concern
  const [category, setCategory] = useState<ConcernCategory | null>(null);
  const [severity, setSeverity] = useState<number>(3);
  const [concernText, setConcernText] = useState("");
  const [recording, setRecording] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitInFlight = useRef(false);

  async function handleProfileComplete(data: ProfileData) {
    setProfile(data);
    setChatHistory([]);
    setCategory(null);
    setConcernText("");

    if (!isNear(data.postcode)) {
      setStep("out_of_area");
      return;
    }

    if (planUitlegInFlight.current) return;
    planUitlegInFlight.current = true;
    setPlanUitlegLoading(true);
    try {
      const res = await fetch("/api/plan-uitleg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voornaam: data.voornaam,
          straatnaam: data.straatnaam,
          postcode: data.postcode,
          neighbourhood: data.neighbourhood,
        }),
      });
      const uitlegData = (await res.json()) as PlanUitlegReport;
      setPlanUitleg(uitlegData);
    } catch {
      // Fallback: inline empty report that triggers fallback rendering
      setPlanUitleg(null);
    } finally {
      setPlanUitlegLoading(false);
      planUitlegInFlight.current = false;
      setStep("plan_uitleg");
    }
  }

  async function handleSendVraag(question: string) {
    if (!profile || chatInFlight.current) return;
    chatInFlight.current = true;
    setChatSendInFlight(true);
    try {
      const res = await fetch("/api/vraag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: chatHistory,
          voornaam: profile.voornaam,
          straatnaam: profile.straatnaam,
          postcode: profile.postcode,
        }),
      });
      const data = (await res.json()) as VraagResponse;
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: data.answer },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: question },
        {
          role: "assistant",
          content:
            "Dat weet ik helaas niet zeker. Kijk op schapenweidebilthoven.nl of bel 030 – 220 28 00.",
        },
      ]);
    } finally {
      setChatSendInFlight(false);
      chatInFlight.current = false;
    }
  }

  async function handleSubmit() {
    if (submitInFlight.current || !profile || !category) return;
    if (concernText.length < MIN_TEXT) return;
    submitInFlight.current = true;
    setSubmitError(null);
    setSubmitLoading(true);

    const streetReference =
      [profile.straatnaam, profile.huis_nlt].filter(Boolean).join(" ") ||
      undefined;

    try {
      const res = await fetch("/api/concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: profile.postcode,
          neighbourhood: profile.neighbourhood,
          streetReference,
          category,
          severity,
          concernText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(
          typeof data?.error === "string"
            ? data.error
            : "Zienswijze kon niet worden opgeslagen.",
        );
        return;
      }
      try {
        const key = "samenspraak.submissions.v1";
        const raw = window.localStorage.getItem(key);
        const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
        if (typeof data?.id === "string" && !ids.includes(data.id)) {
          ids.push(data.id);
          window.localStorage.setItem(key, JSON.stringify(ids));
        }
      } catch {
        // localStorage kan falen (private mode, full quota) — niet kritiek.
      }
      setStep("done");
    } catch {
      setSubmitError("Verbinding mislukt. Probeer opnieuw.");
    } finally {
      setSubmitLoading(false);
      submitInFlight.current = false;
    }
  }

  function getAddress(): AddressInfo | null {
    if (!profile) return null;
    return {
      postcode: profile.postcode,
      neighbourhood: profile.neighbourhood,
      streetReference:
        [profile.straatnaam, profile.huis_nlt].filter(Boolean).join(" ") ||
        undefined,
    };
  }

  /* ── Done ──────────────────────────────────────────────────────────────── */
  if (step === "done") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--moss-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--moss-500)",
        }}>
          <CheckIcon />
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(28px, 6vw, 36px)",
          fontWeight: 500,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "var(--ink-900)",
          margin: 0,
          fontVariationSettings: "'opsz' 144, 'SOFT' 50",
        }}>
          {profile?.voornaam
            ? `Bedankt, ${profile.voornaam} — jouw zorg is binnen.`
            : "Bedankt — jouw zorg is binnen."}
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--fg-secondary)", margin: 0 }}>
          De gemeente De Bilt verwerkt jouw bericht samen met dat van je buren tot één concept-verslag.
        </p>

        <div style={{
          background: "var(--paper-0)",
          borderRadius: "var(--radius-lg)",
          padding: 20,
          boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fg-tertiary)", marginBottom: 12 }}>
            Wat er nu gebeurt
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14, fontSize: 14, lineHeight: 1.5, color: "var(--fg-secondary)" }}>
            {[
              "Jouw zorg wordt geclusterd met vergelijkbare zorgen uit jouw buurt.",
              "Een ambtenaar schrijft een onderbouwd antwoord — wat is gedaan, en zo niet, waarom niet.",
              "Je krijgt bericht zodra het verslag is vastgesteld — uiterlijk 8 weken.",
            ].map((text, i) => (
              <li key={i} style={{ display: "flex", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--moss-500)", fontWeight: 600, minWidth: 18 }}>{i + 1}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <Link
          href="/burger/mijn-zorgen"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "16px 22px",
            borderRadius: "var(--radius-md)",
            background: "var(--moss-500)",
            color: "var(--paper-50)",
            fontFamily: "var(--font-sans)",
            fontSize: 16,
            fontWeight: 500,
            textDecoration: "none",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          Bekijk mijn zorgen
          <ArrowIcon />
        </Link>
      </div>
    );
  }

  /* ── Out of area (no progress bar) ─────────────────────────────────────── */
  if (step === "out_of_area") {
    return (
      <OutOfAreaStep
        voornaam={profile?.voornaam ?? ""}
        onBack={() => setStep("profile")}
      />
    );
  }

  /* ── Plan uitleg loading ────────────────────────────────────────────────── */
  if (step === "plan_uitleg" && planUitlegLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 40 }}>
        <div style={{ height: 3, background: "var(--paper-100)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: 24 }}>
          <div style={{ height: "100%", width: "40%", background: "var(--moss-500)", borderRadius: "var(--radius-full)", transition: "width var(--dur-slow) var(--ease-out)" }} />
        </div>
        <Eyebrow>Schapenweide · Bilthoven · 2026</Eyebrow>
        <p style={{ fontSize: 16, color: "var(--fg-secondary)" }}>
          Plan-uitleg voor jouw adres wordt opgehaald…
        </p>
      </div>
    );
  }

  const stepIndex = STEP_INDEX[step] ?? 1;
  const progressPct = (stepIndex / TOTAL_STEPS) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: "var(--paper-100)", borderRadius: "var(--radius-full)", marginBottom: 40, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${progressPct}%`,
          background: "var(--moss-500)",
          borderRadius: "var(--radius-full)",
          transition: `width var(--dur-slow) var(--ease-out)`,
        }} />
      </div>

      {/* Step: profile */}
      {step === "profile" && (
        <ProfileStep onComplete={handleProfileComplete} />
      )}

      {/* Step: plan uitleg */}
      {step === "plan_uitleg" && planUitleg && (
        <PlanUitlegStep
          planUitleg={planUitleg}
          voornaam={profile?.voornaam ?? ""}
          onVraag={() => setStep("vraag")}
          onZorg={() => setStep("concern")}
          onGeen={() => setStep("done")}
        />
      )}

      {/* Step: vraag */}
      {step === "vraag" && (
        <VraagStep
          history={chatHistory}
          onSend={handleSendVraag}
          sendInFlight={chatSendInFlight}
          onZorg={() => setStep("concern")}
          onGeen={() => setStep("done")}
        />
      )}

      {/* Step: concern */}
      {step === "concern" && (() => {
        const address = getAddress();
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <Eyebrow>Stap 4 van 5</Eyebrow>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 6vw, 36px)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--ink-900)",
              margin: "0 0 12px 0",
              fontVariationSettings: "'opsz' 144, 'SOFT' 50",
            }}>
              Vertel jouw zorg
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--fg-secondary)", margin: "0 0 28px 0" }}>
              Kies een thema en beschrijf wat je bezighoudt. Jouw inbreng komt geanonimiseerd bij de gemeente.
            </p>

            {/* Address recap */}
            {address && (
              <div style={{
                background: "var(--paper-0)",
                borderRadius: "var(--radius-lg)",
                padding: 16,
                boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fg-tertiary)", marginBottom: 6 }}>
                  Adres
                </div>
                {address.streetReference && (
                  <p style={{ margin: "0 0 2px 0", fontSize: 14, fontWeight: 500, color: "var(--ink-900)" }}>
                    {address.streetReference}
                  </p>
                )}
                <p style={{ margin: 0, fontSize: 13, color: "var(--fg-secondary)" }}>
                  {address.postcode} · {address.neighbourhood}
                </p>
                <button
                  type="button"
                  onClick={() => setStep("profile")}
                  style={{ marginTop: 8, fontSize: 12, color: "var(--fg-tertiary)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "var(--font-sans)", padding: 0 }}
                >
                  Adres wijzigen
                </button>
              </div>
            )}

            {/* Category */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-secondary)" }}>Welk thema raakt jou het meest?</span>
              {CATEGORY_OPTIONS.map((opt) => {
                const sel = category === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCategory(opt)}
                    style={{
                      textAlign: "left",
                      padding: "16px 18px",
                      borderRadius: "var(--radius-lg)",
                      background: sel ? "var(--moss-50)" : "var(--paper-0)",
                      border: sel ? "1.5px solid var(--moss-400)" : "1px solid var(--border-soft)",
                      boxShadow: sel ? `0 0 0 3px color-mix(in oklab, var(--moss-300) 30%, transparent)` : "var(--shadow-xs)",
                      cursor: "pointer",
                      transition: `all var(--dur-fast) var(--ease-out)`,
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-900)" }}>{CATEGORY_LABEL_NL[opt]}</span>
                  </button>
                );
              })}
            </div>

            {/* Severity */}
            <div style={{ background: "var(--paper-0)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--shadow-sm), var(--shadow-hairline)", marginBottom: 16 }}>
              <label htmlFor="severity" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--fg-secondary)", marginBottom: 4 }}>
                Hoe groot is het probleem voor jou?
              </label>
              <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "var(--fg-muted)" }}>
                {severity} / 5 — <span style={{ color: "var(--fg-secondary)" }}>{SEVERITY_LABELS[severity]}</span>
              </p>
              <input
                id="severity"
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
            <div style={{ background: "var(--paper-0)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--shadow-sm), var(--shadow-hairline)", marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <label htmlFor="concernText" style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-secondary)" }}>
                Beschrijf je zorg
              </label>
              <textarea
                id="concernText"
                value={concernText}
                onChange={(e) => setConcernText(e.target.value.slice(0, MAX_TEXT))}
                rows={5}
                placeholder="Tijdens de spits is de Emmalaan al overbelast…"
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-medium)",
                  background: "var(--paper-50)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 15,
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
              onClick={() => setRecording(!recording)}
              style={{
                width: "100%",
                padding: "14px 18px",
                borderRadius: "var(--radius-md)",
                background: recording ? "var(--clay-50)" : "var(--paper-0)",
                border: recording ? "1.5px solid var(--clay-300)" : "1px solid var(--border-soft)",
                color: recording ? "var(--clay-500)" : "var(--fg-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
                marginBottom: 28,
                transition: `all var(--dur-fast) var(--ease-out)`,
              }}
            >
              <MicIcon active={recording} />
              {recording ? "Aan het opnemen… (Reson8)" : "Inspreken in plaats van typen"}
            </button>

            {submitError && (
              <div style={{ background: "var(--rose-50)", borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 13, color: "var(--rose-500)", marginBottom: 16 }}>
                {submitError}
              </div>
            )}

            <PrimaryBtn
              onClick={handleSubmit}
              disabled={submitLoading || !category || concernText.length < MIN_TEXT}
            >
              {submitLoading ? "Versturen…" : "Verstuur mijn zorg"}
            </PrimaryBtn>

            <button
              type="button"
              onClick={() => setStep("plan_uitleg")}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--fg-tertiary)", textDecoration: "underline", padding: "12px 0 0 0" }}
            >
              ← Terug naar plan-uitleg
            </button>
          </div>
        );
      })()}
    </div>
  );
}

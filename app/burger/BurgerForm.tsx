"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  CATEGORY_LABEL_NL,
  type ConcernCategory,
} from "@/lib/data/types";

type Step = "address" | "concern" | "done";

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

const MIN_TEXT = 10;
const MAX_TEXT = 1500;

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  );
}

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

function PrimaryBtn({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "16px 22px",
        borderRadius: "var(--radius-md)",
        background: disabled ? "var(--paper-100)" : "var(--moss-500)",
        color: disabled ? "var(--ink-300)" : "var(--paper-50)",
        border: "none",
        fontFamily: "var(--font-sans)",
        fontSize: 16,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: `all var(--dur-fast) var(--ease-out)`,
      }}
    >
      {children}
      {!disabled && <ArrowIcon />}
    </button>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.18em",
      color: "var(--fg-tertiary)",
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function DisplayH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      fontFamily: "var(--font-display)",
      fontSize: "clamp(32px, 7vw, 40px)",
      fontWeight: 500,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
      color: "var(--ink-900)",
      margin: "0 0 18px 0",
      textWrap: "balance",
      fontVariationSettings: "'opsz' 144, 'SOFT' 50",
    }}>
      {children}
    </h1>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 17,
      lineHeight: 1.6,
      color: "var(--fg-secondary)",
      margin: "0 0 32px 0",
    }}>
      {children}
    </p>
  );
}

function InputField({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--fg-secondary)", marginBottom: 8 }}>
        {label}
      </span>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "14px 16px",
          fontSize: 16,
          fontFamily: "var(--font-sans)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-medium)",
          background: "var(--paper-0)",
          color: "var(--ink-900)",
          outline: "none",
          boxSizing: "border-box",
          transition: `border-color var(--dur-fast) var(--ease-out)`,
        }}
        required
      />
    </label>
  );
}

export default function BurgerForm() {
  const [step, setStep] = useState<Step>("address");

  const [postcodeInput, setPostcodeInput] = useState("");
  const [huisnummerInput, setHuisnummerInput] = useState("");
  const [address, setAddress] = useState<AddressInfo | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [category, setCategory] = useState<ConcernCategory | null>(null);
  const [severity, setSeverity] = useState<number>(3);
  const [concernText, setConcernText] = useState("");
  const [recording, setRecording] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const lookupInFlight = useRef(false);
  const submitInFlight = useRef(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (lookupInFlight.current) return;
    lookupInFlight.current = true;
    setAddressError(null);
    setAddressLoading(true);
    try {
      const params = new URLSearchParams({
        postcode: postcodeInput.trim(),
        huisnummer: huisnummerInput.trim(),
      });
      const res = await fetch(`/api/pdok?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setAddressError(typeof data?.error === "string" ? data.error : "Adres kon niet gevonden worden.");
        setAddress(null);
        return;
      }
      setAddress(data as AddressInfo);
      setStep("concern");
    } catch {
      setAddressError("Verbinding met PDOK mislukt. Probeer opnieuw.");
    } finally {
      setAddressLoading(false);
      lookupInFlight.current = false;
    }
  }

  async function handleSubmit() {
    if (submitInFlight.current) return;
    if (!address || !category) return;
    if (concernText.length < MIN_TEXT) return;
    submitInFlight.current = true;

    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: address.postcode,
          neighbourhood: address.neighbourhood,
          streetReference: address.streetReference,
          category,
          severity,
          concernText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(typeof data?.error === "string" ? data.error : "Zienswijze kon niet worden opgeslagen.");
        return;
      }
      setStep("done");
    } catch {
      setSubmitError("Verbinding mislukt. Probeer opnieuw.");
    } finally {
      setSubmitLoading(false);
      submitInFlight.current = false;
    }
  }

  const stepIndex = step === "address" ? 1 : step === "concern" ? 2 : 3;
  const totalSteps = 3;

  /* ── Confirmation screen ──────────────────────────────────────────────── */
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
        <DisplayH1>Bedankt — jouw zorg is binnen.</DisplayH1>
        <Lead>De gemeente De Bilt verwerkt jouw bericht samen met dat van je buren tot één concept-verslag.</Lead>

        <div style={{
          background: "var(--paper-0)",
          borderRadius: "var(--radius-lg)",
          padding: 20,
          boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
          marginBottom: 12,
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
          href="/gemeente"
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
          Bekijk het dashboard
          <ArrowIcon />
        </Link>
      </div>
    );
  }

  /* ── Progress bar ─────────────────────────────────────────────────────── */
  const progressPct = (stepIndex / totalSteps) * 100;

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

      {/* Step 1 — Address */}
      {step === "address" && (
        <form onSubmit={handleLookup} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <Eyebrow>Schapenweide · Bilthoven · 2026</Eyebrow>
          <DisplayH1>Wat speelt er in jouw buurt?</DisplayH1>
          <Lead>Vul je postcode in. Wij zoeken het ontwikkelplan dat jou raakt en vertalen het in begrijpelijke taal.</Lead>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
            <InputField
              label="Postcode"
              id="postcode"
              value={postcodeInput}
              onChange={setPostcodeInput}
              placeholder="3722 HD"
            />
            <InputField
              label="Huisnummer"
              id="huisnummer"
              value={huisnummerInput}
              onChange={setHuisnummerInput}
              placeholder="12"
              inputMode="numeric"
            />
          </div>

          <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "0 0 28px 0" }}>
            Wordt alleen gebruikt om jouw buurt te vinden.
          </p>

          {addressError && (
            <div style={{
              background: "var(--rose-50)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--rose-500)",
              marginBottom: 8,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              <span>{addressError}</span>
              <button
                type="button"
                onClick={() => {
                  if (!postcodeInput.trim() || !huisnummerInput.trim()) return;
                  setAddress({
                    postcode: postcodeInput.trim().toUpperCase(),
                    neighbourhood: "Bilthoven",
                    streetReference: `nr ${huisnummerInput.trim()}`,
                  });
                  setAddressError(null);
                  setStep("concern");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--rose-500)",
                  textDecoration: "underline",
                  padding: 0,
                  textAlign: "left",
                }}
              >
                Toch doorgaan zonder PDOK-verificatie
              </button>
            </div>
          )}

          <PrimaryBtn type="submit" disabled={addressLoading}>
            {addressLoading ? "Adres opzoeken…" : "Vind mijn buurt"}
          </PrimaryBtn>
        </form>
      )}

      {/* Step 2 — Concern */}
      {step === "concern" && address && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <Eyebrow>Stap 2 van 3</Eyebrow>
          <DisplayH1>Vertel jouw zorg</DisplayH1>
          <Lead>Kies een thema en beschrijf wat je bezighoudt. Jouw inbreng komt geanonimiseerd bij de gemeente.</Lead>

          {/* Address recap */}
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
              onClick={() => { setStep("address"); setAddress(null); }}
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--fg-tertiary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "var(--font-sans)",
                padding: 0,
              }}
            >
              Adres wijzigen
            </button>
          </div>

          {/* Category pick */}
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
          <div style={{
            background: "var(--paper-0)",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
            marginBottom: 16,
          }}>
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
          <div style={{
            background: "var(--paper-0)",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
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

          {/* Voice button */}
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
            <div style={{
              background: "var(--rose-50)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--rose-500)",
              marginBottom: 16,
            }}>
              {submitError}
            </div>
          )}

          <PrimaryBtn
            onClick={handleSubmit}
            disabled={submitLoading || !category || concernText.length < MIN_TEXT}
          >
            {submitLoading ? "Versturen…" : "Verstuur mijn zorg"}
          </PrimaryBtn>
        </div>
      )}
    </div>
  );
}

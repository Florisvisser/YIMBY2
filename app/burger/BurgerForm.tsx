"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  type ConcernCategory,
  type ProfileData,
  type PlanUitlegReport,
  type ChatMessage,
  type VraagResponse,
} from "@/lib/data/types";
import { ArrowIcon, Eyebrow } from "./ui";
import ProfileStep from "./steps/ProfileStep";
import OutOfAreaStep from "./steps/OutOfAreaStep";
import PlanUitlegStep from "./steps/PlanUitlegStep";
import VraagZorgStep from "./steps/VraagZorgStep";

type Step =
  | "profile"
  | "out_of_area"
  | "plan_uitleg"
  | "vraag_zorg"
  | "done";

const NEAR_POSTCODES = new Set(["3721", "3722", "3723"]);
function isNear(postcode: string): boolean {
  return NEAR_POSTCODES.has(postcode.replace(/\s/g, "").slice(0, 4));
}

const STEP_INDEX: Partial<Record<Step, number>> = {
  profile: 1,
  plan_uitleg: 2,
  vraag_zorg: 3,
  done: 4,
};
const TOTAL_STEPS = 4;

const MIN_TEXT = 10;
const MAX_TEXT = 1500;

function CheckIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlanUitlegLoader() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        paddingTop: 40,
      }}
    >
      <div
        style={{
          height: 3,
          background: "var(--paper-100)",
          borderRadius: "var(--radius-full)",
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            height: "100%",
            width: "50%",
            background: "var(--moss-500)",
            borderRadius: "var(--radius-full)",
            transition: "width var(--dur-slow) var(--ease-out)",
          }}
        />
      </div>
      <Eyebrow>Schapenweide · Bilthoven · 2026</Eyebrow>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {phase >= 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 15,
              color: "var(--ink-900)",
            }}
          >
            <span
              style={{
                color: "var(--moss-500)",
                fontWeight: 600,
                width: 16,
                display: "inline-block",
                textAlign: "center",
              }}
            >
              ✓
            </span>
            Adres herkend
          </div>
        )}
        {phase >= 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 15,
              color: phase >= 3 ? "var(--ink-900)" : "var(--fg-secondary)",
            }}
          >
            <span
              style={{
                color: "var(--moss-500)",
                fontWeight: 600,
                width: 16,
                display: "inline-block",
                textAlign: "center",
              }}
            >
              ✓
            </span>
            Plangebied bepaald
          </div>
        )}
        {phase >= 2 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 15,
              color: "var(--fg-secondary)",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                border: "2px solid var(--paper-100)",
                borderTopColor: "var(--moss-500)",
                borderRadius: "50%",
                flexShrink: 0,
                animation: "spin 0.8s linear infinite",
              }}
            />
            Jouw impact berekend…
          </div>
        )}
      </div>

      {phase >= 2 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 8,
          }}
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                height: 72,
                borderRadius: "var(--radius-lg)",
                background: "var(--paper-100)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(90deg, transparent 0%, var(--paper-0) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.4s infinite",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
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
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitInFlight = useRef(false);

  async function handleVoiceToggle() {
    if (voiceLoading) return;
    setVoiceError(null);

    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = (err as DOMException | null)?.name ?? "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setVoiceError(
          "Microfoon-toegang geweigerd. Klik op het slot-icoon naast de URL en sta microfoon toe.",
        );
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setVoiceError("Geen microfoon gevonden. Sluit een microfoon aan en probeer opnieuw.");
      } else {
        setVoiceError("Microfoon niet toegankelijk. Controleer je browserinstellingen.");
      }
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      chunksRef.current = [];
      setRecording(false);
      setVoiceLoading(true);
      try {
        const res = await fetch("/api/reson8", {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: blob,
        });
        const data = (await res.json()) as { transcript?: string; error?: string };
        if (!res.ok || !data.transcript) {
          setVoiceError(
            data.error ?? "Transcriptie mislukt. Probeer opnieuw of typ je zorg."
          );
        } else {
          setConcernText((prev) => {
            const joined = prev.trim()
              ? `${prev.trim()} ${data.transcript!}`
              : data.transcript!;
            return joined.slice(0, MAX_TEXT);
          });
        }
      } catch {
        setVoiceError(
          "Transcriptie niet beschikbaar. Probeer opnieuw of typ je zorg."
        );
      } finally {
        setVoiceLoading(false);
      }
    };

    recorder.start();
    setRecording(true);
  }

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
    setStep("plan_uitleg");
    try {
      const res = await fetch("/api/plan-uitleg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voornaam: data.voornaam,
          straatnaam: data.straatnaam,
          postcode: data.postcode,
          neighbourhood: data.neighbourhood,
          language: data.language,
        }),
      });
      if (!res.ok) throw new Error(`plan-uitleg ${res.status}`);
      const uitlegData = (await res.json()) as PlanUitlegReport;
      setPlanUitleg(uitlegData);
    } catch {
      setPlanUitleg({
        source: "fallback",
        generatedAt: new Date().toISOString(),
        intro: `Hallo ${data.voornaam || "bewoner"}, hier is wat het Schapenweide-plan voor jouw buurt betekent. Er komen 450 nieuwe woningen in Bilthoven.`,
        sections: [
          {
            category: "traffic_parking",
            headline: "Meer verkeer verwacht",
            bodyText:
              "De gemeente onderzoekt hoe de verkeersafwikkeling veilig blijft met 450 extra woningen.",
            impactLevel: "hoog",
          },
          {
            category: "building_height",
            headline: "Gebouwen tot zes verdiepingen",
            bodyText:
              "Hogere gebouwen kunnen meer schaduw geven op naastgelegen woningen en tuinen.",
            impactLevel: "gemiddeld",
          },
          {
            category: "green_nature",
            headline: "Dassenburcht beschermd",
            bodyText:
              "Wettelijk beschermde dassen op het terrein worden meegenomen in de planvorming.",
            impactLevel: "gemiddeld",
          },
          {
            category: "noise_livability",
            headline: "Bouwgeluid meerdere jaren",
            bodyText:
              "De gemeente stelt bouwtijden en een meldpunt klachten in voor de bouwperiode.",
            impactLevel: "laag",
          },
        ],
      });
    } finally {
      setPlanUitlegLoading(false);
      planUitlegInFlight.current = false;
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
          language: profile.language,
        }),
      });
      const data = (await res.json()) as VraagResponse;
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: data.answer },
      ]);
    } catch {
      const fallbackText =
        profile.language === "en"
          ? "I'm not sure about that. Visit schapenweidebilthoven.nl or call 030 – 220 28 00."
          : profile.language === "es"
            ? "No estoy seguro/a. Visita schapenweidebilthoven.nl o llama al 030 – 220 28 00."
            : "Dat weet ik helaas niet zeker. Kijk op schapenweidebilthoven.nl of bel 030 – 220 28 00.";
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: fallbackText },
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
      [profile.straatnaam, profile.huis_nlt].filter(Boolean).join(" ") || undefined;

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
            : "Zienswijze kon niet worden opgeslagen."
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

  /* ── Done ──────────────────────────────────────────────────────────────── */
  if (step === "done") {
    return (
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--moss-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--moss-500)",
          }}
        >
          <CheckIcon />
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 6vw, 36px)",
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--ink-900)",
            margin: 0,
            fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          }}
        >
          {profile?.voornaam
            ? `Bedankt, ${profile.voornaam} — jouw zorg is binnen.`
            : "Bedankt — jouw zorg is binnen."}
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: "var(--fg-secondary)",
            margin: 0,
          }}
        >
          De gemeente De Bilt verwerkt jouw bericht samen met dat van je buren tot één
          concept-verslag.
        </p>

        <div
          style={{
            background: "var(--paper-0)",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--fg-tertiary)",
              marginBottom: 12,
            }}
          >
            Wat er nu gebeurt
          </div>
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--fg-secondary)",
            }}
          >
            {[
              "Jouw zorg wordt geclusterd met vergelijkbare zorgen uit jouw buurt.",
              "Een ambtenaar schrijft een onderbouwd antwoord — wat is gedaan, en zo niet, waarom niet.",
              "Je krijgt bericht zodra het verslag is vastgesteld — uiterlijk 8 weken.",
            ].map((text, i) => (
              <li key={i} style={{ display: "flex", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--moss-500)",
                    fontWeight: 600,
                    minWidth: 18,
                  }}
                >
                  {i + 1}
                </span>
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

  /* ── Out of area ────────────────────────────────────────────────────────── */
  if (step === "out_of_area") {
    return (
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>
        <OutOfAreaStep
          voornaam={profile?.voornaam ?? ""}
          onBack={() => setStep("profile")}
        />
      </div>
    );
  }

  /* ── Plan uitleg loading ────────────────────────────────────────────────── */
  if (step === "plan_uitleg" && planUitlegLoading) {
    return <PlanUitlegLoader />;
  }

  const isWide = step === "plan_uitleg" || step === "vraag_zorg";
  const stepIndex = STEP_INDEX[step] ?? 1;
  const progressPct = (stepIndex / TOTAL_STEPS) * 100;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: isWide ? 960 : 480,
        margin: "0 auto",
        transition: "max-width var(--dur-slow) var(--ease-out)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Progress bar */}
        <div
          style={{
            height: 3,
            background: "var(--paper-100)",
            borderRadius: "var(--radius-full)",
            marginBottom: 40,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "var(--moss-500)",
              borderRadius: "var(--radius-full)",
              transition: `width var(--dur-slow) var(--ease-out)`,
            }}
          />
        </div>

        {/* Step: profile */}
        {step === "profile" && (
          <ProfileStep
            onComplete={handleProfileComplete}
            initial={profile ?? undefined}
          />
        )}

        {/* Step: plan uitleg */}
        {step === "plan_uitleg" && planUitleg && (
          <PlanUitlegStep
            planUitleg={planUitleg}
            voornaam={profile?.voornaam ?? ""}
            userLat={profile?.lat}
            userLon={profile?.lon}
            onVraag={() => setStep("vraag_zorg")}
            onZorg={() => setStep("vraag_zorg")}
            onGeen={() => setStep("done")}
          />
        )}

        {/* Step: vraag + zorg (combined) */}
        {step === "vraag_zorg" && (
          <VraagZorgStep
            history={chatHistory}
            onSend={handleSendVraag}
            sendInFlight={chatSendInFlight}
            profile={profile}
            category={category}
            setCategory={setCategory}
            severity={severity}
            setSeverity={setSeverity}
            concernText={concernText}
            setConcernText={setConcernText}
            submitLoading={submitLoading}
            submitError={submitError}
            recording={recording}
            voiceLoading={voiceLoading}
            voiceError={voiceError}
            onVoiceToggle={handleVoiceToggle}
            onSubmit={handleSubmit}
            onBack={() => setStep("plan_uitleg")}
            onGeen={() => setStep("done")}
          />
        )}
      </div>
    </div>
  );
}

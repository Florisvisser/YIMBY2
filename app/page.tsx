import Link from "next/link";

function SamenspraakMark() {
  return (
    <svg width="40" height="26" viewBox="0 0 56 32" aria-hidden="true">
      <circle cx="20" cy="16" r="13" fill="#406A2C" />
      <circle cx="36" cy="16" r="13" fill="none" stroke="#1A1612" strokeWidth="2" />
      <path d="M12 24 L9 30 L17 26 Z" fill="#406A2C" />
    </svg>
  );
}

type StepAccent = "clay" | "moss" | "ink";

const STEP_TONES: Record<StepAccent, { bg: string; ring: string; fg: string; numFg: string }> = {
  clay: {
    bg: "var(--clay-100, #F5E1D0)",
    ring: "var(--clay-500, #C97D4A)",
    fg: "var(--clay-700, #7A3F1A)",
    numFg: "var(--clay-700, #7A3F1A)",
  },
  moss: {
    bg: "var(--moss-50, #E8F0DF)",
    ring: "var(--moss-500, #406A2C)",
    fg: "var(--moss-700, #1F3F12)",
    numFg: "var(--moss-700, #1F3F12)",
  },
  ink: {
    bg: "var(--paper-0, #FFFFFF)",
    ring: "var(--ink-900, #1A1612)",
    fg: "var(--ink-700, #2A2520)",
    numFg: "var(--ink-900, #1A1612)",
  },
};

function FlowStep({
  n,
  accent,
  title,
}: {
  n: number;
  accent: StepAccent;
  title: string;
}) {
  const tone = STEP_TONES[accent];
  return (
    <li
      style={{
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        flex: "1 1 120px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: tone.bg,
          boxShadow: `inset 0 0 0 1.5px ${tone.ring}`,
          color: tone.numFg,
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n}
      </div>
      <span
        style={{
          fontSize: 13,
          lineHeight: 1.45,
          color: tone.fg,
          textAlign: "center",
          fontWeight: 500,
          textWrap: "balance",
        }}
      >
        {title}
      </span>
    </li>
  );
}

function FlowConnector() {
  return (
    <li
      aria-hidden="true"
      style={{
        listStyle: "none",
        flex: "0 0 16px",
        alignSelf: "center",
        marginTop: -16,
        color: "var(--fg-tertiary)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
      }}
    >
      →
    </li>
  );
}

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--paper-50)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {/* Mark */}
        <div style={{ marginBottom: 32 }}>
          <SamenspraakMark />
        </div>

        {/* Eyebrow */}
        <p style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: "var(--fg-tertiary)",
          marginBottom: 16,
        }}>
          Schapenweide · Bilthoven · 2026
        </p>

        {/* Display title */}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(48px, 8vw, 72px)",
          fontWeight: 400,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: "var(--ink-900)",
          margin: "0 0 20px 0",
          textWrap: "balance",
          fontVariationSettings: "'SOFT' 50, 'opsz' 144, 'WONK' 0",
        }}>
          Samenspraak
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: 17,
          lineHeight: 1.6,
          color: "var(--fg-secondary)",
          margin: "0 0 36px 0",
          maxWidth: 440,
          textWrap: "balance",
        }}>
          Burgerparticipatie als bewijsbare feedback-loop, niet als juridisch vinkje.
        </p>

        {/* Drie-staps verhaal */}
        <ol
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 4,
            padding: 0,
            margin: "0 0 48px 0",
            width: "100%",
            maxWidth: 480,
          }}
        >
          <FlowStep n={1} accent="clay" title="Bewoner meldt zienswijze" />
          <FlowConnector />
          <FlowStep n={2} accent="moss" title="AI analyseert en motiveert" />
          <FlowConnector />
          <FlowStep n={3} accent="ink" title="Gemeente ondertekent antwoord" />
        </ol>

        {/* CTAs */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
          <Link
            href="/gemeente"
            style={{
              display: "block",
              padding: "16px 24px",
              borderRadius: "var(--radius-md)",
              background: "var(--moss-500)",
              color: "var(--paper-50)",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              fontWeight: 500,
              textDecoration: "none",
              textAlign: "center",
              boxShadow: "var(--shadow-sm)",
              transition: `background var(--dur-fast) var(--ease-out)`,
            }}
          >
            Voor de gemeente
          </Link>
          <Link
            href="/burger"
            style={{
              display: "block",
              padding: "16px 24px",
              borderRadius: "var(--radius-md)",
              background: "var(--paper-0)",
              color: "var(--ink-900)",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              fontWeight: 500,
              textDecoration: "none",
              textAlign: "center",
              boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
              transition: `box-shadow var(--dur-fast) var(--ease-out)`,
            }}
          >
            Voor bewoners
          </Link>
        </nav>
      </div>

      {/* Footer */}
      <footer style={{
        position: "absolute",
        bottom: 24,
        fontSize: 12,
        color: "var(--fg-muted)",
        textAlign: "center",
      }}>
        Concept-demo. Geen persoonsgegevens worden opgeslagen.
      </footer>
    </main>
  );
}

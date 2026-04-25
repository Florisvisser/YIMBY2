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
          margin: "0 0 48px 0",
          maxWidth: 440,
          textWrap: "balance",
        }}>
          Burgerparticipatie als bewijsbare feedback-loop, niet als juridisch vinkje.
        </p>

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

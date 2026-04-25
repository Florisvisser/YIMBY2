import Link from "next/link";
import MijnZorgenList from "./MijnZorgenList";

export const revalidate = 0;

function SamenspraakMark() {
  return (
    <svg width="28" height="18" viewBox="0 0 56 32" aria-hidden="true">
      <circle cx="20" cy="16" r="13" fill="#406A2C" />
      <circle cx="36" cy="16" r="13" fill="none" stroke="#1A1612" strokeWidth="2" />
      <path d="M12 24 L9 30 L17 26 Z" fill="#406A2C" />
    </svg>
  );
}

export default function MijnZorgenPage() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_ANON_KEY,
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--paper-50)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans)",
      }}
    >
      <header
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <SamenspraakMark />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 500,
              color: "var(--ink-900)",
              fontVariationSettings: "'opsz' 144, 'SOFT' 50",
              letterSpacing: "-0.01em",
            }}
          >
            Samenspraak
          </span>
        </Link>
        <Link
          href="/burger"
          style={{
            fontSize: 13,
            color: "var(--fg-tertiary)",
            textDecoration: "none",
          }}
        >
          Nieuwe zienswijze indienen
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "var(--fg-tertiary)",
            marginBottom: 10,
          }}
        >
          Schapenweide · Bilthoven
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 5vw, 44px)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink-900)",
            fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          }}
        >
          Mijn zorgen
        </h1>
        <p
          style={{
            margin: "10px 0 32px 0",
            fontSize: 15,
            color: "var(--fg-secondary)",
            lineHeight: 1.55,
          }}
        >
          De zienswijzen die jij hebt ingediend en hun status bij de gemeente.
        </p>

        <MijnZorgenList supabaseConfigured={supabaseConfigured} />
      </main>

      <footer
        style={{
          padding: "20px 24px",
          textAlign: "center",
          fontSize: 12,
          color: "var(--fg-muted)",
          borderTop: "1px solid var(--border-soft)",
        }}
      >
        Concept-demo · Geen persoonsgegevens worden opgeslagen.
      </footer>
    </div>
  );
}

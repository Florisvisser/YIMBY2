import Link from "next/link";
import BurgerForm from "./BurgerForm";

function SamenspraakMark() {
  return (
    <svg width="28" height="18" viewBox="0 0 56 32" aria-hidden="true">
      <circle cx="20" cy="16" r="13" fill="#406A2C" />
      <circle cx="36" cy="16" r="13" fill="none" stroke="#1A1612" strokeWidth="2" />
      <path d="M12 24 L9 30 L17 26 Z" fill="#406A2C" />
    </svg>
  );
}

export default function BurgerPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper-50)", display: "flex", flexDirection: "column", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <header style={{
        paddingTop: 20, paddingBottom: 20, paddingLeft: 24, paddingRight: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border-soft)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <SamenspraakMark />
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 500,
            color: "var(--ink-900)",
            fontVariationSettings: "'opsz' 144, 'SOFT' 50",
            letterSpacing: "-0.01em",
          }}>
            Samenspraak
          </span>
        </Link>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--fg-muted)",
          letterSpacing: "0.06em",
        }}>
          NL · TR · AR · PL · EN
        </span>
      </header>

      {/* Content */}
      <main style={{ flex: 1, display: "flex", justifyContent: "center", paddingTop: 48, paddingBottom: 48, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ width: "100%" }}>
          <BurgerForm />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        paddingTop: 20, paddingBottom: 20, paddingLeft: 24, paddingRight: 24,
        textAlign: "center",
        fontSize: 12,
        color: "var(--fg-muted)",
        borderTop: "1px solid var(--border-soft)",
      }}>
        Concept-demo · Geen persoonsgegevens worden opgeslagen.
      </footer>
    </div>
  );
}

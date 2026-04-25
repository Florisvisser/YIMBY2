import { getConcerns, getCategoryStats } from "@/lib/data/concerns";
import GemeenteWorkspace from "./GemeenteWorkspace";

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


export default async function GemeentePage() {
  const concerns = await getConcerns();
  const stats = getCategoryStats(concerns);

  const totalCount = concerns.length;
  const dates = concerns.map((c) => c.submittedAt).sort();
  const firstDate = new Date(dates[0]).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const lastDate = new Date(dates[dates.length - 1]).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper-50)", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <header style={{
        background: "var(--paper-50)",
        borderBottom: "1px solid var(--border-soft)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SamenspraakMark />
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 500,
            color: "var(--ink-900)",
            fontVariationSettings: "'opsz' 144, 'SOFT' 50",
            letterSpacing: "-0.01em",
          }}>
            Samenspraak
          </span>
          <span style={{ width: 1, height: 18, background: "var(--border-medium)", margin: "0 4px" }} />
          <span style={{ fontSize: 13, color: "var(--fg-tertiary)" }}>Gemeente De Bilt</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "var(--fg-tertiary)" }}>ambtenaar RO</span>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--clay-100)",
            color: "var(--clay-500)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
          }}>
            RO
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 80px" }}>
        {/* Page heading */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "var(--fg-tertiary)",
            marginBottom: 10,
          }}>
            Gemeente De Bilt · Schapenweide
          </p>
          <h1 style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4vw, 44px)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink-900)",
            fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          }}>
            Participatieverslag
          </h1>
          <p style={{ margin: "10px 0 0 0", fontSize: 15, color: "var(--fg-tertiary)" }}>
            {totalCount} ingediende zienswijzen · {firstDate} – {lastDate}
          </p>
        </div>

        <GemeenteWorkspace concerns={concerns} stats={stats} />
      </main>
    </div>
  );
}

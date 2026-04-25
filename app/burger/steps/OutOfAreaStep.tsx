"use client";

import { DisplayH1, Lead } from "../ui";

export default function OutOfAreaStep({
  voornaam,
  onBack,
}: {
  voornaam: string;
  onBack: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{
        fontSize: 40,
        marginBottom: 20,
        lineHeight: 1,
      }}>
        📍
      </div>
      <DisplayH1>
        {voornaam ? `Hallo ${voornaam} — g` : "G"}een actieve plannen in jouw buurt
      </DisplayH1>
      <Lead>
        Op dit moment zijn er geen vastgestelde ruimtelijke plannen die jouw adres
        direct raken. Het Schapenweide-project betreft het postcodegebied 3721–3723 in Bilthoven.
      </Lead>

      <div style={{
        background: "var(--paper-0)",
        borderRadius: "var(--radius-lg)",
        padding: 20,
        boxShadow: "var(--shadow-sm), var(--shadow-hairline)",
        marginBottom: 28,
        fontSize: 14,
        lineHeight: 1.6,
        color: "var(--fg-secondary)",
      }}>
        Wil je toch een reactie geven op een plan in jouw regio? Kijk dan op{" "}
        <a
          href="https://www.officielebekendmakingen.nl"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--moss-600)", textDecoration: "underline" }}
        >
          officielebekendmakingen.nl
        </a>{" "}
        voor lopende inspraakprocedures bij jou in de buurt.
      </div>

      <button
        type="button"
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--fg-tertiary)",
          textDecoration: "underline",
          padding: 0,
          textAlign: "left",
        }}
      >
        ← Ander adres invoeren
      </button>
    </div>
  );
}

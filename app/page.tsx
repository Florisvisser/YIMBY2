"use client";

import Link from "next/link";
import { useState } from "react";

function SamenspraakMark() {
  return (
    <svg width="40" height="26" viewBox="0 0 56 32" aria-hidden="true">
      <circle cx="20" cy="16" r="13" fill="#406A2C" />
      <circle cx="36" cy="16" r="13" fill="none" stroke="#1A1612" strokeWidth="2" />
      <path d="M12 24 L9 30 L17 26 Z" fill="#406A2C" />
    </svg>
  );
}

type CardAccent = "clay" | "moss";

type AccentTone = {
  bgRest: string;
  bgHover: string;
  ring: string;
  eyebrow: string;
  title: string;
  bullet: string;
  arrow: string;
};

const ACCENT_TONES: Record<CardAccent, AccentTone> = {
  clay: {
    bgRest: "var(--paper-0)",
    bgHover: "var(--clay-50, #FBEFE2)",
    ring: "var(--clay-500, #C97D4A)",
    eyebrow: "var(--clay-700, #7A3F1A)",
    title: "var(--ink-900)",
    bullet: "var(--clay-500, #C97D4A)",
    arrow: "var(--clay-700, #7A3F1A)",
  },
  moss: {
    bgRest: "var(--paper-0)",
    bgHover: "var(--moss-50, #E8F0DF)",
    ring: "var(--moss-500, #406A2C)",
    eyebrow: "var(--moss-700, #1F3F12)",
    title: "var(--ink-900)",
    bullet: "var(--moss-500, #406A2C)",
    arrow: "var(--moss-700, #1F3F12)",
  },
};

function AudienceCard({
  href,
  accent,
  eyebrow,
  title,
  bullets,
}: {
  href: string;
  accent: CardAccent;
  eyebrow: string;
  title: string;
  bullets: string[];
}) {
  const [hover, setHover] = useState(false);
  const tone = ACCENT_TONES[accent];

  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "28px 26px",
        borderRadius: "var(--radius-lg)",
        background: hover ? tone.bgHover : tone.bgRest,
        boxShadow: hover ? "var(--shadow-md)" : "var(--shadow-sm), var(--shadow-hairline)",
        textDecoration: "none",
        color: "inherit",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition:
          "transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
        outline: "none",
        textAlign: "left",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: tone.eyebrow,
          fontFamily: "var(--font-mono)",
        }}
      >
        {eyebrow}
      </span>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(20px, 2.6vw, 24px)",
          fontWeight: 500,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          color: tone.title,
          margin: 0,
          fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          textWrap: "balance",
        }}
      >
        {title}
      </h2>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          fontSize: 14,
          lineHeight: 1.5,
          color: "var(--fg-secondary)",
        }}
      >
        {bullets.map((b, i) => (
          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: tone.bullet,
                flexShrink: 0,
                marginTop: 7,
              }}
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <span
        style={{
          marginTop: "auto",
          fontSize: 13,
          fontWeight: 500,
          color: tone.arrow,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-sans)",
        }}
      >
        Open dit deel
        <span
          aria-hidden="true"
          style={{
            transform: hover ? "translateX(3px)" : "translateX(0)",
            transition: "transform var(--dur-fast) var(--ease-out)",
            fontFamily: "var(--font-mono)",
          }}
        >
          →
        </span>
      </span>
    </Link>
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
        padding: "64px 24px 96px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <SamenspraakMark />
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(48px, 8vw, 72px)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--ink-900)",
            margin: "0 0 18px 0",
            textWrap: "balance",
            textAlign: "center",
            fontVariationSettings: "'SOFT' 50, 'opsz' 144, 'WONK' 0",
          }}
        >
          Samenspraak
        </h1>

        <p
          style={{
            fontSize: 19,
            lineHeight: 1.45,
            color: "var(--ink-700, #2A2520)",
            margin: "0 0 18px 0",
            maxWidth: 560,
            textWrap: "balance",
            textAlign: "center",
            fontWeight: 400,
          }}
        >
          Burgerparticipatie die voor jou werkt — én bewijsbaar landt bij de gemeente.
        </p>

        <p
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--fg-secondary)",
            margin: "0 0 44px 0",
            maxWidth: 560,
            textWrap: "balance",
            textAlign: "center",
          }}
        >
          Schrijf in begrijpelijke taal wat je dwarszit aan een bouwplan in jouw buurt.
          Samenspraak clustert vergelijkbare zorgen, helpt de gemeente er goed op te reageren,
          en geeft jou een ondertekend antwoord terug — geen formulier dat verdwijnt in een lade.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            width: "100%",
            alignItems: "stretch",
          }}
        >
          <AudienceCard
            href="/burger"
            accent="clay"
            eyebrow="Ik ben bewoner"
            title="Schrijf één keer. Krijg een onderbouwd antwoord terug."
            bullets={[
              "Plan in B1-Nederlands uitgelegd voor jouw adres",
              "Stel zoveel vragen als je wilt — AI legt het uit",
              "Volg jouw zorg tot het ondertekende verslag",
            ]}
          />
          <AudienceCard
            href="/gemeente"
            accent="moss"
            eyebrow="Ik ben van de gemeente"
            title="Cluster honderden zorgen. Onderteken één verslag."
            bullets={[
              "50+ zorgen automatisch in 4 thema's",
              "Verslag-concept binnen 30 sec, klaar voor controle",
              "Eén klik publiceren — alle indieners krijgen automatisch antwoord",
            ]}
          />
        </div>
      </div>

      <footer
        style={{
          marginTop: 64,
          fontSize: 12,
          color: "var(--fg-muted)",
          textAlign: "center",
        }}
      >
        Concept-demo. Geen persoonsgegevens worden opgeslagen.
      </footer>
    </main>
  );
}

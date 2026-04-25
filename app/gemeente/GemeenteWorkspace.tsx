"use client";

import type { CategoryStats, Concern } from "@/lib/data/types";
import MotiveringPanel from "./MotiveringPanel";
import RecenteInzendingen from "./RecenteInzendingen";
import ThemaCards from "./ThemaCards";
import { useThemaAntwoorden } from "./useThemaAntwoorden";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        color: "var(--fg-tertiary)",
        margin: "0 0 16px 0",
      }}
    >
      {children}
    </h2>
  );
}

export default function GemeenteWorkspace({
  concerns,
  stats,
}: {
  concerns: Concern[];
  stats: CategoryStats[];
}) {
  const { antwoorden, updateThema } = useThemaAntwoorden();
  const dbConcerns = concerns.filter((c) => c.source === "db");

  return (
    <>
      <section style={{ marginBottom: 48 }}>
        <SectionHeading>Overzicht per thema</SectionHeading>
        <ThemaCards
          stats={stats}
          concerns={concerns}
          antwoorden={antwoorden}
          onUpdate={updateThema}
        />
      </section>

      <section style={{ marginBottom: 48 }}>
        <SectionHeading>Recente burger-inzendingen</SectionHeading>
        <RecenteInzendingen concerns={dbConcerns} />
      </section>

      <section>
        <SectionHeading>Concept-verslag</SectionHeading>
        <MotiveringPanel
          concerns={concerns}
          stats={stats}
          antwoorden={antwoorden}
        />
      </section>
    </>
  );
}

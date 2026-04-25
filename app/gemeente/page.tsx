import { getConcerns, getCategoryStats } from "@/lib/data/concerns";
import MotiveringPanel from "./MotiveringPanel";

export const revalidate = 0;

export default async function GemeentePage() {
  const concerns = await getConcerns();
  const stats = getCategoryStats(concerns);

  const totalCount = concerns.length;
  const dates = concerns.map((c) => c.submittedAt).sort();
  const firstDate = new Date(dates[0]).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const lastDate = new Date(dates[dates.length - 1]).toLocaleDateString(
    "nl-NL",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <main className="min-h-screen bg-neutral-50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-neutral-400">
            Gemeente De Bilt · Schapenweide
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Participatieverslag
          </h1>
          <p className="text-neutral-500 text-sm">
            {totalCount} ingediende zienswijzen · {firstDate} – {lastDate}
          </p>
        </header>

        <section>
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-4">
            Overzicht per thema
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.category}
                className="bg-white border border-neutral-200 rounded-lg p-6 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-medium text-neutral-900 leading-tight">
                    {stat.label}
                  </h3>
                  <span className="shrink-0 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full px-2.5 py-1">
                    {stat.count} zienswijzen
                  </span>
                </div>

                <p className="text-sm text-neutral-500">
                  Gemiddelde ernst:{" "}
                  <span className="font-medium text-neutral-800">
                    {stat.severityAverage.toFixed(1)} / 5
                  </span>
                </p>

                {stat.representative && (
                  <blockquote className="border-l-2 border-neutral-200 pl-3 text-sm text-neutral-500 italic leading-relaxed">
                    &ldquo;{stat.representative.concernText}&rdquo;
                  </blockquote>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="pt-4">
          <MotiveringPanel />
        </section>
      </div>
    </main>
  );
}

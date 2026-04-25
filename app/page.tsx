import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 text-center">
      <header className="max-w-2xl space-y-4">
        <p className="text-sm uppercase tracking-widest text-neutral-500">
          Schapenweide · Bilthoven
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Samenspraak
        </h1>
        <p className="text-lg text-neutral-600">
          Burgerparticipatie als bewijsbare feedback-loop, niet als juridisch
          vinkje.
        </p>
      </header>

      <nav className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/gemeente"
          className="rounded-lg bg-neutral-900 text-white px-6 py-3 font-medium hover:bg-neutral-700 transition"
        >
          Voor de gemeente
        </Link>
        <button
          disabled
          className="rounded-lg border border-neutral-300 text-neutral-400 px-6 py-3 font-medium cursor-not-allowed"
          title="Binnenkort beschikbaar"
        >
          Voor bewoners — binnenkort
        </button>
      </nav>

      <p className="text-xs text-neutral-400 max-w-md">
        Concept-demo. Geen persoonsgegevens worden opgeslagen.
      </p>
    </main>
  );
}

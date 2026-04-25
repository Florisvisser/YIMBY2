import BurgerForm from "./BurgerForm";

export default function BurgerPage() {
  return (
    <main className="min-h-screen bg-neutral-50 py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-neutral-400">
            Schapenweide · Bilthoven
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Geef je zienswijze
          </h1>
          <p className="text-neutral-600 text-sm leading-relaxed">
            Vul je adres in, kies een thema en beschrijf je zorg over het plan
            Schapenweide. De gemeente krijgt jouw inbreng als onderdeel van het
            participatieverslag.
          </p>
        </header>

        <BurgerForm />
      </div>
    </main>
  );
}

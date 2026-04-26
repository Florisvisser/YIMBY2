export const runtime = "nodejs";
export const maxDuration = 30;

const RESON8_URL = "https://api.reson8.dev/v1/speech-to-text/prerecorded";
const TIMEOUT_MS = 25_000;

export async function POST(request: Request) {
  const apiKey = process.env.REASON8_API_KEY;
  if (!apiKey) {
    console.warn("[reson8] REASON8_API_KEY env var ontbreekt op deze deploy.");
    return Response.json({ error: "Spraakherkenning niet geconfigureerd." }, { status: 503 });
  }

  let buffer: ArrayBuffer;
  try {
    const blob = await request.blob();
    if (blob.size === 0) {
      return Response.json({ error: "Geen audio ontvangen." }, { status: 400 });
    }
    buffer = await blob.arrayBuffer();
  } catch (err) {
    console.warn("[reson8] kon request body niet lezen:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Audio kon niet worden gelezen." }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(RESON8_URL, {
      method: "POST",
      headers: {
        Authorization: `ApiKey ${apiKey}`,
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
      signal: controller.signal,
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      console.warn(`[reson8] upstream ${res.status} ${res.statusText}: ${bodyText.slice(0, 500)}`);
      return Response.json(
        { error: `Transcriptie mislukt (${res.status}). Probeer opnieuw.` },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { text?: string };
    const transcript = data.text?.trim() ?? "";

    if (!transcript) {
      return Response.json(
        { error: "Geen tekst herkend. Spreek duidelijk en probeer opnieuw." },
        { status: 422 },
      );
    }

    return Response.json({ transcript });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const stack = err instanceof Error ? err.stack?.split("\n").slice(0, 3).join(" | ") : "";
    console.warn(`[reson8] fetch faalde — ${message}${stack ? ` :: ${stack}` : ""}`);
    return Response.json(
      {
        error: isAbort
          ? "Spraakherkenning duurde te lang. Probeer een kortere opname."
          : "Spraakherkenning niet beschikbaar. Typ je zorg.",
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timer);
  }
}

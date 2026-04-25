export const runtime = "nodejs";
export const maxDuration = 30;

const RESON8_URL = "https://api.reson8.dev/v1/speech-to-text/prerecorded";
const TIMEOUT_MS = 25_000;

export async function POST(request: Request) {
  const apiKey = process.env.REASON8_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Spraakherkenning niet geconfigureerd." }, { status: 503 });
  }

  const blob = await request.blob();
  if (blob.size === 0) {
    return Response.json({ error: "Geen audio ontvangen." }, { status: 400 });
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
      body: blob,
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn("[reson8] API error:", res.status);
      return Response.json({ error: "Transcriptie mislukt. Probeer opnieuw." }, { status: 502 });
    }

    const data = (await res.json()) as { text?: string };
    const transcript = data.text?.trim() ?? "";

    if (!transcript) {
      return Response.json({ error: "Geen tekst herkend. Spreek duidelijk en probeer opnieuw." }, { status: 422 });
    }

    return Response.json({ transcript });
  } catch (err) {
    console.warn("[reson8] call faalde:", err);
    return Response.json({ error: "Spraakherkenning niet beschikbaar. Typ je zorg." }, { status: 503 });
  } finally {
    clearTimeout(timer);
  }
}

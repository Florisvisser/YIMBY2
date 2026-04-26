export const runtime = "nodejs";
export const maxDuration = 30;

const RESON8_URL = "https://api.reson8.dev/v1/speech-to-text/prerecorded";
const TIMEOUT_MS = 25_000;

type ErrLike = { name?: string; message?: string; code?: string; cause?: unknown; stack?: string };

function describeError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const e = err as Error & ErrLike;
  const parts: string[] = [`${e.name}: ${e.message}`];
  if (e.code) parts.push(`code=${e.code}`);
  if (e.cause) {
    const c = e.cause as ErrLike;
    if (c && typeof c === "object") {
      parts.push(
        `cause=${c.name ?? "?"}:${c.message ?? "?"}${c.code ? ` (${c.code})` : ""}`,
      );
    } else {
      parts.push(`cause=${String(c)}`);
    }
  }
  return parts.join(" | ");
}

async function callReson8(body: Blob, apiKey: string, signal: AbortSignal): Promise<Response> {
  return fetch(RESON8_URL, {
    method: "POST",
    headers: {
      Authorization: `ApiKey ${apiKey}`,
      "Content-Type": "application/octet-stream",
      "User-Agent": "samenspraak/1.0 (vercel-serverless)",
      Accept: "application/json",
    },
    body,
    signal,
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.REASON8_API_KEY;
  if (!apiKey) {
    console.warn("[reson8] REASON8_API_KEY env var ontbreekt op deze deploy.");
    return Response.json({ error: "Spraakherkenning niet geconfigureerd." }, { status: 503 });
  }

  let body: Blob;
  try {
    body = await request.blob();
    if (body.size === 0) {
      return Response.json({ error: "Geen audio ontvangen." }, { status: 400 });
    }
  } catch (err) {
    console.warn(`[reson8] kon request body niet lezen: ${describeError(err)}`);
    return Response.json({ error: "Audio kon niet worden gelezen." }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response | null = null;
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      res = await callReson8(body, apiKey, controller.signal);
      break;
    } catch (err) {
      lastErr = err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      console.warn(`[reson8] attempt ${attempt}/2 faalde — ${describeError(err)}`);
      if (isAbort) break;
      // korte wait + retry voor undici fetch-failed
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  clearTimeout(timer);

  if (!res) {
    const isAbort = lastErr instanceof Error && lastErr.name === "AbortError";
    return Response.json(
      {
        error: isAbort
          ? "Spraakherkenning duurde te lang. Probeer een kortere opname."
          : "Spraakherkenning niet beschikbaar. Typ je zorg.",
      },
      { status: 503 },
    );
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    console.warn(
      `[reson8] upstream ${res.status} ${res.statusText}: ${bodyText.slice(0, 500)}`,
    );
    return Response.json(
      { error: `Transcriptie mislukt (${res.status}). Probeer opnieuw.` },
      { status: 502 },
    );
  }

  try {
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
    console.warn(`[reson8] response parsen mislukt: ${describeError(err)}`);
    return Response.json(
      { error: "Antwoord van transcriptie kon niet worden gelezen." },
      { status: 502 },
    );
  }
}

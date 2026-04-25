import { describe, it, expect, vi } from "vitest";

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: vi.fn() };
  },
}));

import { POST } from "../vraag/route";

const VALID_BODY = {
  question: "Hoeveel woningen komen er?",
  history: [],
  voornaam: "Jan",
  straatnaam: "Emmalaan",
  postcode: "3722 XL",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/vraag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const EXPECTED_FALLBACK_ANSWER =
  "Dat weet ik helaas niet zeker. Kijk voor meer informatie op schapenweidebilthoven.nl of bel de gemeente via 030 – 220 28 00.";

describe("POST /api/vraag — forceFallback", () => {
  it("returns 200 with fallback answer and source=fallback", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, forceFallback: true }));
    expect(res.status).toBe(200);
    const data = await res.json() as { answer: string; source: string };
    expect(data.source).toBe("fallback");
    expect(data.answer).toBe(EXPECTED_FALLBACK_ANSWER);
  });
});

describe("POST /api/vraag — validation", () => {
  it("returns 400 when question is missing", async () => {
    const res = await POST(makeRequest({ history: [], voornaam: "Jan", straatnaam: "Emmalaan", postcode: "3722 XL" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when voornaam is missing", async () => {
    const res = await POST(makeRequest({ question: "Test?", history: [], straatnaam: "Emmalaan", postcode: "3722 XL" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/vraag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad json",
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/vraag — no API key fallback", () => {
  it("falls back gracefully when ANTHROPIC_API_KEY is absent", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(200);
      const data = await res.json() as { source: string; answer: string };
      expect(data.source).toBe("fallback");
      expect(data.answer).toBe(EXPECTED_FALLBACK_ANSWER);
    } finally {
      if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
    }
  });
});

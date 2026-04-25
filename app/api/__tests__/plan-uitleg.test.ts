import { describe, it, expect, vi } from "vitest";

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: vi.fn() };
  },
}));

import { POST } from "../plan-uitleg/route";

const VALID_BODY = { voornaam: "Jan", straatnaam: "Emmalaan", postcode: "3722 XL" };

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/plan-uitleg", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/plan-uitleg — forceFallback", () => {
  it("returns 200 with fallback shape", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, forceFallback: true }));
    expect(res.status).toBe(200);
    const data = await res.json() as Record<string, unknown>;
    expect(data.source).toBe("fallback");
    expect(typeof data.intro).toBe("string");
    expect((data.intro as string).length).toBeGreaterThan(0);
    expect(Array.isArray(data.sections)).toBe(true);
    expect((data.sections as unknown[]).length).toBe(4);
  });

  it("substitutes voornaam token in intro", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, voornaam: "Maria", forceFallback: true }));
    const data = await res.json() as { intro: string };
    expect(data.intro).not.toContain("{voornaam}");
  });

  it("substitutes straatnaam token in intro", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, straatnaam: "Berkenlaan", forceFallback: true }));
    const data = await res.json() as { intro: string };
    expect(data.intro).not.toContain("{straatnaam}");
  });
});

describe("POST /api/plan-uitleg — validation", () => {
  it("returns 400 when voornaam is missing", async () => {
    const res = await POST(makeRequest({ straatnaam: "Emmalaan", postcode: "3722 XL" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when postcode is missing", async () => {
    const res = await POST(makeRequest({ voornaam: "Jan", straatnaam: "Emmalaan" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/plan-uitleg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json at all",
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/plan-uitleg — no API key fallback", () => {
  it("falls back gracefully when ANTHROPIC_API_KEY is absent", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(200);
      const data = await res.json() as { source: string };
      expect(data.source).toBe("fallback");
    } finally {
      if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
    }
  });
});

import { describe, it, expect, vi } from "vitest";

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: vi.fn() };
  },
}));

import { POST } from "../concerns/suggest/route";

const VALID_CONCERN = {
  concernText: "Er is al veel verkeer op de Emmalaan.",
  severity: 3,
  personaType: "underrepresented_resident",
  neighbourhood: "Bilthoven",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/concerns/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/concerns/suggest — fallback (no API key)", () => {
  it("returns traffic_parking fallback when API key absent", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const res = await POST(
        makeRequest({ category: "traffic_parking", concerns: [VALID_CONCERN] }),
      );
      expect(res.status).toBe(200);
      const data = await res.json() as { responseAdvice: string; planAdjustment: string };
      expect(typeof data.responseAdvice).toBe("string");
      expect(data.responseAdvice.length).toBeGreaterThan(0);
      expect(typeof data.planAdjustment).toBe("string");
      expect(data.planAdjustment.length).toBeGreaterThan(0);
    } finally {
      if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
    }
  });

  it("returns correct fallback per category", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const categories = ["traffic_parking", "building_height", "green_nature", "noise_livability"] as const;
      for (const category of categories) {
        const res = await POST(makeRequest({ category, concerns: [VALID_CONCERN] }));
        expect(res.status).toBe(200);
        const data = await res.json() as { responseAdvice: string };
        expect(data.responseAdvice.length).toBeGreaterThan(0);
      }
    } finally {
      if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
    }
  });
});

describe("POST /api/concerns/suggest — validation", () => {
  it("returns 400 for unknown category", async () => {
    const res = await POST(
      makeRequest({ category: "unknown_category", concerns: [VALID_CONCERN] }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when concerns array is empty", async () => {
    const res = await POST(
      makeRequest({ category: "traffic_parking", concerns: [] }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/concerns/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );
    expect(res.status).toBe(400);
  });
});

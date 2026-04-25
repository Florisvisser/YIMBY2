import { describe, it, expect, vi } from "vitest";

import { GET } from "../pdok-lookup/route";

function makeRequest(id: string) {
  return new Request(`http://localhost/api/pdok-lookup?id=${encodeURIComponent(id)}`);
}

describe("GET /api/pdok-lookup — id validation", () => {
  it("returns 400 for missing id", async () => {
    const res = await GET(new Request("http://localhost/api/pdok-lookup"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed id", async () => {
    const res = await GET(makeRequest("not-an-id"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for id with wrong prefix", async () => {
    const res = await GET(makeRequest("wpl-15cf2474f4a73310b7bda0c8f4cdfd64"));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/pdok-lookup — external call with mock fetch", () => {
  const VALID_ID = "adr-15cf2474f4a73310b7bda0c8f4cdfd64";

  it("returns 502 when PDOK returns non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );
    try {
      const res = await GET(makeRequest(VALID_ID));
      expect(res.status).toBe(502);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("returns 503 when PDOK throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("signal timed out", "TimeoutError")),
    );
    try {
      const res = await GET(makeRequest(VALID_ID));
      expect(res.status).toBe(503);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("returns 404 when PDOK returns no docs or missing core fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: { docs: [] } }),
      }),
    );
    try {
      const res = await GET(makeRequest(VALID_ID));
      expect(res.status).toBe(404);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("maps PDOK lookup doc to full SuggestResult with coords + normalized postcode", async () => {
    const mockDoc = {
      weergavenaam: "Emmalaan 12, Bilthoven",
      postcode: "3722XL",
      straatnaam: "Emmalaan",
      huis_nlt: "12",
      buurtnaam: "Bilthoven-centrum",
      wijknaam: "Bilthoven",
      woonplaatsnaam: "Bilthoven",
      centroide_ll: "POINT(5.18901234 52.12598765)",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: { docs: [mockDoc] } }),
      }),
    );
    try {
      const res = await GET(makeRequest(VALID_ID));
      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        id: string;
        label: string;
        postcode: string;
        straatnaam: string;
        huis_nlt: string;
        neighbourhood: string;
        lat: number;
        lon: number;
      };
      expect(data.id).toBe(VALID_ID);
      expect(data.postcode).toBe("3722 XL");
      expect(data.straatnaam).toBe("Emmalaan");
      expect(data.huis_nlt).toBe("12");
      expect(data.neighbourhood).toBe("Bilthoven-centrum");
      expect(data.lat).toBeCloseTo(52.126, 3);
      expect(data.lon).toBeCloseTo(5.189, 3);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

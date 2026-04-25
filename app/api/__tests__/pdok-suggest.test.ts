import { describe, it, expect, vi } from "vitest";

import { GET } from "../pdok-suggest/route";

function makeRequest(q: string) {
  return new Request(`http://localhost/api/pdok-suggest?q=${encodeURIComponent(q)}`);
}

describe("GET /api/pdok-suggest — short query guard", () => {
  it("returns [] for q with 0 chars", async () => {
    const res = await GET(makeRequest(""));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("returns [] for q with 1 char", async () => {
    const res = await GET(makeRequest("a"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns [] for q with 3 chars (boundary — min is 4)", async () => {
    const res = await GET(makeRequest("Emm"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("does not throw for missing q param", async () => {
    const res = await GET(new Request("http://localhost/api/pdok-suggest"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});

describe("GET /api/pdok-suggest — external call with mock fetch", () => {
  it("returns [] when PDOK returns non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );
    try {
      const res = await GET(makeRequest("Emmalaan 12"));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("returns [] when PDOK times out or throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("signal timed out", "TimeoutError")),
    );
    try {
      const res = await GET(makeRequest("Emmalaan 12"));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("maps PDOK docs to SuggestResult shape", async () => {
    const mockDoc = {
      weergavenaam: "Emmalaan 12, 3722 XL Bilthoven",
      postcode: "3722XL",
      straatnaam: "Emmalaan",
      huis_nlt: "12",
      buurtnaam: "Bilthoven-centrum",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: { docs: [mockDoc] } }),
      }),
    );
    try {
      const res = await GET(makeRequest("Emmalaan 12"));
      expect(res.status).toBe(200);
      const data = await res.json() as Array<{
        label: string;
        postcode: string;
        straatnaam: string;
        huis_nlt: string;
        neighbourhood: string;
      }>;
      expect(data).toHaveLength(1);
      expect(data[0].straatnaam).toBe("Emmalaan");
      expect(data[0].postcode).toBe("3722 XL");
      expect(data[0].neighbourhood).toBe("Bilthoven-centrum");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

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

  it("returns [] for q with 1 char (boundary — min is 2)", async () => {
    const res = await GET(makeRequest("a"));
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
      const res = await GET(makeRequest("Bilth"));
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
      const res = await GET(makeRequest("Bilth"));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("maps PDOK suggest docs to {id, label} SuggestResult shape", async () => {
    const mockDocs = [
      {
        id: "adr-15cf2474f4a73310b7bda0c8f4cdfd64",
        type: "adres",
        weergavenaam: "Emmalaan 12, 3722XL Bilthoven",
      },
      {
        id: "adr-b2eee51ea672100c349e0ab719d68a15",
        type: "adres",
        weergavenaam: "Emmalaan 14, 3722XL Bilthoven",
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: { docs: mockDocs } }),
      }),
    );
    try {
      const res = await GET(makeRequest("Emmalaan"));
      expect(res.status).toBe(200);
      const data = (await res.json()) as Array<{ id: string; label: string }>;
      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({
        id: "adr-15cf2474f4a73310b7bda0c8f4cdfd64",
        label: "Emmalaan 12, 3722XL Bilthoven",
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("filters out docs missing id or weergavenaam", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            docs: [
              { id: "adr-15cf2474f4a73310b7bda0c8f4cdfd64", weergavenaam: "Emmalaan 12, Bilthoven" },
              { id: "adr-b2eee51ea672100c349e0ab719d68a15" }, // missing weergavenaam
              { weergavenaam: "Foo" }, // missing id
            ],
          },
        }),
      }),
    );
    try {
      const res = await GET(makeRequest("Emm"));
      const data = (await res.json()) as Array<{ id: string; label: string }>;
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("adr-15cf2474f4a73310b7bda0c8f4cdfd64");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

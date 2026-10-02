import { describe, it, expect, beforeAll } from "vitest";
import { safeBase, parseJson } from "@/lib/ai";
import { limited } from "@/lib/limit";

describe("safeBase (custom endpoint SSRF guard)", () => {
  it("accepts a public https URL and trims the trailing slash", () => {
    expect(safeBase("https://api.example.com/v1/")).toBe("https://api.example.com/v1");
  });
  it.each(["http://api.example.com", "https://localhost/v1", "https://127.0.0.1", "https://10.0.0.5", "https://192.168.1.2", "https://169.254.169.254/latest", "https://172.20.0.1", "https://[::1]/", "https://db.internal"])("rejects %s", (u) => {
    expect(() => safeBase(u)).toThrow();
  });
});

describe("parseJson", () => {
  it("parses plain JSON", () => expect(parseJson('{"a":1}')).toEqual({ a: 1 }));
  it("strips markdown code fences", () => expect(parseJson('```json\n{"a":1}\n```')).toEqual({ a: 1 }));
  it("throws on non-JSON", () => expect(() => parseJson("not json")).toThrow());
});

describe("rate limiter", () => {
  it("blocks after the max within the window and isolates keys", () => {
    const k = "t:" + Math.random();
    expect(limited(k, 2)).toBe(false);
    expect(limited(k, 2)).toBe(false);
    expect(limited(k, 2)).toBe(true);
    expect(limited(k + "other", 2)).toBe(false);
  });
});

describe("key encryption", () => {
  let enc: (t: string) => string, dec: (s: string) => string;
  beforeAll(async () => { process.env.KEY_ENCRYPTION_SECRET = Buffer.alloc(32, 7).toString("base64"); ({ enc, dec } = await import("@/lib/crypto")); });
  it("round-trips", () => expect(dec(enc("sk-secret-123"))).toBe("sk-secret-123"));
  it("never produces the same ciphertext twice", () => expect(enc("x")).not.toBe(enc("x")));
  it("does not contain the plaintext", () => expect(enc("sk-secret-123")).not.toContain("secret"));
  it("rejects tampered data", () => { const e = enc("hello").split("."); e[2] = Buffer.from("tampered").toString("base64"); expect(() => dec(e.join("."))).toThrow(); });
});

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
const k = () => Buffer.from(process.env.KEY_ENCRYPTION_SECRET!, "base64");
export function enc(t: string) { const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", k(), iv); const ct = Buffer.concat([c.update(t, "utf8"), c.final()]); return [iv, c.getAuthTag(), ct].map((b) => b.toString("base64")).join("."); }
export function dec(s: string) { const [iv, tag, ct] = s.split(".").map((x) => Buffer.from(x, "base64")); const d = createDecipheriv("aes-256-gcm", k(), iv); d.setAuthTag(tag); return Buffer.concat([d.update(ct), d.final()]).toString("utf8"); }

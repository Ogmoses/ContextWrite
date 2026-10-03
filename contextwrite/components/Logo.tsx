import { BRAND } from "@/lib/brand";
export default function Logo({ size = 52 }: { size?: number }) {
  return <span className="logo" style={{ width: size, height: size, borderRadius: size * 0.3 }}>
    {BRAND.logoUrl ? <img src={BRAND.logoUrl} alt="" /> : <svg viewBox="0 0 32 32" width={size * 0.58} height={size * 0.58} fill="currentColor" aria-hidden="true"><rect x="4" y="6" width="24" height="4" rx="2" /><rect x="4" y="14" width="17" height="4" rx="2" /><rect x="4" y="22" width="11" height="4" rx="2" /><circle cx="25" cy="24" r="3.5" /></svg>}
  </span>;
}

const P: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  wave: "M3 12h2M7 8v8M11 4v16M15 8v8M19 10v4",
  user: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21a8 8 0 0 1 16 0",
  plus: "M12 5v14M5 12h14",
  back: "M15 5l-7 7 7 7",
  close: "M6 6l12 12M18 6 6 18",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  eyeoff: "M3 3l18 18M10.6 5.1A9.700 9.700 0 0 1 12 5c6.400 0 10 7 10 7a17 17 0 0 1-3.200 4M6.600 6.600A17 17 0 0 0 2 12s3.600 7 10 7a9.600 9.600 0 0 0 4.200-1M9.900 9.900a3 3 0 0 0 4.200 4.200",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  pen: "M4 20h4L19 9a2.800 2.800 0 0 0-4-4L4 16zM14 6l4 4",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400",
  moon: "M21 12.800A9 9 0 1 1 11.200 3a7 7 0 0 0 9.800 9.800z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2",
};
export default function Icon({ n, size = 20 }: { n: string; size?: number }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d={P[n]} /></svg>;
}

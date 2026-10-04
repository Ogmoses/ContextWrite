"use client";
import { useEffect } from "react";
// Adds an "in" class to landing sections as they scroll into view; CSS does the animating.
export default function Reveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".ld .sect,.ld .strip,.ld .ctaw,.ld .foot2");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return null;
}

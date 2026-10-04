"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";

gsap.registerPlugin(ScrollTrigger);

export function CinematicReveal({ children, className = "", delay = 0, calm = false }: { children: ReactNode; className?: string; delay?: number; calm?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!root.current || calm || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const node = root.current!;
      const timeline = gsap.timeline({
        delay,
        scrollTrigger: { trigger: node, start: "top 88%", end: "bottom 12%", toggleActions: "play reverse play reverse" },
        defaults: { ease: "power3.out" },
      });
      if (node.querySelector(".note-card")) {
        timeline.fromTo(node.querySelector(".note-card"), { clipPath: "inset(0 100% 0 0 round 12px)", filter: "brightness(2)", rotateY: -12 }, { clipPath: "inset(0 0% 0 0 round 12px)", filter: "brightness(1)", rotateY: 0, duration: 1.15 });
      } else if (node.classList.contains("constellation-card")) {
        timeline.fromTo(node, { clipPath: "circle(0% at 50% 38%)", filter: "brightness(2)" }, { clipPath: "circle(100% at 50% 38%)", filter: "brightness(1)", duration: 1.5 });
        const lines = node.querySelectorAll<SVGPathElement>(".constellation-lines path");
        lines.forEach(line => {
          const length = line.getTotalLength();
          timeline.fromTo(line, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 1.3 }, .55);
        });
        timeline.fromTo(node.querySelectorAll(".wish-star"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .7, stagger: .2, ease: "back.out(2)" }, .5);
      } else if (node.classList.contains("question-inner")) {
        timeline.fromTo(node.querySelector(".question-emblem"), { scale: 0, rotate: -90, filter: "blur(12px)" }, { scale: 1, rotate: 0, filter: "blur(0px)", duration: 1.2 });
        timeline.fromTo(node.querySelector("h2"), { clipPath: "inset(0 50% 0 50%)", filter: "blur(10px)", opacity: .2 }, { clipPath: "inset(0 0% 0 0%)", filter: "blur(0px)", opacity: 1, duration: 1.8 }, .4);
        timeline.fromTo(node.querySelectorAll(".answer-buttons .button"), { scale: .75, opacity: 0 }, { scale: 1, opacity: 1, duration: .75, stagger: .14, ease: "back.out(1.7)" }, 1.2);
      } else {
        const headings = node.querySelectorAll("h2, blockquote");
        if (headings.length) timeline.fromTo(headings, { clipPath: "inset(0 100% 0 0)", filter: "blur(7px)" }, { clipPath: "inset(0 0% 0 0)", filter: "blur(0px)", duration: 1.45, stagger: .15 }, 0);
        const eyebrows = node.querySelectorAll(".eyebrow, .quote-caption");
        if (eyebrows.length) timeline.fromTo(eyebrows, { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: .9 }, .15);
        const paragraphs = node.querySelectorAll(":scope > p, .letter-heading > p");
        if (paragraphs.length) timeline.fromTo(paragraphs, { opacity: 0 }, { opacity: 1, duration: 1 }, .55);
        const letter = node.querySelector(".letter");
        if (letter) timeline.fromTo(letter, { clipPath: "inset(0 0 100% 0)", rotateX: 12, transformOrigin: "top center" }, { clipPath: "inset(0 0 0% 0)", rotateX: 0, duration: 1.3 }, .4);
      }
    }, root);
    return () => ctx.revert();
  }, [calm, delay]);
  return <div ref={root} className={`cinematic-reveal ${className}`}>{children}</div>;
}

export function useHeroSequence(root: RefObject<HTMLDivElement | null>, calm: boolean) {
  const hasPlayed = useRef(false);
  useLayoutEffect(() => {
    if (!root.current) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 140);
    });
    observer.observe(root.current);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [root]);
  useLayoutEffect(() => {
    if (!root.current || calm || hasPlayed.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const main = root.current.querySelector<HTMLElement>("main");
    const header = root.current.querySelector<HTMLElement>("header");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (main) main.inert = true;
    if (header) header.inert = true;
    const unlock = () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      if (main) main.inert = false;
      if (header) header.inert = false;
    };
    const ctx = gsap.context(() => {
      const hold = 3;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: () => { hasPlayed.current = true; } });
      gsap.set(".intro-aperture", { clipPath: "circle(150% at 72% 42%)" });
      tl.fromTo(".intro-aperture span", { opacity: 0, filter: "blur(12px)" }, { opacity: 1, filter: "blur(0px)", duration: 1.2 }, 0);
      tl.fromTo(".intro-aperture", { clipPath: "circle(150% at 72% 42%)" }, { clipPath: "circle(0% at 72% 42%)", duration: 1.8, ease: "power3.inOut" }, hold)
        .fromTo(".hero-eyebrow", { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 1 }, hold + .45)
        .fromTo(".hero-char", { opacity: 0, rotateX: -85, filter: "blur(8px)", transformOrigin: "50% 100%" }, { opacity: 1, rotateX: 0, filter: "blur(0px)", duration: 1.1, stagger: .028 }, hold + .55)
        .fromTo(".moon-reveal", { clipPath: "circle(0% at 50% 50%)", scale: .8, filter: "blur(20px)" }, { clipPath: "circle(75% at 50% 50%)", scale: 1, filter: "blur(0px)", duration: 2.2, ease: "power2.inOut" }, hold + .25)
        .fromTo(".orbit", { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: 2, stagger: .15 }, hold + .8)
        .fromTo(".hero-copy > p, .hero-cta, .hero-footnote", { opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 1, stagger: .16 }, hold + 1.65)
        .fromTo(".orbit-note, .moon-coordinate, .moon-spark, .floating-heart", { opacity: 0 }, { opacity: 1, duration: 1.1, stagger: .09 }, hold + 1.85);
      tl.call(unlock, [], hold + 1.8);
      // A light passes over the title after the typography resolves.
      tl.fromTo(".hero-title-shimmer .hero-char", { color: "#fff4dc" }, { color: "#e7bbca", duration: 1.4, stagger: .06, ease: "power1.inOut" }, hold + 1.8);
    }, root);
    return () => { unlock(); ctx.revert(); };
  }, [calm, root]);
}

export function HeroTitle() {
  const lines = ["Of all the stars,", "my favorite", "is you, Ayla."];
  return <h1 id="hero-title" aria-label="Of all the stars, my favorite is you, Ayla.">{lines.map((line, i) => <span className={`hero-title-line ${i === 2 ? "hero-title-shimmer" : ""}`} key={line} aria-hidden="true">{Array.from(line).map((char, j) => <span className="hero-char" key={j}>{char === " " ? "\u00a0" : char}</span>)}</span>)}</h1>;
}

"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import StoryCouple, { type StoryCoupleHandle } from "./story-couple";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
const CelestialScene = dynamic(() => import("./celestial-scene"), { ssr: false });

const subscribeViewport = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};
const getViewport = () => `${window.innerWidth}:${window.innerHeight}`;
const getServerViewport = () => "1440:1000";

// Stable SVG serialization across JavaScript engines; subpixel precision is ample.
const coordinate = (value: number) => value.toFixed(3);

const leaves = Array.from({ length: 380 }, (_, i) => {
  const angle = i * 2.39996;
  const radius = Math.sqrt(i / 380);
  return { x: coordinate(1050 + Math.cos(angle) * radius * 270), y: coordinate(390 + Math.sin(angle) * radius * 145), rx: 10 + i % 12, ry: 6 + i % 8, rotation: (i * 31) % 180 };
});

export default function MoonlitLandscape({ calm, accepted, onExitEnding, children, opening }: { calm: boolean; accepted: boolean; onExitEnding: () => void; children: ReactNode; opening: ReactNode }) {
  const viewport = useSyncExternalStore(subscribeViewport, getViewport, getServerViewport);
  const [viewportWidth, viewportHeight] = viewport.split(":").map(Number);
  // Keep 600 world units visible on narrow screens, including the full couple.
  const portraitHeight = Math.max(1200, viewportHeight / viewportWidth * 600);
  const sceneViewBox = viewportWidth <= 700 ? `0 ${1000 - portraitHeight} 1660 ${portraitHeight}` : "0 0 1600 1000";
  const root = useRef<HTMLElement>(null);
  const couple = useRef<StoryCoupleHandle>(null);
  const [atEnding, setAtEnding] = useState(false);
  const galaxy = accepted && (atEnding || calm);
  useLayoutEffect(() => {
    if (!root.current || calm || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let updateMoonDestination: (() => void) | undefined;
    const ctx = gsap.context(() => {
      const hero = root.current!.querySelector<HTMLElement>(".hero")!;
      const moon = root.current!.querySelector<HTMLElement>(".moon-scene")!;
      const sceneArt = root.current!.querySelector<SVGSVGElement>(".landscape-art")!;
      let destination = { x: 0, y: 0, scale: 1 };
      updateMoonDestination = () => {
        const saved = { x: gsap.getProperty(moon, "x"), y: gsap.getProperty(moon, "y"), scale: gsap.getProperty(moon, "scale") };
        const isPhone = window.innerWidth <= 700;
        const baselineY = isPhone ? 0 : -15;
        gsap.set(moon, { x: 0, y: baselineY, scale: 1 });
        const from = moon.getBoundingClientRect();
        const scene = sceneArt.getBoundingClientRect();
        const box = sceneArt.viewBox.baseVal;
        const factor = Math.max(scene.width / box.width, scene.height / box.height);
        destination = {
          x: scene.left + scene.width / 2 + (670 - box.x - box.width / 2) * factor - (from.left + from.width / 2),
          y: scene.top + scene.height / 2 + (380 - box.y - box.height / 2) * factor - (from.top + from.height / 2) + baselineY,
          scale: (166 * factor) / (from.width * (isPhone ? .72 : .78) * .785),
        };
        gsap.set(moon, saved);
      };
      updateMoonDestination();
      ScrollTrigger.addEventListener("refreshInit", updateMoonDestination);
      const question = root.current!.querySelector<HTMLElement>(".story-question")!;
      const quoteNodes = Array.from(root.current!.querySelectorAll<HTMLElement>(".landscape-quotes blockquote"));
      // Only one quote may occupy this shared text area, including fast reverse scrolls.
      gsap.set(quoteNodes, { autoAlpha: 0 });
      const quoteReveals = quoteNodes.map((quote) => gsap.timeline({ paused: true }).fromTo(quote,
        { autoAlpha: 0, filter: "blur(10px)", clipPath: "inset(0 100% 0 0)" },
        { autoAlpha: 1, filter: "blur(0px)", clipPath: "inset(0 0% 0 0)", duration: .75, ease: "power3.out", immediateRender: false }
      ));
      quoteReveals[0].progress(1).pause();
      let currentQuote = 0;
      let currentEnding = false;
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root.current, start: "top top", end: "bottom bottom", scrub: .8, invalidateOnRefresh: true,
        },
        defaults: { ease: "none" },
        onUpdate: function () {
          const progress = Math.max(0, this.time() - .25);
          hero.inert = this.time() > .09;
          const nextEnding = progress > .83;
          if (nextEnding !== currentEnding) {
            if (currentEnding && !nextEnding) onExitEnding();
            currentEnding = nextEnding; setAtEnding(nextEnding);
          }
          const nextQuote = progress < .2 ? 0 : progress < .43 ? 1 : progress < .65 ? 2 : 3;
          if (nextQuote !== currentQuote) {
            // Reversing the outgoing reveal crossfades full sentences on top of
            // each other. Reset every reveal before starting the incoming one.
            quoteReveals.forEach((reveal) => reveal.pause(0));
            gsap.set(quoteNodes, { autoAlpha: 0 });
            quoteReveals[nextQuote].restart();
            currentQuote = nextQuote;
          }
          couple.current?.seek(progress);
          question.inert = progress < .87;
        },
      });
      const story = gsap.timeline({ defaults: { ease: "none" } });
      story.fromTo(".landscape-moon-cutout", { attr: { cx: 715, cy: 340 } }, { attr: { cx: 915, cy: 320 }, duration: .24 }, 0)
        .fromTo(".landscape-moon-glow", { opacity: .25, scale: .7, transformOrigin: "670px 380px" }, { opacity: .85, scale: 1.15, duration: .3 }, 0)
        .fromTo(".moon-reflection", { opacity: .2 }, { opacity: .8, duration: .3 }, 0)
        .fromTo(".landscape-foreground", { filter: "brightness(.55)" }, { filter: "brightness(1)", duration: .25 }, .05)
        .to(".landscape-tree", { x: -260, duration: .45 }, .35)
        .to(".landscape-mountains", { x: -65, duration: .45 }, .35)
        .fromTo(".scene-fireflies", { opacity: .2 }, { opacity: 1, duration: .3 }, .3)
        .to(".landscape-copy, .landscape-caption", { opacity: 0, duration: .07 }, .81)
        .fromTo(".story-final-shade", { opacity: 0 }, { opacity: 1, duration: .12 }, .81)
        .fromTo(".story-question", { autoAlpha: 0, clipPath: "circle(0% at 50% 50%)", filter: "blur(14px)" }, { autoAlpha: 1, clipPath: "circle(100% at 50% 50%)", filter: "blur(0px)", duration: .13 }, .84)
        .fromTo(".landscape-chapter-progress", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
      timeline
        .fromTo(".landscape-art, .landscape-vignette", { opacity: 0 }, { opacity: 1, duration: .19 }, .025)
        .fromTo(".landscape-scene-moon", { opacity: 0 }, { opacity: 1, duration: .025 }, .215)
        .to(moon, { x: () => destination.x, y: () => destination.y, scale: () => destination.scale, duration: .225, ease: "power1.inOut" }, 0)
        .to(".hero-copy", { opacity: 0, filter: "blur(9px)", clipPath: "inset(0 0 0 100%)", duration: .11 }, 0)
        .to(".hero .orbit, .hero .orbit-note, .hero .moon-coordinate, .hero .moon-spark, .hero .floating-heart, .hero .moon-halo, .hero .scroll-cue, .hero .hero-side-note", { opacity: 0, duration: .075 }, 0)
        .fromTo(".landscape-mountains", { y: 150 }, { y: 0, duration: .19, ease: "power2.out" }, .035)
        .fromTo(".landscape-foreground", { y: 260, opacity: 0 }, { y: 0, opacity: 1, duration: .18, ease: "power2.out" }, .055)
        .fromTo(".landscape-tree", { x: 150 }, { x: 0, duration: .16, ease: "power2.out" }, .075)
        .fromTo(".landscape-copy, .landscape-caption", { opacity: 0 }, { opacity: 1, duration: .065 }, .185)
        .to(".hero .moon-reveal", { opacity: 0, duration: .025 }, .215)
        .to(hero, { autoAlpha: 0, duration: .001 }, .249)
        .add(story, .25);

    }, root);
    return () => { if (updateMoonDestination) ScrollTrigger.removeEventListener("refreshInit", updateMoonDestination); ctx.revert(); };
  }, [calm, sceneViewBox, onExitEnding]);

  useLayoutEffect(() => {
    if (!calm) return;
    const question = root.current?.querySelector<HTMLElement>(".story-question");
    if (!question) return;
    let inside = question.getBoundingClientRect().top < window.innerHeight * .5;
    const onScroll = () => {
      const next = question.getBoundingClientRect().top < window.innerHeight * .5;
      if (inside && !next) onExitEnding();
      inside = next;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [calm, onExitEnding]);

  return <section id="our-story" ref={root} className={`landscape-chapter ${calm ? "landscape-calm" : ""} ${galaxy ? "galaxy-ending" : ""}`} aria-label="A moonlit daydream of us beside a tree">
    <span id="landscape-destination" className="landscape-destination" aria-hidden="true" />
    <span id="question-destination" className="question-destination" aria-hidden="true" />
    <div className="landscape-sticky">
      <div className="story-opening">{opening}</div>
      <svg className="landscape-art" viewBox={sceneViewBox} preserveAspectRatio="xMidYMid slice" role="img" aria-labelledby="landscape-description">
        <desc id="landscape-description">A boy and a girl sit close together beneath a leafy tree beside a quiet lake, while a crescent moon becomes full above the mountains.</desc>
        <defs>
          <linearGradient id="land-sky" x2="0" y2="1"><stop stopColor="#0d0b1c"/><stop offset=".55" stopColor="#32213e"/><stop offset="1" stopColor="#97728e"/></linearGradient>
          <linearGradient id="land-water" x2="0" y2="1"><stop stopColor="#61506f"/><stop offset=".5" stopColor="#262039"/><stop offset="1" stopColor="#100f20"/></linearGradient>
          <linearGradient id="land-moon" x2=".5" y2="1"><stop stopColor="#fff5db"/><stop offset="1" stopColor="#d8bcae"/></linearGradient>
          <radialGradient id="land-glow"><stop stopColor="#ead5ce" stopOpacity=".22"/><stop offset=".35" stopColor="#d5b4d1" stopOpacity=".09"/><stop offset="1" stopColor="#d5b4d1" stopOpacity="0"/></radialGradient>
          <linearGradient id="land-reflection" x2="0" y2="1"><stop stopColor="#e3cbbf" stopOpacity=".6"/><stop offset="1" stopColor="#b394be" stopOpacity="0"/></linearGradient>
          <linearGradient id="land-edge" x2="0" y2="1"><stop stopColor="#d9b8d2" stopOpacity=".45"/><stop offset="1" stopColor="#9e7caf" stopOpacity="0"/></linearGradient>
          <mask id="land-phase"><rect width="1600" height="1000" fill="black"/><circle cx="670" cy="380" r="83" fill="white"/><circle className="landscape-moon-cutout" cx={calm ? 915 : 715} cy="340" r="81" fill="black"/></mask>
          <filter id="land-moon-texture"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="14"/><feColorMatrix type="saturate" values="0"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="soft-light"/></filter>
          <filter id="land-soft"><feGaussianBlur stdDeviation="12"/></filter>
          <filter id="firefly-glow"><feGaussianBlur stdDeviation="2"/></filter>
        </defs>
        <rect className="landscape-sky-background" width="1600" height="1000" fill="url(#land-sky)"/>
        <g className="landscape-sky-stars" fill="#ecdfed">{Array.from({ length: 85 }, (_, i) => <circle key={i} cx={(i * 193.7 + 21) % 1600} cy={(i * 73.2 + 12) % 610} r={i % 13 === 0 ? 1.7 : .7} opacity={.2 + (i % 5) * .1} />)}</g>
        <ellipse className="landscape-moon-glow" cx="670" cy="380" rx="370" ry="300" fill="url(#land-glow)"/>
        <g className="landscape-scene-moon" mask="url(#land-phase)"><circle cx="670" cy="380" r="83" fill="url(#land-moon)"/><circle cx="670" cy="380" r="83" fill="url(#land-moon)" filter="url(#land-moon-texture)" opacity=".28"/></g>
        <g fill="#8e688d" opacity=".1" filter="url(#land-soft)"><ellipse cx="400" cy="526" rx="310" ry="24"/><ellipse cx="1190" cy="571" rx="400" ry="20"/></g>
        <g className="landscape-mountains"><path d="M0 640 100 589 188 610 296 490 362 543 430 517 555 627 674 565 793 643 927 588 1075 514 1190 552 1310 478 1475 612 1600 561 1700 523 1820 595V800H0Z" fill="#4b3a59"/>
        <path d="m230 550 66-60 66 53-55-20-29 10Z M1050 536l25-22 115 38-93-16-26 12Z M1265 515l45-37 66 56-60-24-19 12Z" fill="#b5a0bc" opacity=".2"/>
        <path d="M0 672 170 609 330 658 464 593 617 673 817 617 930 670 1129 604 1290 652 1470 590 1600 655 1710 605 1820 662V810H0Z" fill="#332b44"/>
        <path d="M0 701q173-43 357-11t323 4 345-15 335 14 240-22q110-24 220 8V810H0Z" fill="#25243a"/>
        </g><rect y="708" width="1600" height="292" fill="url(#land-water)"/>
        <path d="M0 710q370 4 720 0t880 1" fill="none" stroke="#d5adc8" strokeOpacity=".2"/>
        <g className="moon-reflection">
          <path d="m648 709 45 0 127 256H503Z" fill="url(#land-reflection)" opacity=".16" filter="url(#land-soft)"/>
          {Array.from({ length: 34 }, (_, i) => <path key={i} d={`M${coordinate(670 - (12 + i * 2.4) + Math.sin(i * 3.4) * 20)} ${714 + i * 6.3} h${25 + i * 4.8}`} stroke="#dbc4c9" strokeWidth={i % 3 === 0 ? 1.5 : .7} opacity={.34 * (1 - i / 40)} />)}
        </g>
        <g stroke="#9e83ad" strokeWidth=".6" opacity=".18">{Array.from({ length: 30 }, (_, i) => <path key={i} d={`M${(i * 173) % 1500} ${725 + (i * 19) % 230}h${30 + (i * 13) % 110}`} />)}</g>
        <g className="landscape-foreground">
          <path d="M0 923q181-49 348-25t275-27q81-36 171-25 155-13 248-30 198-16 335 54 126 13 223 5v125H0Z" fill="#0d1020"/>
          <path d="M604 884q93-52 197-39 150-13 241-28 167-14 262 27" stroke="url(#land-edge)" strokeWidth="2" fill="none"/>
          <g className="landscape-tree">
          {/* Branches are drawn individually so the canopy reads as a real silhouette. */}
          <g fill="#0b0e1c" stroke="#0b0e1c" strokeLinecap="round" strokeLinejoin="round">
            <path d="M985 850q23-140 3-255-5-73 10-126l19-54 8 1q-24 64-18 111 7 99 18 176l22 132 36 11-39 7-22-9-42 15-16-4Z" stroke="none"/>
            <path d="M1009 653q-22-117-98-156-45-26-63-68M1004 569q57-91 132-112l77-21M996 534q-34-51-50-118l-13-40M1010 509q-2-98 47-149M961 533q-57-24-103-28l-70-35M1086 474q56-5 93-42l34-41" fill="none" strokeWidth="12"/>
            <path d="m911 497-7-59-31-44m69 44-55-26-38-42m169 24 49-49m54 112 18-61 43-23m-290 57-52-12m255-6 58-42m-26 91 69-3 56-28" fill="none" strokeWidth="5"/>
          </g>
          <g className="tree-canopy"><path d="M800 404q-23-47 32-64-9-51 54-50 21-49 76-34 44-43 89-16 67-36 98 9 66-17 78 28 66 8 64 49 64 14 45 63 37 50-15 66 6 51-61 47-25 46-82 25-47 40-91 5-61 34-97-10-58 12-73-36-66 0-56-45-51-6-37-37Z" fill="#101320"/>{leaves.map((leaf, i) => <ellipse key={i} cx={leaf.x} cy={leaf.y} rx={leaf.rx} ry={leaf.ry} transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`} fill={i % 4 === 0 ? "#141522" : i % 3 === 0 ? "#111320" : "#0e121e"} />)}</g>
          <g opacity=".35" stroke="#b19ac1" strokeWidth=".6" fill="none"><path d="M984 821q20-121 5-211M855 429q26 28 37 63M1028 399q14-34 29-38"/></g>
          </g>
          <StoryCouple ref={couple} accepted={accepted} calm={calm} />
          <g fill="none" stroke="#151929" strokeWidth="2" strokeLinecap="round">{Array.from({ length: 48 }, (_, i) => { const x = 520 + i * 19; const y = coordinate(909 - Math.sin(i / 15) * 48); return <path key={i} d={`M${x} ${y}q${-6 + i % 12} -${20 + i % 25} ${-12 + i % 20} -${31 + i % 23} M${x} ${y}q8 -18 15 -22`} />; })}</g>
        </g>
        <g className="scene-fireflies">{Array.from({ length: 20 }, (_, i) => <g key={i} className="scene-firefly" style={{ animationDelay: `${-(i % 7)}s` }}><circle cx={610 + (i * 61) % 620} cy={625 + (i * 37) % 225} r="4" fill="#e7dca8" opacity=".2" filter="url(#firefly-glow)"/><circle cx={610 + (i * 61) % 620} cy={625 + (i * 37) % 225} r="1.2" fill="#f2e6b9" opacity=".8"/></g>)}</g>
      </svg>
      <CelestialScene calm={calm} galaxy={galaxy} />
      <div className="landscape-vignette" aria-hidden="true"/>
      <div className="landscape-copy">
        <span className="eyebrow">A daydream I’d like to make real</span>
        <div className="landscape-quotes">
          <blockquote className="landscape-quote-first">“If I could pause the world,<br />I’d pause it <em>here, with you.</em>”</blockquote>
          <blockquote className="landscape-quote-second">“The moon can have the sky.<br />I only want <em>this moment with you.</em>”</blockquote>
          <blockquote className="landscape-quote-third">“No perfect destination.<br />Just your hand, <em>and a little more road.</em>”</blockquote>
          <blockquote className="landscape-quote-fourth">“I don’t need a perfect story.<br />I just want <em>more chapters with you.</em>”</blockquote>
        </div>
      </div>
      <div className="story-final-shade" aria-hidden="true" />
      <div className="story-question" inert={!calm}>{children}</div>
      <div className="landscape-caption"><span>A QUIET NIGHT. TWO HEARTS. ENDLESS POSSIBILITIES.</span><span className="landscape-progress-track"><span className="landscape-chapter-progress"/></span><span className="landscape-scroll-hint">{calm ? "A LITTLE DREAM OF US" : "SCROLL TO UNFOLD · SCROLL BACK TO RELIVE"}</span></div>
    </div>
  </section>;
}

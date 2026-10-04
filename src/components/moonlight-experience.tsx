"use client";

import { motion, MotionConfig } from "framer-motion";
import RomanticMusic from "./romantic-music";
import MoonlitLandscape from "./moonlit-landscape";
import { HeroTitle, useHeroSequence } from "./cinematic-reveal";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

const CalmContext = createContext(false);
const subscribeToMotion = (callback: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const getMotionPreference = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getServerMotionPreference = () => false;

function Icon({ name, className = "" }: { name: "star" | "heart" | "arrow" | "moon" | "pause" | "play" | "mail"; className?: string }) {
  const paths = {
    star: <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    arrow: <><path d="M4 12h16M14 6l6 6-6 6" /></>,
    moon: <path d="M20.8 13.1A9 9 0 0 1 10.9 3.2 9 9 0 1 0 20.8 13.1Z" />,
    pause: <><path d="M9 5v14M15 5v14" /></>,
    play: <path d="m8 5 11 7-11 7V5Z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
  };
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Starfield() {
  return <div className="starfield" aria-hidden="true">
    {Array.from({ length: 64 }, (_, i) => <span key={i} className={`sky-star ${i > 29 ? "extra-star" : ""}`} style={{ left: `${(i * 43.71 + 3) % 100}%`, top: `${(i * 29.31 + 4) % 100}%`, "--size": `${i % 7 === 0 ? 3 : 1.5}px`, "--delay": `${-(i % 9)}s`, "--duration": `${4 + (i % 5)}s` } as CSSProperties} />)}
    <span className="shooting-star" /><span className="shooting-star second" />
  </div>;
}

function Moon() {
  return <div className="moon-scene" aria-hidden="true">
    <div className="moon-halo" />
    <span className="floating-heart heart-one">♡</span><span className="floating-heart heart-two">♡</span><span className="floating-heart heart-three">♡</span>
    <div className="orbit orbit-one" /><div className="orbit orbit-two" />
    <div className="moon-reveal"><svg className="crescent" viewBox="0 0 400 400" fill="none">
      <defs>
        <linearGradient id="moon-light" x1="120" y1="50" x2="290" y2="370" gradientUnits="userSpaceOnUse"><stop stopColor="#fff9e6" /><stop offset=".38" stopColor="#efd8bb" /><stop offset=".72" stopColor="#d1aa95" /><stop offset="1" stopColor="#f5e3ce" /></linearGradient>
        <mask id="crescent-mask"><circle cx="200" cy="200" r="157" fill="white" /><circle cx="263" cy="151" r="151" fill="black" /></mask>
        <filter id="moon-texture"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="3" seed="8" /><feColorMatrix type="saturate" values="0" /><feComposite in2="SourceGraphic" operator="in" /><feBlend in="SourceGraphic" mode="soft-light" /></filter>
      </defs>
      <g mask="url(#crescent-mask)"><circle cx="200" cy="200" r="157" fill="url(#moon-light)" /><circle cx="200" cy="200" r="157" fill="url(#moon-light)" filter="url(#moon-texture)" opacity=".45" /></g>
    </svg></div>
    <Icon name="star" className="moon-spark spark-one" /><Icon name="star" className="moon-spark spark-two" /><Icon name="star" className="moon-spark spark-three" />
    <span className="moon-coordinate">somewhere between a wish & a daydream</span>
    <div className="orbit-note"><span className="tiny-dot" /> you, in every universe</div>
  </div>;
}

function Question({ accepted, onAccept }: { accepted: boolean; onAccept: () => void }) {
  const calm = useContext(CalmContext);
  const [space, setSpace] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const letter = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (accepted) { heading.current?.focus({ preventScroll: true }); window.dispatchEvent(new Event("ayla-celebrate")); }
  }, [accepted]);
  return <section id="the-question" className={`final-stage ${accepted ? "final-accepted" : ""}`} aria-labelledby="question-title">
    {accepted ? <>
      <motion.div className="accepted-dream" style={{ x: "-50%" }} initial={{ opacity: 0, y: 12, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: calm ? 0 : 1.8, delay: calm ? 0 : 5.5 }}>
        <span className="dream-speaker">The beginning of us</span>
        <h2 ref={heading} tabIndex={-1} id="question-title">And just like that,<br /><em>it’s you and me.</em></h2>
        <p>Under the same sky. At the start of everything. ♡</p>
      </motion.div>
    </> : <div className="question-conversation">
      <div className="dream-bubble boy-dream">
        <span className="dream-speaker">A little courage. All my heart.</span>
        <h2 id="question-title">Ayla, will you be<br /><em>my girlfriend?</em> <span className="question-heart">❤️</span></h2>
        <button className="text-button story-letter-button" onClick={() => letter.current?.showModal()}><Icon name="mail" /> A little letter, just for you</button>
        <span className="dream-dot dream-dot-one" aria-hidden="true"/><span className="dream-dot dream-dot-two" aria-hidden="true"/>
      </div>
      <div className="dream-bubble girl-dream">
        <span className="dream-speaker">Your turn, Ayla ♡</span>
        <div className="answer-buttons"><button className="button button-primary" onClick={onAccept}>Yes, I’d love to <Icon name="heart" /></button><button className="button button-outline" onClick={onAccept}>Of course <span aria-hidden="true">♡</span></button></div>
        <button className="take-time" onClick={() => setSpace(true)}>I need a little time</button>
        <div className="time-message" role="status">{space ? "Take all the time you need. No rush, no pressure. ♡" : "A new chapter starts with a little yes."}</div>
        <span className="dream-dot dream-dot-one" aria-hidden="true"/><span className="dream-dot dream-dot-two" aria-hidden="true"/>
      </div>
    </div>}
    <dialog ref={letter} className="letter-dialog" aria-labelledby="letter-title">
      <form method="dialog"><button className="letter-close" aria-label="Close letter">×</button></form>
      <span className="eyebrow">Something from my heart</span>
      <h3 id="letter-title">For Ayla,</h3>
      <p>You’ve become the person I catch myself thinking about when something good happens. The person I want to share the small things with. The smile that stays with me a little longer.</p>
      <p>I don’t have a perfect speech or every answer. Just a very real feeling, and a little hope that you might feel it too.</p>
      <p>I’d love to get to know every little part of your world, and let you into mine. Slowly, honestly, and with so many reasons to smile along the way.</p>
      <p className="letter-signature">So, here’s my heart. And one little question. ♡</p>
    </dialog>
  </section>;
}

export default function MoonlightExperience() {
  const reducedMotion = useSyncExternalStore(subscribeToMotion, getMotionPreference, getServerMotionPreference);
  const [paused, setPaused] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [questionVisit, setQuestionVisit] = useState(0);
  const resetEnding = useCallback(() => {
    setAccepted(false);
    setQuestionVisit(visit => visit + 1);
  }, []);
  const calm = paused || !!reducedMotion;
  const experienceRef = useRef<HTMLDivElement>(null);
  useHeroSequence(experienceRef, calm);
  return <CalmContext.Provider value={calm}><MotionConfig reducedMotion={calm ? "always" : "user"}>
    <div ref={experienceRef} className={`experience ${calm ? "calm" : ""}`}>
      <div className="intro-aperture" aria-hidden="true"><span>for you, Ayla.</span></div>
      <a className="skip-link" href="#our-story">Skip to the story</a>
      <Starfield />
      <header className="story-header section-shell">
        <a href="#" className="brand" aria-label="Ayla, back to the beginning"><Icon name="moon" /><span>ayla<span className="brand-dot">.</span></span></a>
        <span className="story-header-note">a little story of us</span>
        <a href="#question-destination" className="story-skip" aria-label="Go to the question"><Icon name="heart" /></a>
        <RomanticMusic />
        <button className="motion-toggle" onClick={() => setPaused(!paused)} aria-label={paused ? "Resume ambient animations" : "Pause ambient animations"} aria-pressed={paused} title={paused ? "Resume animations" : "Pause animations"}><Icon name={paused ? "play" : "pause"} /></button>
      </header>
      <main id="main">
        <MoonlitLandscape calm={calm} accepted={accepted} onExitEnding={resetEnding} opening={<section className="hero section-shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow"><span className="tiny-dot" /> A little universe, made just for you</span>
            <HeroTitle />
            <p>Some things are too lovely to leave unsaid.<br />So I borrowed a little moonlight<br className="mobile-break" /> to tell you something.</p>
            <a className="button button-primary hero-cta" href="#landscape-destination">Step into our story <Icon name="arrow" /></a>
            <span className="hero-footnote"><Icon name="star" /> Scroll slowly. This little world moves with you.</span>
          </div>
          <Moon />
          <a href="#landscape-destination" className="scroll-cue"><span className="scroll-line" /><span>LET THE NIGHT UNFOLD</span></a>
          <span className="hero-side-note" aria-hidden="true">WRITTEN IN THE STARS, MEANT FOR YOU</span>
        </section>}><Question key={questionVisit} accepted={accepted} onAccept={() => setAccepted(true)} /></MoonlitLandscape>
      </main>

    </div>
  </MotionConfig></CalmContext.Provider>;
}

"use client";

import { useEffect, useRef, useState } from "react";

// An original, quiet piano-like score. Generated locally: no streamed audio or downloads.
const chords = [
  [48, 55, 60, 64, 67], [45, 52, 57, 60, 64],
  [41, 48, 53, 57, 60], [43, 50, 55, 59, 62],
  [48, 55, 59, 64, 67], [45, 52, 57, 60, 64],
  [41, 48, 53, 57, 62], [43, 50, 55, 60, 62],
];
const melody = [[76, 74, 72, 67], [72, 71, 69, 64], [69, 67, 65, 69], [67, 71, 74, 71], [76, 79, 76, 74], [72, 76, 72, 69], [69, 72, 74, 72], [71, 69, 67, 0]];

export default function RomanticMusic() {
  const [playing, setPlaying] = useState(false);
  const toggle = useRef<() => void>(() => {});

  useEffect(() => {
    let context: AudioContext | undefined;
    let master: GainNode;
    let dry: GainNode;
    let delay: DelayNode;
    let timer: ReturnType<typeof setInterval> | undefined;
    let nextNote = 0;
    let step = 0;
    let enabled = false;
    let disposed = false;
    let manuallyMuted = false;
    try { manuallyMuted = localStorage.getItem("ayla-music-muted") === "true"; } catch { /* Storage is optional. */ }

    function note(midi: number, time: number, strength: number) {
      if (!context || !midi) return;
      const frequency = 440 * 2 ** ((midi - 69) / 12);
      // Soft fundamental and a rapidly decaying overtone, with no sharp attack.
      [1, 2].forEach((harmonic, index) => {
        const voice = context!.createOscillator();
        const envelope = context!.createGain();
        voice.type = "sine";
        voice.frequency.value = frequency * harmonic;
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(strength * (index ? .12 : 1), time + .045);
        envelope.gain.exponentialRampToValueAtTime(.0001, time + (index ? 1.2 : 3.8));
        voice.connect(envelope); envelope.connect(dry); envelope.connect(delay);
        voice.start(time); voice.stop(time + 4);
        voice.onended = () => { voice.disconnect(); envelope.disconnect(); };
      });
    }
    function schedule() {
      if (!context || context.state !== "running" || !enabled || document.hidden) return;
      while (nextNote < context.currentTime + .2) {
        const bar = Math.floor(step / 8) % chords.length;
        const beat = step % 8;
        const chord = chords[bar];
        note(chord[[1, 2, 3, 4, 2, 3, 4, 2][beat]], nextNote, .10);
        if (beat === 0) note(chord[0], nextNote, .09);
        if (beat % 2 === 0) note(melody[bar][beat / 2], nextNote + .025, .085);
        nextNote += .57; step++;
      }
    }
    function createScore() {
      context = new AudioContext();
      master = context.createGain(); master.gain.value = 0;
      dry = context.createGain(); dry.gain.value = 1;
      delay = context.createDelay(2); delay.delayTime.value = .43;
      const echo = context.createGain(); echo.gain.value = .2;
      const filter = context.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 1800;
      delay.connect(filter); filter.connect(echo); echo.connect(delay); echo.connect(master);
      dry.connect(master); master.connect(context.destination);
      timer = setInterval(schedule, 100);
    }
    async function start() {
      if (disposed) return;
      try {
        if (!context) createScore();
        await context!.resume();
        if (disposed || !enabled || document.hidden) return;
        nextNote = context!.currentTime + .06;
        master.gain.cancelScheduledValues(context!.currentTime);
        master.gain.setTargetAtTime(.16, context!.currentTime, 1.2);
        setPlaying(true); schedule();
      } catch { setPlaying(false); }
    }
    function silence() {
      if (context) {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0, context.currentTime, .15);
      }
      setPlaying(false);
    }
    function firstGesture(event: Event) {
      if ((event.target as Element)?.closest?.(".music-toggle") || manuallyMuted || enabled) return;
      if (event instanceof KeyboardEvent && !["Enter", " "].includes(event.key)) return;
      enabled = true; void start();
    }
    toggle.current = () => {
      enabled = !enabled; manuallyMuted = !enabled;
      try { localStorage.setItem("ayla-music-muted", String(manuallyMuted)); } catch { /* Storage is optional. */ }
      if (enabled) void start(); else silence();
    };
    function visibility() {
      if (document.hidden) { silence(); void context?.suspend(); }
      else if (enabled) void start();
    }
    document.addEventListener("pointerdown", firstGesture);
    document.addEventListener("keydown", firstGesture);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true; toggle.current = () => {};
      clearInterval(timer);
      document.removeEventListener("pointerdown", firstGesture);
      document.removeEventListener("keydown", firstGesture);
      document.removeEventListener("visibilitychange", visibility);
      void context?.close();
    };
  }, []);

  return <button type="button" className={`motion-toggle music-toggle ${playing ? "music-playing" : ""}`} onClick={() => toggle.current()} aria-label={playing ? "Mute romantic music" : "Play soft romantic music"} aria-pressed={playing} title={playing ? "Mute music" : "Soft romantic music"}>
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>{!playing && <path d="m3 3 18 18"/>}</svg>
  </button>;
}

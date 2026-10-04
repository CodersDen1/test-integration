"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

export type StoryCoupleHandle = { seek: (progress: number) => void };
type Point = readonly [number, number];
type Limb = readonly [Point, Point, Point, Point];
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const blend = (a: Limb, b: Limb, t: number): Limb => a.map((p, i) => [mix(p[0], b[i][0], t), mix(p[1], b[i][1], t)] as Point) as unknown as Limb;
const path = (points: Limb) => {
  const point = (p: Point) => p.map(v => v.toFixed(2)).join(" ");
  const between = (a: Point, b: Point, t: number): Point => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
  let d = `M${point(points[0])}`;
  for (let i = 1; i < 3; i++) {
    d += ` L${point(between(points[i - 1], points[i], .82))} Q${point(points[i])} ${point(between(points[i], points[i + 1], .18))}`;
  }
  return `${d} L${point(points[3])}`;
};

const curve = (points: Limb) => `M${points[0].join(" ")} C${points.slice(1).map(p => p.join(" ")).join(" ")}`;

/** These two SVG figures stay mounted for the entire story. Only their joints move. */
const StoryCouple = forwardRef<StoryCoupleHandle, { accepted: boolean; calm: boolean }>(function StoryCouple({ accepted, calm }, ref) {
  const root = useRef<SVGGElement>(null);
  const state = useRef({ progress: 0, ending: 0 });
  const paint = useRef<() => void>(() => {});
  useImperativeHandle(ref, () => ({ seek(progress) { state.current.progress = progress; paint.current(); } }), []);

  useLayoutEffect(() => {
    const group = root.current;
    if (!group) return;
    const boyBody = group.querySelector<SVGGElement>(".rig-boy-upper")!;
    const girl = group.querySelector<SVGGElement>(".girl-silhouette")!;
    const girlBody = group.querySelector<SVGGElement>(".rig-girl-upper")!;
    const boyLegs = group.querySelectorAll<SVGPathElement>(".rig-boy-leg");
    const girlLegs = group.querySelectorAll<SVGPathElement>(".rig-girl-leg");
    const boyArms = group.querySelectorAll<SVGPathElement>(".rig-boy-arm");
    const girlArms = group.querySelectorAll<SVGPathElement>(".rig-girl-arm");
    const hearts = group.querySelector<SVGGElement>(".rig-love-hearts")!;
    paint.current = () => {
      const p = calm ? 1 : state.current.progress;
      const stand = smooth((p - .265) / .085);
      const walk = clamp((p - .35) / .45);
      const kneel = smooth((p - .81) / .095);
      const ending = state.current.ending * kneel;
      const rise = smooth(ending / .2);
      const turn = smooth((ending - .23) / .43);
      const joined = smooth((ending - .12) / .13) * (1 - smooth((ending - .66) / .18));
      const hug = smooth((ending - .7) / .3);
      const angle = turn * Math.PI * 2;
      const turnWidth = Math.cos(angle);
      const knee = kneel * (1 - rise);
      const stride = Math.sin(walk * Math.PI * 16) * (1 - kneel);
      const bounce = -Math.abs(stride) * 2;
      const sit = 1 - stand;
      const boyY = sit * 34 + knee * 42 + bounce;
      const girlY = sit * 31 + bounce;
      group.setAttribute("transform", `translate(${875 + 105 * walk} 856)`);
      group.dataset.pose = hug > .99 ? "hugging" : hug > 0 ? "embracing" : turn > 0 && turn < 1 ? "twirling" : ending > .01 ? "rising" : kneel > .9 ? "kneeling" : stand < .1 ? "sitting" : walk < 1 && stand > .9 ? "walking" : "standing";
      group.dataset.progress = p.toFixed(4);
      boyBody.setAttribute("transform", `translate(0 ${boyY}) rotate(${knee * -4 + hug * 4} 0 -60)`);
      girl.setAttribute("transform", `translate(${26 + Math.sin(angle) * 8 - hug * 24} 0) scale(${.94 * turnWidth} .94) rotate(${-hug * 7} 0 -55)`);
      girlBody.setAttribute("transform", `translate(0 ${girlY})`);
      for (let i = 0; i < 2; i++) {
        const hip = i ? 7 : -6;
        const step = stride * (i ? -14 : 14);
        const standing: Limb = [[hip, -61], [hip + step * .45, -30], [hip + step, -3], [hip + step + 9, -2]];
        const seated: Limb = [[hip, -27], [hip - 26, -15], [hip - 49, -2], [hip - 40, -1]];
        const kneeling: Limb = i ? [[hip, -19], [29, -35], [35, -3], [44, -2]] : [[hip, -19], [-21, -3], [-48, -3], [-39, -2]];
        boyLegs[i].setAttribute("d", path(blend(blend(standing, seated, sit), kneeling, knee)));
        const girlHip = i ? 8 : -5;
        const girlStanding: Limb = [[girlHip, -52], [girlHip - step * .4, -25], [girlHip - step * .85, -3], [girlHip - step * .85 + 9, -2]];
        const girlSeated: Limb = [[girlHip, -21], [girlHip - 15, -10], [girlHip - 35, 1], [girlHip - 27, 2]];
        const girlTurn: Limb = i
          ? [[girlHip, -52], [12, -27], [17, -6], [23, -2]]
          : [[girlHip, -52], [-8, -28], [-4, -5], [1, -2]];
        girlLegs[i].setAttribute("d", path(blend(blend(girlStanding, girlSeated, sit), girlTurn, Math.sin(turn * Math.PI))));
      }
      const boyLeft: Limb = [[-12,-107 + boyY],[-19-stride*2,-85+boyY],[-20-stride*4,-66+boyY],[-20-stride*4,-66+boyY]];
      const boyRight: Limb = [[12,-106+boyY],[20,-84+boyY],[26,-70+boyY],[26,-70+boyY]];
      const kneelLeft: Limb = [[-12,-65],[-18,-42],[9,-23],[9,-23]];
      const kneelRight: Limb = [[12,-64],[31,-60],[47,-76],[47,-76]];
      const joinedRight: Limb = [[12,-106],[21,-132],[41,-156],[52,-157]];
      const hugLeft: Limb = [[-12,-107],[-18,-84],[24,-79],[43,-87]];
      const hugRight: Limb = [[12,-106],[30,-112],[45,-110],[46,-100]];
      boyArms[0].setAttribute("d", curve(blend(blend(boyLeft, kneelLeft, knee), hugLeft, hug)));
      boyArms[1].setAttribute("d", curve(blend(blend(blend(boyRight, kneelRight, knee), joinedRight, joined), hugRight, hug)));
      const girlLeft: Limb = [[-11,-103+girlY],[-20,-84+girlY],[-28,-75+girlY],[-28,-75+girlY]];
      const girlRight: Limb = [[13,-102+girlY],[20+stride*2,-82+girlY],[23+stride*4,-63+girlY],[23+stride*4,-63+girlY]];
      const answerHand: Limb = [[-11,-103],[-20,-88],[-6,-80],[-6,-80]];
      const joinedLeft: Limb = [[-11,-103],[-25,-123],[-12,-158],[0,-167]];
      const openRight: Limb = [[13,-102],[35,-100],[44,-87],[51,-86]];
      const embraceLeft: Limb = [[-11,-103],[-20,-115],[-34,-117],[-37,-108]];
      const embraceRight: Limb = [[13,-102],[17,-87],[-24,-86],[-38,-97]];
      girlArms[0].setAttribute("d", curve(blend(blend(blend(girlLeft, answerHand, knee), joinedLeft, joined), embraceLeft, hug)));
      girlArms[1].setAttribute("d", curve(blend(blend(girlRight, openRight, joined), embraceRight, hug)));
      hearts.style.opacity = String(hug * .45);
    };
    paint.current();
    return () => { paint.current = () => {}; };
  }, [calm]);

  useLayoutEffect(() => {
    const tween = gsap.to(state.current, { ending: accepted ? 1 : 0, duration: calm || !accepted ? 0 : 6.8, ease: "none", onUpdate: () => paint.current() });
    return () => { tween.kill(); };
  }, [accepted, calm]);

  return <g ref={root} className="story-couple" transform="translate(875 856)" fill="#090e1b" stroke="#090e1b" strokeLinecap="round" strokeLinejoin="round" data-pose="sitting">
    <g className="boy-silhouette" transform="translate(-26 0)" data-height-inches="72">
      <path className="rig-boy-leg" d="M-6 -27L-32 -15L-55 -2L-46 -1" fill="none" strokeWidth="12"/>
      <path className="rig-boy-leg" d="M7 -27L-19 -15L-42 -2L-33 -1" fill="none" strokeWidth="12"/>
      <g className="rig-boy-upper" transform="translate(0 34)">
        <path d="M-13-113q12-8 25 0l6 56h-34Z" stroke="none"/>
        <g className="boy-head" transform="translate(0 -126) scale(.75) translate(0 126)"><circle cx="0" cy="-133" r="17" stroke="none"/><path d="M-16-135q-2-19 14-20 21 0 20 18l-12-8-9 7Z" stroke="none"/></g>
      </g>
      <path className="rig-boy-arm" d="M-12 -73L-19 -51L-20 -32L-20 -32" fill="none" strokeWidth="9"/>
      <path className="rig-boy-arm" d="M12 -72L20 -50L26 -36L26 -36" fill="none" strokeWidth="9"/>
    </g>
    <g className="girl-silhouette" transform="translate(26 0) scale(.94)" data-height-inches="64">
      <path className="rig-girl-leg" d="M-5 -21L-20 -10L-40 1L-32 2" fill="none" strokeWidth="9"/>
      <path className="rig-girl-leg" d="M8 -21L-7 -10L-27 1L-19 2" fill="none" strokeWidth="9"/>
      <g className="rig-girl-upper" transform="translate(0 31)">
        <g className="girl-head" transform="translate(0 -120) scale(.75) translate(0 120)"><circle cx="0" cy="-126" r="16" stroke="none"/><path d="M-17-122q-4-27 17-25 22 0 21 25l-3 17-10-18-16-8Z" stroke="none"/></g>
        <path d="M-13-108q13-6 25 0l16 56q-26 13-50-1Z" stroke="none"/>
      </g>
      <path className="rig-girl-arm" d="M-11 -72L-20 -53L-28 -44L-28 -44" fill="none" strokeWidth="8"/>
      <path className="rig-girl-arm" d="M13 -71L20 -51L23 -32L23 -32" fill="none" strokeWidth="8"/>
    </g>
    <g className="rig-love-hearts" opacity="0" fill="none" stroke="#e5bad6" strokeWidth="1.1"><path d="M-45-192c-15-11-12-20-6-20 4 0 6 4 6 4s2-4 6-4c6 0 9 9-6 20Z"/><path d="M75-165c-9-7-8-13-4-13 3 0 4 3 4 3s1-3 4-3c4 0 5 6-4 13Z" opacity=".6"/></g>
  </g>;
});

export default StoryCouple;

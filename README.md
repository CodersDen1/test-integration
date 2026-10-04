# Ayla, under the moonlight

A mobile-first, cinematic love story built with Next.js, TypeScript, Tailwind CSS, GSAP, Three.js, and Framer Motion.

## Start locally

Requires Node.js 20.9 or newer (Node.js 22 recommended).

```sh
npm install
npm run dev
```

Open http://localhost:3000. To view it on a phone on the same Wi-Fi, use the Network URL printed by Next.js.

## The story

1. “for you, Ayla.” stays for 3 seconds with scrolling locked during the intro, then opens through an iris into moonlight and staggered typography.
2. The same moon repositions and shrinks as mountains, lake, tree, and couple enter in parallel on the same stage. Enter a continuous illustrated landscape: a couple seated beneath a tree, mountains, a still lake, moon reflections, and fireflies.
3. Scrolling turns the crescent into a full moon. Romantic quotes reveal in time with the story.
4. The couple stands and walks sideways, hand in hand. Their legs, arms, and gentle walking bounce follow scroll progress while the scenery moves at different speeds. The boy and girl are proportioned to approximately 6′0″ and 5′4″.
5. The same boy kneels beside the same girl, at the end of their walk, and asks “Ayla, will you be my girlfriend? ❤️” in a dreamy thought bubble. Her reply bubble contains two positive responses and a gentle option to take more time; a personal letter is also available.
6. Either positive answer makes him rise, guide one slow hand-held twirl, and draw her into a lasting hug. The same figures stay in the landscape as the galaxy and closing words appear.

Scrolling backward reverses the moon phase and walking story. Quote reveals finish playing even if scrolling stops, so text remains readable.

## Checks and production

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build. Stop a running server with Ctrl+C.

## Animation and accessibility

- **Three.js:** depth-based WebGL stars, GLSL nebula, pointer parallax, and a celebration burst. Mobile devices use fewer particles and a capped pixel ratio. CSS/SVG artwork remains available if WebGL cannot start.
- **GSAP / ScrollTrigger:** opening iris, character reveals, reversible moon masking, parallel scene entry, scenery movement, articulated walking, quote reveals, and the rise, twirl, and embrace ending.
- **Framer Motion:** the delayed, understated closing-copy reveal.
- Native scrolling with a sticky scene, no wheel or touch interception. Touch-friendly controls, keyboard access, a native letter dialog, reduced-motion support, and an animation pause button. Reduced-motion users get a static moonlit scene with direct access to the question.
- Fonts and artwork are local. No external image or font requests, accounts, analytics, or backend. Answers are not transmitted or saved; reloading resets the story.

## Personalize

- `src/components/moonlight-experience.tsx`: opening, letter, question, and celebration copy.
- `src/components/moonlit-landscape.tsx`: landscape illustration, couple, walking choreography, moon transformation, and four quotes.
- `src/components/cinematic-reveal.tsx`: opening timeline. The `hold` value sets the extra opening duration.
- `src/components/story-couple.tsx`: one persistent articulated pair for sitting, walking, kneeling, twirling, and embracing; heads, hair, and clothing never swap.
- `src/components/celestial-scene.tsx`: Three.js stars and nebula shaders.
- `src/app/globals.css`: responsive layouts and styling.
- `src/app/layout.tsx`: page metadata and locally bundled fonts.

The lockfile pins installed versions for reproducible installs with `npm ci`.

## Dependency audit

The production dependency audit passed with zero advisories at implementation. The full audit reports five related development-tool advisories through the ESLint Next.js plugin’s `braces` dependency. The suggested automated fix downgrades the Next.js lint configuration by two major versions, so it has not been applied. These packages are used by lint tooling, not the production page.

## Framework references

- https://nextjs.org/docs/app/getting-started/installation
- https://tailwindcss.com/docs/installation/framework-guides/nextjs
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- https://threejs.org/docs/pages/WebGLRenderer.html

Background music is an original, locally synthesized soft piano-like score. It fades in after the first tap or keyboard activation, has a header mute toggle, remembers mute preference, and pauses when the tab is hidden. No external audio services or music licenses are required.

Scrolling back out of the final chapter resets the answer and ending animation. Returning shows a fresh question, including in reduced-motion mode; the background music preference is independent.
# test-integration

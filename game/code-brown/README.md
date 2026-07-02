# CODE BROWN: a septic survival game

The browser game for **lanikpumping.com**, by **Lanik Pumping Service** ("We Take Crap From Everyone!").

Junk falls from the house toward your septic tank. **Tap the junk** (wipes, grease, paper towels, toys...) to fling it into the trash. **Never tap the 3 P's** (pee, poo, toilet paper): they belong in the tank. The tank fills no matter how well you play, because that is how septic tanks work. Survive all 6 waves, then make the only correct move: **CALL LANIK**. The Lanik truck rolls in and pumps the tank in a glorious cinematic. Overflow early and the truck still rescues you, with less glory.

Every wave ends with a real septic-care fact delivered by the Lanik Guy, the grinning thumbs-up mascot painted on the real truck: the 3 P's rule, the "flushable" wipes lie, grease fatbergs, paper towels, absorbent products, and Lanik's own rule of thumb (pump every 3 years).

## Run it locally

No build step, no dependencies. Either double-click `index.html`, or serve the repo root and open:

```
http://127.0.0.1:3000/game/code-brown/
```

Sound starts after the first tap (browser autoplay rules). Works with mouse or touch; phones in portrait get the full-bleed experience.

## Files

| File | Role |
|------|------|
| `index.html` | page shell, DOM screens, `CB` namespace bootstrap (util + saves) |
| `style.css` | UI chrome: buttons, screens, HUD, banners (Lanik brand kit) |
| `js/audio.js` | `CB.audio`: WebAudio-synthesized SFX and loops, mute |
| `js/art.js` | `CB.art`: every sprite and scene, drawn in code (no image assets) |
| `js/game.js` | `CB.game`: simulation, waves, tank fill, scoring (tuning tables at top) |
| `js/cinematics.js` | `CB.cine`: the truck rescue cinematic |
| `js/main.js` | boot, scaling, state machine, input, HUD, debug harness |

## Tuning

Everything gameplay-related lives at the top of `js/game.js`: `CONFIG` (start fill, per-item fill, `MISS_SCALE` / `PASSIVE_SCALE` master knobs), `WAVES` (counts, speeds, spawn intervals, item mixes, Lanik Guy facts), scoring constants and grade thresholds.

## Debug harness

Append `?debug=1` to the URL. An fps badge appears and `window.CBdbg` is installed:

| Call | Effect |
|------|--------|
| `CBdbg.wave(n)` | jump to wave n |
| `CBdbg.fill(pct)` | set tank fill % |
| `CBdbg.win()` | jump straight to the critical + CALL LANIK win flow |
| `CBdbg.overflow()` | set fill to 100 (overflow fires on the next played frame) |
| `CBdbg.speed(x)` | game speed multiplier (soak testing) |
| `CBdbg.autopilot(true)` | perfect bot plays the game |
| `CBdbg.noSpawn(true)` / `CBdbg.spawn(type, x)` | deterministic spawns for tap tests |
| `CBdbg.items()` / `CBdbg.state()` / `CBdbg.fps()` / `CBdbg.loops()` | inspection |
| `CBdbg.worldToScreen(x, y)` | map 480x800 world coords to screen pixels |

## Brand facts used

- Phones: 951-763-5650 (`tel:19517635650`, the end-screen call button) and 1-877-LANIK-56
- "We Take Crap From Everyone!", "Serving Riverside County & the Inland Empire", "Since 1999"
- Truck: white cab, polished steel tank, red LANIK lettering with blue swoosh, green hose (matches the real truck photo)
- Port-a-potty rentals get the end-screen cameo

## Known small limits

- If the tab is hidden mid-cinematic, looping audio stops by design and does not restart when you return (the scene continues silently).
- The Google Font (Baloo 2) needs a network connection once; offline it falls back to system fonts.

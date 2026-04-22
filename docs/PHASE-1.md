# PETRI — Phase 1 Code State (pre-pivot)

> **Purpose:** document exactly what exists in the codebase right now, before the pattern-based pivot takes effect. Use this as a reference when deciding what to keep, rewrite, or delete during the pivot implementation.

---

## Overview

Phase 1 built a complete working version of the **old** mechanic: toggle one cell per turn, advance time, empty the board on your turn to win. It runs, it's visually polished, and Gabriel tested it. The conclusion: the mechanic doesn't create meaningful play. See [VISION.md](./VISION.md) for the pivot.

**Key question when working on the pivot:** which pieces of this code survive and which get replaced? This doc answers that.

---

## File-by-file audit

### `petri-dish.tsx` — **FULL KEEP**

The shared visual component and design tokens. Everything here survives the pivot unchanged.

**What it contains:**
- `PETRI` — design tokens object (colors, borders, fonts)
- `MONO` — monospaced font stack string
- `stepConway(grid)` — generic Conway step function, works for any grid size
- `PetriDishGrid` — interactive SVG petri dish that renders any `boolean[][]`, with:
  - Circular dish background, rim tick marks every 10°, glass highlights, cast shadow
  - Cells rendered as emerald circles with glow halos and specular highlights
  - Dead cells as tiny dim dots on the agar
  - Corner labels (top: "⊹ 40x", bottom: customizable)
  - **Voronoi click detection** — every pixel inside the dish maps to the nearest cell. Solves small-tap-target problems on bigger grids.
  - Geometry scales by grid size (3x3, 4x4, 5x5, 6x6, 7x7, 8x8+)
  - Optional toggled-cell marker (dashed amber ring)

**Post-pivot changes needed:** extend to support owned cells (green vs amber cells), but the structure is perfect. Add a new prop like `ownerGrid?: (0 | 1 | null)[][]` parallel to `grid`, and render cells in the owner's color instead of the single emerald.

---

### `petri-onboarding.tsx` — **CHROME KEEPS, CONTENT REWRITES**

Current content teaches "toggle one cell, empty the board." That's obsolete. The *chrome* (layout, typography, component primitives) is reusable.

**What survives:**
- `PetriFrame` — the phone-shaped outer container with warm gradient, rounded corners on desktop
- `TopBar` — the top bar with pulsing green dot, left label, centered PETRI wordmark, right skip pill
- `StepFrame` — the locked-grid step layout (title / dish / copy / button rows) that prevents layout shift
- `DishSlot` / `CopySlot` / `PrimaryButton` — the layout atoms
- `LogoScreen` — the branded intro screen (wordmark, dish, specimen info, CTA)
- `LogoDish` — the animated beacon oscillator (Conway's rules running at 850ms/step)
- Typography scale: 11px meta, 18px titles, 16px body, 13px buttons, 68px wordmark
- Color palette and animations (fade-in, pulse)

**What gets rewritten:**
- The 5 step components (`Step1` through `Step5`) currently teach Conway's rules one at a time in the old toggle-based paradigm. Post-pivot they need to teach:
  1. What patterns are
  2. How to select one from the palette
  3. How to place it
  4. What happens when you advance time
  5. How ownership and territory scoring work

The new 5-step structure is TBD but the step frame component can host any content.

**Initial patterns defined:** `EMPTY_3`, `LONE_CELL`, `FULL_3`, `L_SHAPE`, `STANDOFF_8`, `BEACON_INITIAL`. These were used for the old teaching flow. Most can be deleted — only `BEACON_INITIAL` (for the logo dish) stays.

---

### `game-of-life.tsx` — **MOSTLY REWRITE**

The main game component. Currently implements the old toggle mechanic. Structure and styling survive, game loop gets replaced.

**What survives:**
- Onboarding gate with localStorage (`petri_onboarding_complete`)
- Phone-frame outer container styling
- Player bar structure (timer + action button on each side, top rotated)
- Status bar layout (generation / alive count / pattern label)
- Win state block + "Play Again" flow
- "Replay Tutorial" link
- All styling tokens and imports from `petri-dish.tsx`

**What gets replaced:**
- `GRID_SIZE = 8` — bump to 12 or 16 for pattern-based play
- `classifyPattern` — still useful as an analysis tool but not the primary status display anymore. Replace the "Dies in N / Stable / Looping / Extinct" label with territory score (e.g., "TERRITORY · You 12 — Them 9").
- `handleCellClick` + `toggledCell` state — gone. Replaced with pattern selection + placement logic.
- `advance` function — keep the Conway step, but also track ownership changes on births/deaths.
- Grid state type — extend from `boolean[][]` to a typed cell object `{ alive: boolean, owner: 0 | 1 | null }`.
- Player turn logic — still alternating, but now each turn is "select pattern → place → advance" instead of "toggle → advance."
- Win condition — "empty board" → "most territory after N cycles OR opponent has zero cells."

**What needs to be added (new surfaces):**
- **Pattern palette UI** — list of available patterns the current player can deploy. Each shows a mini-dish preview, the name, period (for oscillators), and cell count.
- **Pattern placement mode** — when a pattern is selected, the cursor shows a ghost preview of where the pattern will land. Click to confirm. Esc to cancel.
- **Rotation / reflection controls** — probably (needs design decision)
- **Territory counter in the status bar** — live emerald vs amber count
- **Cycle counter** — "CYCLE 03 / 12" instead of "GEN 03"
- **Turn indicator** — who's placing right now

---

### `app/page.tsx` — **NO CHANGE**

Just renders `<GameOfLife />`. Unchanged.

### `app/layout.tsx` — **NO CHANGE**

Next.js root layout. Unchanged.

### `app/globals.css` — **MINOR ADDITIONS POSSIBLE**

Currently has the default shadcn variables. Post-pivot may add CSS custom properties for owner colors if needed. Otherwise unchanged.

### `components/ui/*` — **NO CHANGE (barely used)**

shadcn components. Only `button` is imported in `game-of-life.tsx`. Can probably be removed from imports entirely post-pivot in favor of custom PETRI buttons.

---

## Dependencies and environment

- Next.js 15.2.6, React 19, TypeScript 5
- Tailwind 3.4.17 (used minimally — most styling is inline styles for precision)
- shadcn/ui components (used minimally — `Button` only)
- `lucide-react` (was used for clock icon, currently unused)
- `node_modules` is installed
- **No local git repo** — the game-of-life folder is nested inside a home-level git. Work is not version-controlled. Files exist only on disk.
- Dev server: `npx next dev --port 3333` (pnpm is NOT installed, use npm/npx)
- localStorage key for onboarding: `petri_onboarding_complete`

---

## Visual language (locked across pivot)

| Token | Value | Use |
|---|---|---|
| `bg` | `#FAFAF7` | warm off-white paper, main frame background |
| `bgFrame` | `#F0EFE9` | outer wrapper behind the phone frame |
| `dishBg` | `#F4F4EE` | inside the dish, slightly greener than bg |
| `ink` | `#0A0A0A` | primary text and borders |
| `inkSoft` | `#1A1A1A` | body copy |
| `muted` | `#57534E` | meta text (labels, status bar) — darkened for contrast |
| `mutedLight` | `#78716C` | lighter muted variant |
| `border` | `#E7E5E0` | rules, dividers, subtle borders |
| `life` | `#059669` | emerald — alive cells, Player 1 territory (post-pivot) |
| `lifeGlow` | `#05966915` | halos and glow effects |
| `amber` | `#D97706` | warm accent — toggled cell, Player 2 territory (post-pivot) |
| `warn` | `#DC2626` | low-time warnings |

**Typography:**
- All mono, `ui-monospace, "SF Mono", Monaco, Cascadia Code, Source Code Pro, Menlo, Consolas, monospace`
- Wordmark 68px/700 with 0.14em letter-spacing
- Titles 18px/700 uppercase with 0.22em letter-spacing
- Body 16px/400 with 1.55 line-height
- Meta 11px/600 uppercase with 0.18em letter-spacing
- Buttons 13px/700 uppercase with 0.26em letter-spacing

---

## Known issues in the current code

1. **`classifyPattern` loops forever guard** — uses a 2000-step budget. If bumped to a bigger grid like 16x16 with chaotic methuselahs, may need a higher budget or smarter cycle detection.
2. **Toggle swap UX** — currently clicking a different cell swaps the toggle. Works but was a band-aid on the "1 toggle per turn" mechanic. Goes away entirely in the pivot.
3. **Win state is bland** — just text + a Play Again button. The Phase 2 plan included a "SPECIMEN STERILIZED" full-frame overlay but it was never built. Post-pivot the win state needs its own design (territory score reveal, winner highlight, etc.).
4. **No sounds** — never designed, never built. Future consideration.
5. **No haptics on mobile** — future consideration.

---

## Phase 1 achievements worth preserving (visual/UX)

Things that genuinely worked and should influence future design:
1. The phone-frame outer container that converts to rounded-card on desktop
2. The warm paper background with subtle radial gradients
3. The rim tick marks on the dish (they sell the "scientific instrument" vibe)
4. The glass highlight arcs on the dish (make it feel like a real object)
5. Emerald cells with glow halos and specular highlights
6. Dead cells as tiny dim dots (beats empty squares — keeps the dish "populated" visually)
7. Corner labels ("⊹ 40x" top-left, "agar · NxN" bottom-right) — cheap storytelling
8. The animated beacon in the logo dish — shows the system is alive before the player even starts
9. Mono typography throughout (commits to the lab/terminal aesthetic)
10. Locked step layout that prevents dish-jumping between onboarding steps
11. Voronoi click detection (no dead zones, no tap-target issues)
12. The pulsing green dot next to "Petri Labs · Est MMXXVI" in the top bar — one-pixel detail that makes the whole thing feel alive

All of these carry forward.

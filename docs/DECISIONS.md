# PETRI — Decisions Log

Chronological record of Gabriel's design decisions and their reasoning. Updated as work continues. Read this when you want to understand *why* the project looks the way it does now.

---

## Session 1 — 2026-04-10 (original v0.app exploration)

**Context:** Gabriel pointed Claude at a v0.app prototype of a two-player Conway's Game of Life. Claude recognized the game, identified two problems ("design is horrible" + "min moves math feels broken"), and spawned 4 research agents in parallel to analyze design directions, onboarding, extinction math, and professional game design critique.

**Gabriel's original prompt (verbatim):**
> "this is a game i have created, can you recognize how it works?"

**Gabriel's research prompt (verbatim):**
> "i think there are two main problems with this game. first the design is horrible, it doenst look like a design made by a product designer. can you suggest some creative paths to follow? this is the first agent. the second agent will have to create an onboarding to intruduce the game. it should be a game onboarding so it should be very clear objective and teach everyone in 3 steps. the third agent needs to think about the min moves to extinction, i think it doenst work. idk i feel like the mathematics should be hyper complex. the fouth agent is the best game dev of the world and will analyse this game in professional parameters, to assess how this game is compared to chess for example. be very critic"

**Decisions made in this session:**
1. **Design direction:** PETRI (clinical lab aesthetic) — but with a **light theme** override. Clean lab paper, not dark navy.
2. **Project name:** PETRI. "i LOVE the name PETRI, its perfect. This will be the name of the project."
3. **Grid size:** 6x6 (up from 4x4)
4. **Toggle limit:** 1 cell per turn
5. **Onboarding:** 3 interactive steps, design-matched to PETRI
6. **Extinction counter:** replace the broken heuristic with exact computation
7. **Priority order:** structure/mechanics first, visual polish later

Session ended mid-implementation when Gabriel hit usage limit.

---

## Session 2 — 2026-04-10 (recovery + Phase 1 build)

**Context:** New Claude session opened in the same project directory. Gabriel asked Claude to find the previous session and summarize it. Claude recovered the full session transcript from local `.claude/projects/` logs and reconstructed the context into `PETRI-SESSION-CONTEXT.md`.

**Phase 1 built in this session:**
- Grid 4x4 → 6x6
- 1 toggle per turn with undo/swap behavior
- Exact extinction counter with chain-follow + cycle detection
- Mobile-first phone-frame layout
- PETRI design tokens and `PetriDishGrid` shared SVG component
- Custom petri dish visual: warm off-white, emerald cells with glow halos, rim tick marks, glass highlights, cast shadow, corner labels
- Logo screen + 3-step onboarding + localStorage persistence

**Visual design locked in:**
- Warm off-white paper (#FAFAF7)
- Near-black ink (#0A0A0A)
- Emerald for life (#059669)
- Amber warm accent (#D97706)
- Mono typography throughout
- Circles for cells, dots for dead agar

**Decisions made in this session:**
1. Apply the PETRI dish visual to *all* cell representations — onboarding mini-grids + main game grid. One visual language throughout.
2. The petri dish is the iconic element. Every screen features it.

---

## Session 3 — 2026-04-10 (Phase 1.5: onboarding restructure + animated logo + pivot to pattern-based)

**Context:** Gabriel tested the game on his phone, reported issues with typography, layout shift, and onboarding clarity. Also asked for an animated oscillator on the logo screen instead of a static ring pattern.

### Decisions early in this session (typography/layout)

1. **Typography bump** — raised all font sizes. 9px meta → 11px. 13px titles → 18px. 13px body → 16px. 11px buttons → 13px.
2. **Skip button redesign** — from invisible tracked-out text to a visible bordered pill.
3. **Layout stability** — locked step layout with fixed grid rows so the dish never jumps between step transitions.
4. **Onboarding: 3 steps → 5 steps** — broke the overloaded Step 2 (which tried to teach underpopulation + overpopulation + birth all at once via a blinker) into 5 focused steps: Life & Death → Isolation → Overcrowding → New Life → The Standoff.
5. **Lab narrative throughout** — replaced rulebook-speak with scientific language. "Starved. Fewer than 2 neighbors — always fatal." / "Suffocated. More than 3 neighbors — always fatal." / "New cell born. Exactly 3 neighbors creates life from nothing."
6. **Animated logo dish** — replaced the static ring pattern with a live beacon oscillator running Conway's rules at 850ms/step.
7. **Click targets on the dish** — switched from SVG hit-circle detection to **Voronoi** click detection. Any pixel inside the dish maps to its nearest cell. Solves the small-tap-target problem on bigger grids.
8. **Grid size:** 6x6 → 8x8 (per Gabriel's "make it bigger" request and Agent 4's recommendation).
9. **Game dish max width:** 360 → 420

**All 9 above were built and shipped.**

### The pivot (later in the same session)

Gabriel played the new build and said: **"idk it seems hard to play. do you know the concept of meaningful play?"**

Claude analyzed the game through Salen & Zimmerman's meaningful play framework and diagnosed both criteria failing: actions weren't discernible (humans can't simulate Conway) and weren't integrated (1 toggle per turn is a drop in the ocean of a 24-cell board). Proposed 5 fixes, recommended ghost preview + back to 6x6.

Gabriel pushed back with a sharp observation: **"if you analyze chess actions discernible, integrated it kinda fails as well right? why chess is so famous? I want to compete with chess. i want to create simple but groundbreaking."**

Claude's analysis of the chess question unlocked the real insight: chess players don't predict — they deploy. Chess has named pieces with known behaviors, named patterns (Sicilian, fork, pin), and clear intermediate goals. The current Petri had none of those.

**The unlock:** don't make players predict Conway. Make them deploy Conway. Conway's Game of Life already has a 50-year-old catalog of named patterns with documented behaviors — the Sicilian and Ruy Lopez of cellular automata. The game should give players a palette of those patterns and let them battle for territory.

**Decisions made at the pivot:**
1. **Core mechanic changes** from "toggle one cell" to **"deploy one Conway pattern from a palette"** per turn.
2. **Win condition changes** from "empty the board" to **"control the most territory after N cycles."**
3. **Cells have ownership** — deployed cells and cells born in your neighborhood are colored emerald (you) or amber (opponent).
4. **Solo mode is a first-class citizen** — daily puzzle (Wordle-like), puzzle trees, sandbox, survival, boss patterns.
5. **Positioning:** "Chess for the Wordle generation." Ambition is a strategy game that can compete with chess through simple rules, infinite depth, and Conway's pre-existing cultural vocabulary.

**Gabriel's exact words approving the direction:**
> "Ok. I like it. register that in the project archives."

### Post-pivot organizational decisions
1. Reorganize project documentation into a `docs/` folder with focused files
2. VISION.md registers the new direction as the north star
3. RESEARCH.md preserves the original 4 agent outputs
4. DECISIONS.md (this file) tracks the chronological why
5. PHASE-1.md documents what exists in code pre-pivot
6. BACKLOG.md tracks future work

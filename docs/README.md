# PETRI — Project Archive

**PETRI** is a game built on Conway's Game of Life. Currently at a crossroads between several possible shapes — see [VISION.md](./VISION.md) for the three alternatives on the table.

---

## ⚠️ PROJECT STATUS — FRAMING DECISION PENDING (paused 2026-04-10)

**Gabriel paused the project at a crossroads moment.** He was losing confidence in the "compete with chess" framing after Round 1 simulations produced mostly warning signs (defense cascades to extinction, offense is unreadable, no configuration felt clearly fun).

Claude's honest assessment (full version in VISION.md "Framing under review" section): **the chess framing is probably the wrong target**. The games that capture culture in 2026 are mostly solo/async (Wordle, Monument Valley, Balatro, Vampire Survivors), and what we've built so far has almost none of those properties. Three alternative framings are on the table:

- **Framing A — Solo Wordle-shaped daily puzzle** (Claude's recommendation)
- **Framing B — Ambient generative-art toy**
- **Framing C — Single-player Conway roguelite**

**Gabriel has NOT committed to any framing yet.** He wanted space to think.

### ▶️ When resuming — do this first

1. **Don't jump to code.** This is a framing question, not an implementation question.
2. **Read [VISION.md](./VISION.md)** — specifically the new "Framing under review" section near the top.
3. **Let Gabriel talk first.** Ask what he's been thinking. Don't pre-commit to any alternative.
4. **Preserve the valuable assets regardless of framing:** the PETRI visual identity (dish, emerald cells, mono typography) works in ALL three framings. The simulator works in ALL three. Don't touch these.
5. **If Gabriel picks a framing,** the old "Implementation path" in VISION.md needs to be rewritten for the new direction. The pattern library design work still applies regardless.
6. **If Gabriel is still uncertain,** suggest running more simulations tuned to whichever framing feels most interesting. Cheap experiments > sunk costs.

### What was built before the pause (don't lose)

- Phase 1 code: 8×8 grid, single-toggle mechanic, 5-step onboarding, PETRI dish visual (mostly superseded but visual identity is keeper)
- Simulator infrastructure (`docs/simulations/`) with 6 ran scenarios, `findings.md`, and a working Node script
- Full documentation set in `docs/` (this is your friend — read everything)

### Gabriel's state of mind at the pause

- Questioning whether "compete with chess" was the right ambition at all
- Sharp observation: "innovation doesn't live in chess"
- Low confidence, wanted to stop rather than continue designing in the wrong direction
- Right instinct — designers should pause when something feels off, not push through

---

## Original direction (superseded by the pause, kept for context)

Before the crossroads, the project was mid-pivot from "toggle one cell per turn" (Phase 1) to "deploy named Conway patterns for territory control" (pattern-based competitive game). That second pivot is what's now under review.

**Environment:**
- Project at `/Users/gabriellinares/personal/gamedev/game-of-life`
- Dev server: `npx next dev --port 3333` (pnpm is NOT installed, use npm/npx)
- No local git repo — this directory is nested inside a home-level git. Work is not version controlled. Files exist on disk only.
- Gabriel's localStorage onboarding flag: `petri_onboarding_complete` (clear it or use "Replay Tutorial" in the ready state to see onboarding again)

---

## Document map

| File | Purpose | When to read |
|---|---|---|
| [VISION.md](./VISION.md) | The pivot + new direction + strategic reasoning + open design decisions | **Always start here.** The north star. |
| [RESEARCH.md](./RESEARCH.md) | Full transcripts of the 4 research agent outputs from the original session (design directions, onboarding, extinction math, game design critique) | When you need background on why a decision was made, or to mine ideas |
| [DECISIONS.md](./DECISIONS.md) | Chronological log of Gabriel's decisions with context | When you want to understand the history of why the project looks like it does |
| [PHASE-1.md](./PHASE-1.md) | What got built in the pre-pivot phase. Which pieces of code survive the pivot, which are scrap | When you need to know the current state of the code before the pivot takes effect |
| [BACKLOG.md](./BACKLOG.md) | Organized backlog: next up, future ideas, deferred, rejected | When planning what to build next |
| [simulations/README.md](./simulations/README.md) | Paper-prototype simulator docs. How to run scenarios, notation, design goals | When designing or running playtest scenarios before writing real code |
| [simulations/outputs/](./simulations/outputs/) | Annotated markdown logs of simulated gameplay scenarios. Each one tests a specific design question and ends with a strategic analysis section | When validating design decisions with empirical evidence, or looking up what was already tested |

---

## Current code state

The codebase is **pre-pivot**. It implements the old "toggle one cell, empty the board" mechanic. The visual language (PETRI dish, emerald cells, warm off-white paper, mono typography) and the onboarding chrome are all keepers. The game loop itself is being replaced.

**Files:**
- `game-of-life.tsx` — main component. Conway state machine, 8x8 grid, 1-toggle-per-turn, extinction classifier, player bars, win states. **The game loop here will be replaced.** Visual chrome is reusable.
- `petri-onboarding.tsx` — 5-step onboarding (Life & Death, Isolation, Overcrowding, New Life, The Standoff) + animated beacon logo. **Structure is reusable, content will be rewritten** to teach pattern deployment instead of cell toggling.
- `petri-dish.tsx` — shared design tokens, `PetriDishGrid` SVG component with Voronoi click detection, `stepConway` helper. **Keep all of it.** Core visual component survives the pivot unchanged.
- `app/page.tsx` — renders `<GameOfLife />`
- `app/layout.tsx` — Next.js layout

**Visual identity (locked):**
- Warm off-white paper (`#FAFAF7`)
- Emerald for life (`#059669`) — eventually shared with Player 1
- Amber warm accent (`#D97706`) — eventually Player 2
- Near-black ink (`#0A0A0A`)
- Mono typography throughout
- Custom SVG petri dish with rim ticks, glass highlights, cast shadow, glowing cells
- Phone-shaped frame on desktop, full-screen on mobile

---

## Gabriel's working style (for future Claude sessions)

- Extremely visual. Wants to see screens before committing to code.
- Gets frustrated with over-engineered approaches. Prefers "stop, think, rewrite clean" when things break rather than iterative patching.
- Explicitly asks to avoid unnecessary refactors to save credits.
- Thinks deeply about design. Will push back on shallow answers — ask him "why" and expect a substantive reply.
- Portuguese voice mode sometimes. Replies in English.
- Treats the tool like a designer's collaborator, not a code monkey. Meet him at the design level.
- Will abandon features that aren't working even after investment. Not attached to sunk costs.

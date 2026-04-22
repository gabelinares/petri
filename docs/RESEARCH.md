# PETRI — Original Research Archive

> **Archived from:** Claude session `0a9bc73b-9642-42b1-9168-fcd7e45f9a94` (2026-04-10)
>
> These are the outputs of four research agents Claude spawned in parallel at Gabriel's request, during the very first session where this project was discovered. Preserved verbatim as reference material — some of these findings directly seeded the pivot to pattern-based territory play documented in [VISION.md](./VISION.md).
>
> **How to use this doc:** skim when you need background on *why* decisions were made, or when mining ideas for future features. Agent 4 (Game Design Critique) is especially relevant — it predicted the exact failure mode that the pivot is designed to fix.

---

## Agent 1: Creative Design Direction Audit

### Audit of the original v0.app prototype
- Single `flex-col` layout with no spatial zones. Flat vertical stack.
- Player 2's area flipped via `transform rotate-180`, no visual distinction between territories.
- Cells were 64x64px flat colored squares, zero texture, depth, or personality. Looked like a debug visualization.
- No cell-level animations. Toggling instant, generation step instant.
- Timers were inline body text with a small Lucide `<Clock>` icon. No urgency escalation, no color change, no pulse.
- No win celebration, no defeat sting, no tension ramp. Palette was default shadcn grayscale. No brand.

### Three proposed design directions

#### Direction 1: PETRI (the one Gabriel picked, with a light-theme modification)

**Concept:** Clinical lab simulation — two microbiologists racing to sterilize a petri dish.

- **Original palette:** Dark background (#0A0F14), bioluminescent green cells (#39FF14) with soft glow, warm amber active-player accent (#FFB800)
- **Gabriel's modification:** Keep the concept, invert to a light theme. Clean lab feel, off-white paper, not dark navy.
- **Typography:** Monospaced for timers/generation counts. Large timers 40–48px.
- **Grid cells:** Circles, not squares. Rounded container with subtle inner shadow. Birth = 300ms scale-from-zero + opacity. Death = shrink + fade.
- **Animations:** Horizontal scan line on generation advance. Grid pulses gently. Timer pulses red below 30s.
- **Mood:** Tense, scientific, premium. Plague Inc. meets Bloomberg Terminal.
- **Layout:** Three horizontal bands — Player 2 (rotated), Center (the dish), Player 1.
- **Inspiration:** Plague Inc., Bloomberg Terminal, Lichess, Apple TV microscope screensavers.

#### Direction 2: SLAB (brutalist board game)
- Warm off-white (#F5F0EB). Concrete gray cells with noise texture. Terracotta vs. indigo players.
- Slab serif typography. Physical press/lift animations. The entire player bar IS the button.
- Inspiration: Letterpress, Monument Valley, Swiss poster design, Chess.com mobile, Muji.

#### Direction 3: PULSE (neon arcade)
- True black, cyan grid lines, magenta vs. lime players.
- Shockwave rings, flickering death, ghost trails. Pixel font. Escalating visual tension.
- Highest viral/screenshot potential.
- Inspiration: Geometry Wars, Tron: Legacy, Tetris Effect, Exploding Kittens.

### Comparison table

| Dimension | PETRI | SLAB | PULSE |
|---|---|---|---|
| Mood | Tense, clinical, sophisticated | Tactile, architectural, calm | Electric, competitive, loud |
| Cell shape | Circles | Rounded rectangles with texture | Sharp squares |
| Animation style | Organic (grow/shrink/glow) | Physical (press/lift/wave) | Kinetic (zap/shockwave/flicker) |
| Timer treatment | Large mono, pulsing red urgency | Mechanical flip-clock | Giant LED, breathing glow |
| Player distinction | Amber accent | Terracotta vs. indigo | Magenta vs. lime |
| Shareability | Medium | Medium | High |
| Implementation effort | Medium | Medium | High |

**Gabriel chose PETRI with a light-theme override. It's locked in as the visual identity for the project.**

---

## Agent 2: Game Onboarding Design

### Philosophy
The intended "aha moment" was: player taps Advance, watches cells die/spawn, thinks "I can predict what happens next." Interactive mini-tutorial, not static screens.

### Original 3-step flow

**Step 1: "Cells Live and Die"**
- 3x3 mini-grid with pre-lit cells in an L-shape
- Teach vocabulary: alive = filled, dead = empty, you control this

**Step 2: "Predict the Future"**
- 3x3 with a blinker (3 horizontal cells)
- Neighbor count hints overlay cells, red tint on doomed cells, green glow on birth candidates
- Player taps Advance, blinker rotates
- Copy: "Lonely cells die. Crowded cells die. But if exactly 3 neighbors touch an empty space... life is born."

**Step 3: "Clear the Board to Win"**
- Full grid, both player zones visible
- Guided move, player toggles highlighted cell, presses Advance, board clears
- "Board empty. You win. Now do that before your opponent does."

### Design decisions
- Skippable via subtle top-right link
- localStorage persistence, only shown on first launch
- "How to Play" button to replay
- One player does tutorial, the other watches over their shoulder

### What happened to this in practice
Built and shipped in the first session, then restructured into 5 steps during the Phase 1.5 implementation after Gabriel's feedback that Step 2 was overloaded (tried to teach all Conway rules at once). The new 5-step flow: Life & Death → Isolation → Overcrowding → New Life → The Standoff. Each step teaches one rule. See PHASE-1.md for the current onboarding implementation.

**Post-pivot note:** The 5-step onboarding teaches "toggle cells, empty the board." Under the new pattern-based direction, this onboarding content is obsolete and will be rewritten to teach pattern deployment. The chrome (top bar, step frame, typography, locked layout regions) is reusable.

---

## Agent 3: Min Moves to Extinction — Math Analysis

### Critical finding on the original v0.app prototype
The original `calculateMinMovesToExtinction` function used `Math.ceil(activeCells / 2)`. This has **zero relationship to Conway's rules.**

### Counterexamples the agent produced
- **Estimate too high:** 4 isolated cells → estimate says 2, real answer is 1 (all die immediately)
- **Estimate too low:** Certain 5-cell patterns → estimate says 3, actually take 4–8+ generations
- **Oscillators not detected:** A blinker (period 2) will never die, but the function returns 2. The code only checked for still lifes (period 1), not period ≥ 2 oscillators. This was the most critical bug.

### Recommended solution
Exact computation is trivially feasible on small grids. For a 4x4, 2^16 = 65,536 total states — precompute the entire successor graph in under a millisecond. For 6x6 (2^36), that's too big to precompute, but chain-following from any given state is still fast (follow until cycle or extinction, usually < 1000 steps).

Algorithm:
1. Encode grid as an integer (or serialize as string for larger grids)
2. Follow the successor chain, memoizing visited states
3. Detect empty → return exact step count
4. Detect cycle → return infinity (with period label)
5. Display: "Dies in N" / "Stable pattern" / "Oscillating (period P)" / "Extinct"

### Implementation in the current codebase
`classifyPattern()` in `game-of-life.tsx` uses this exact approach — chain-following with cycle detection, 2000-step budget. Works correctly.

### Player intervention finding
With unrestricted toggling, Player 1 can always win on turn 1 by toggling all cells off. This confirmed the need for a toggle limit (which became 1-per-turn in the initial implementation). **This prediction directly led to the meaningful play failure and the pivot** — 1 toggle per turn solved the "Player 1 wins turn 1" problem but introduced a worse one (actions feel meaningless).

### Known patterns on bounded grids (reference for pattern palette design)
- **Still lifes:** Block (2x2), Beehive (3x4), Tub (3x3), Boat (3x3), Ship (3x3), Loaf (4x3), Pond (4x4)
- **Period-2 oscillators:** Blinker (1x3/3x1), Toad (2x4), Beacon (4x4)
- **Cannot exist on 4x4:** Gliders, spaceships, guns, puffers, period ≥ 3 oscillators — these all need ≥ 6x6
- **On 6x6+:** blinkers and small oscillators work cleanly, gliders crash quickly on boundaries
- **On 12x12+:** gliders can travel meaningfully, more complex dynamics emerge
- **On 20x20+:** small gliders guns can exist briefly, methuselahs like R-pentomino can run for 50+ generations before stabilizing

This catalog directly informs the pattern palette for the pivoted game.

---

## Agent 4: Professional Game Design Critique

> **This is the most important agent output.** Its findings predicted the exact failure mode that made Gabriel pivot, and its "Top 5 Mechanical Recommendations" include territory mode — which became the new direction.

### Competitive viability score: 2/10

Scale reference: Chess/Go = 10, Poker/Scrabble = 8, Connect Four = 6, Tic-Tac-Toe variants = 4, **v0.app prototype = 2**, Coin flip = 1.

### The fatal flaw
**The game is a forced win for Player 1 on move 1.** Since you can toggle any number of cells before advancing, Player 1 can always rearrange the board into a configuration that dies in one step (e.g., a single isolated cell). The initial random position is irrelevant.

### Structural problems identified
1. **No tempo/resource management** — toggling is free, no cost to any action
2. **One axis of skill** (Conway pattern knowledge) with a hard ceiling reached in minutes
3. **Flat tension curve** — game ends turn 1 under optimal play, or meanders randomly otherwise
4. **4x4 too small** for Conway's interesting emergent behaviors
5. **Random start is meaningless** — full modification allowed
6. **Stalling doesn't work** — opponent can also toggle anything
7. **Closer to Nim on complexity spectrum** than Chess

### Skill expression analysis

| Skill Axis | Relevance |
|---|---|
| Pattern Recognition | Low-Medium — recognizing dying configs is the entire game |
| Calculation / Lookahead | Minimal — no need to think ahead with full board control |
| Positional Judgment | None — no persistent position when you can reset everything |
| Psychology / Bluffing | None — perfect information, no hidden state |
| Time Management | Low — only matters if execution is slow |
| Resource Management | None — no limited resources |

### Top 5 mechanical recommendations
1. **Limit toggles to 1–2 per turn** — creates scarcity, forces real decisions
2. **Add energy/resource system** — toggle costs energy, banking creates tempo decisions. Energy regenerates when you birth a new cell.
3. **Change win condition to territory** — assign cell ownership (blue vs. red), most cells after N generations wins. Creates offense AND defense. *(This became the pivot direction.)*
4. **Increase grid to 8x8+** — unlocks real Conway dynamics (gliders, complex oscillators)
5. **Asymmetric roles** — Creator (can only birth cells) vs. Destroyer (can only kill cells) with different win conditions

### The silver lining (the quote that seeded the pivot)
> "The core concept — two players fighting over the evolution of a cellular automaton — is genuinely compelling. The physics engine (Conway's rules) acting as an unpredictable arbiter between players is a strong design seed. The game just needs constraints to force real strategy."

### Relevance to the pivot
- **Recommendation 1 was implemented** (1 toggle per turn). It fixed the "forced Player 1 win" but introduced the "meaningless guessing" problem.
- **Recommendation 3 (territory)** became the core of the new direction.
- **Recommendation 4 (bigger grid)** will happen anyway — the pattern-based game needs 12x12 or larger.
- **Recommendations 2 and 5** are deferred — potentially relevant for expansions after the core pattern-based game ships.

The critique agent was more prescient than we gave it credit for in the first session. Future sessions should trust this kind of analysis.

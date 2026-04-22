# PETRI — Backlog

Organized by **when** we should do them, not what they are. If an item has no clear "when," it's in Deferred.

---

## 🎯 Next up — the pivot implementation

These are the tasks to execute when pivoting from single-toggle to pattern-based territory play. Do them in order — each depends on the prior ones.

### Design pass (before any code)
- [ ] **Answer the open design decisions** in VISION.md:
  - Grid size for standoff mode (12, 16, or 20)
  - Pattern palette composition (which ~10 patterns)
  - Economy system (free, turn cost, energy, hand)
  - Ownership rules on mixed-parent births
  - Overlap/no-overlap placement
  - Placement constraints (enemy territory, rotation, footprint)
  - Game length (fixed cycles vs. elimination)
  - Daily puzzle format

### Core build
- [ ] **Pattern library** — typed catalog of Conway patterns as `{ name: string, cells: boolean[][], period: number, category: 'still'|'oscillator'|'spaceship'|'methuselah'|'eater', lifewikiUrl?: string, cellCount: number }`
- [ ] **Extend grid state** — from `boolean[][]` to `{ alive: boolean, owner: 0 | 1 | null }[][]` or parallel `ownerGrid`
- [ ] **Ownership-aware Conway step** — extend `stepConway` to propagate ownership on births (majority-of-parents rule)
- [ ] **`PetriDishGrid` owner colors** — render cells in emerald (P1) or amber (P2) based on owner
- [ ] **Pattern palette UI** — horizontal strip of mini-dish previews, labeled, clickable
- [ ] **Placement mode** — ghost preview of selected pattern following the cursor, click to place, Esc to cancel
- [ ] **Rotation/reflection controls** — R key rotates, F key flips (or on-screen buttons)
- [ ] **Turn system** — select pattern → place → advance, alternating between players
- [ ] **Territory score calculation + display** — live count of emerald vs amber cells
- [ ] **Win detection** — either elimination or cycle count, with winner highlight
- [ ] **Match setup** — grid size, starting palette, cycle count from a config object

### Onboarding rewrite
- [ ] **New 5-step onboarding** teaching:
  1. What a pattern is (the vocabulary)
  2. Selecting from the palette
  3. Placing with rotation
  4. Advancing time and seeing interaction
  5. Territory scoring and winning
- [ ] **Keep the existing chrome** (TopBar, StepFrame, typography, LogoDish)

### Daily puzzle MVP
- [ ] **Puzzle format spec** — "Sterilize this specimen in N moves or fewer"
- [ ] **Puzzle renderer** — same `PetriDishGrid`, with a target state or move limit display
- [ ] **Move counter + solve detection**
- [ ] **Single hardcoded puzzle** as proof of concept
- [ ] **Share result** — Wordle-style emoji grid copy to clipboard

---

## 🔮 Near future — after core pivot works

Things that become obvious or important once the core game is playable.

- [ ] **Pattern info tooltip** — click/hover a pattern in the palette to see its full description: name, period, discoverer, year, LifeWiki link, typical strategic use
- [ ] **Match history + local save** — remember recent matches, win/loss record
- [ ] **Opening catalog** — once players develop named strategies, create an in-game catalog that shows opening moves and their counters. Start empty, populate from community submissions.
- [ ] **Spectator view** — watch a replay of a completed match, step through each cycle
- [ ] **Color-blind-friendly palettes** — alternative to emerald/amber for accessibility
- [ ] **Keyboard shortcuts** — 1-8 to select pattern, R to rotate, space to advance, etc.
- [ ] **Mobile haptics** — subtle haptic tick on place, stronger on advance, success pattern on win
- [ ] **Sound design** — small ambient cellular sounds, satisfying place/advance cues, win/lose stingers (optional, opt-in)
- [ ] **Low-time urgency animation for the clock** — was planned in the old Phase 2, still relevant
- [ ] **Win state overlay** — "SPECIMEN STERILIZED" or "TERRITORY SECURED" full-frame treatment
- [ ] **Gen advance radial pulse** — visual cue each time the dish advances a cycle

---

## 🧪 Mid-term — growth & depth

Things that amplify reach or depth once the basics ship.

- [ ] **More solo modes** — puzzle trees (progression), pattern sandbox (free play), survival (methuselah containment), boss patterns (fight famous Life patterns)
- [ ] **Puzzle editor** — let users design and share their own puzzles
- [ ] **Weekly tournaments** — community-scored puzzle sets
- [ ] **Pattern unlocks** — earn new patterns through solo puzzle solves, building your palette
- [ ] **Remote multiplayer** — real-time or asynchronous play over the network
- [ ] **Pattern expansion packs** — beyond the starter palette: spaceships, guns, breeders, rakes
- [ ] **Replay export/share** — export a match as a gif or video with Conway animation
- [ ] **In-game LifeWiki integration** — link pattern names to Wikipedia-style articles about their discovery, period, behavior
- [ ] **Colorblind variants**
- [ ] **Daily puzzle archive** — browse and solve past puzzles
- [ ] **Handicap system** — skilled players can start with fewer patterns or smaller palettes
- [ ] **Time controls for competitive play** — blitz mode, long mode, correspondence

---

## 💭 Deferred — ideas from the original research that might come back

From Agent 4's "Top 5 Mechanical Recommendations" and earlier brainstorming. Not actively planned, but might surface again if the pivoted game needs more depth.

- **Energy/resource system** — each turn you gain X energy, patterns cost energy based on cell count. Can save up for big plays. Deferred because the pivot's pattern-deployment-per-turn already creates enough action economy.
- **Asymmetric roles** — Creator (can only birth) vs. Destroyer (can only kill). Interesting but diverges from the chess-symmetric ideal.
- **Blitz mode with chess clock** — the 5-minute clock from the pre-pivot build is still interesting for competitive play but not core.
- **Hand-of-patterns system** — draw 3 patterns per turn from a deck, play one. Adds luck but diverges from chess's perfect-info design.
- **Fog of war** — players see only cells near their territory. Probably bad for chess-tier competitive play.
- **Cooperative mode** — two players work together against a methuselah or a target state.

---

## 🚫 Rejected — explicitly decided against

Things that came up and were intentionally not pursued.

- **Single-cell toggling as the primary mechanic** — REJECTED at pivot. Failed the meaningful play test.
- **Dark clinical theme for PETRI** — REJECTED early. Gabriel wanted light theme. Clean lab paper, not dark navy.
- **The original v0.app layout with flipped player zones and raw body-text timers** — REJECTED in Phase 1. Replaced with proper mirrored player bars in a phone frame.
- **Tight 4x4 grid** — REJECTED early for being too small to express Conway's interesting patterns.
- **8x8 as the permanent grid size** — REJECTED at pivot. Too chaotic for single-toggle play and too small for pattern-based play. The pivoted game needs 12x12 or larger.
- **Emoji-heavy UI** — never pursued. Lab aesthetic stays clean.
- **Skip button as tracked-out 9px text** — REJECTED as inaccessible during Phase 1.5.

---

## 📝 Notes for whoever picks this up next

- **Don't start coding until the VISION design decisions are answered.** Half-answered design becomes garbage code.
- **Pattern library is the first real task** once design is locked. Everything else depends on it.
- **Resist the urge to add animations and polish before the mechanic works.** The old build had great polish and a broken mechanic. Polish second.
- **Test early with actual two-human play, even with mock patterns.** The "is this fun?" question can't be answered from code quality — only from playtesting.
- **Conway's pattern catalog is your biggest cheat code.** LifeWiki has everything. Copy patterns directly from the wiki rather than designing your own.

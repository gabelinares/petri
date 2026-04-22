# PETRI — Vision

> **The north star.** If a future session reads only one document, read this one.
>
> ⚠️ **As of 2026-04-10 this document is partially under review.** Gabriel paused the project at a framing crossroads. The "compete with chess" framing below is being questioned. Read the "Framing under review" section below BEFORE treating the rest of this document as current.

---

## ⚠️ FRAMING UNDER REVIEW (2026-04-10 pause)

Gabriel paused the project after the first round of simulations produced mostly warning signs and no clear "this is fun" configuration. His exact words: _"we are thinking a lot about chess. but that's not where innovation lives idk. i feeling i'm losing a little the confidence."_

He's right to question. This section documents the three alternative framings that surfaced during that conversation. **No decision has been made.** Gabriel will come back to this when he's ready.

### The chess framing concern

The original vision below (written earlier on 2026-04-10) positions PETRI as "chess for the Wordle generation" — a simple-but-infinite strategy game with a head-to-head competitive mode. Problem: the games that capture 2026 culture are mostly NOT chess-shaped.

Look at the last decade of breakout hits: Wordle, Monument Valley, Tetris resurgences, Vampire Survivors, Balatro, Baba is You, Among Us. Most are:
- **Single-player or async** (no multiplayer cold-start problem)
- **Daily or run-based engagement loop** (repeatable, not event-based)
- **Shareable moments** (screenshots, streaks, scores)
- **Distinctive novel mechanic** (not "better version of X")
- **30-second onboarding** (playing within 30 seconds of install)

The PETRI current direction (pattern-based multiplayer strategy) has almost none of these properties. It's 2008-era design ambition entering 2026 culture. That's a 1-in-10,000 bet on its own merits — and we'd be competing against chess, which has a 1500-year institutional moat.

### What's still valuable (in any framing)

Independently of which direction wins, these assets survive:

- **The PETRI visual identity.** Warm off-white dish, emerald cells with glow halos, rim tick marks, glass highlights, mono typography. Iconic, screenshot-ready, photogenic. Works in any framing.
- **Conway's pattern vocabulary.** 50 years of LifeWiki documentation. Named patterns with known behaviors. This is a unique asset for puzzle design, not just strategy.
- **The simulator tooling** (`docs/simulations/sim.js`). Lets us validate any direction cheaply without writing game code.
- **Gabriel's meaningful play instinct.** Already caught this before too much was invested. Trust it.

### Three alternative framings on the table

#### Framing A — **Solo daily puzzle** (Wordle-shaped) ⭐ Claude's recommendation

**Positioning:** "The Wordle of Conway's Game of Life."

**Core loop:**
- One daily puzzle globally. Same puzzle for everyone.
- Format: "Starting specimen → reach target state in ≤ N moves. Each move = toggle one cell OR deploy one pattern, then advance time."
- Score by moves + time. Share your result as an emoji grid.
- Streak tracking. Monthly leaderboards. Archive of past puzzles.

**Why it might work:**
- Wordle proved the format can go zero-to-viral with no multiplayer
- Conway already has the puzzle-catalog infrastructure (LifeWiki)
- The dish visual is made for social sharing
- Launches without multiplayer cold-start
- Preserves room for competitive mode as an expansion later

**What would change:** no head-to-head mode (yet), no player turns, no territory scoring. Single-player puzzle framing. The simulator stays. The visual identity stays. The Conway pattern library design still applies.

**Cons:** Feels "less ambitious" than chess-competitor framing, even though puzzle games can and do become cultural hits (Monument Valley grossed $14M).

#### Framing B — **Ambient generative-art toy**

**Positioning:** "An aquarium of cellular life. Interact when you want. Watch when you don't."

**Core loop:**
- Open the app. See a beautiful evolving dish. Drop in patterns. Watch them interact. Save cool configurations. Share them.
- No win/lose state. Maybe daily challenges as a side mode.
- Product = looking at it and making beautiful things with it.

**Why it might work:**
- Taps into the "Conway is mesmerizing" YouTube appeal
- Low friction, open-and-play
- Social virality through beautiful screenshots/videos
- Real market for tasteful ambient mobile apps (Calm-adjacent)

**Cons:** Monetization is harder without a game layer. Risk of being "just a toy."

#### Framing C — **Single-player Conway roguelite** (Balatro-shaped)

**Positioning:** "Deckbuilder meets Conway's Game of Life."

**Core loop:**
- Each run, you face progressively harder challenges (contain this methuselah, sterilize this specimen in 6 moves, hold off this glider gun for 10 cycles)
- You have a "hand" of Conway patterns. Play them strategically.
- Between runs, unlock new patterns, modify them, build synergies.
- Every run different because Conway chaos is non-repeating.

**Why it might work:**
- Roguelite is the hottest solo genre right now
- Conway's chaos is perfect for "every run different"
- No multiplayer cold-start
- Meta-progression creates long engagement

**Cons:** Most scope of the three. Requires run structure, unlocks, balance, meta-progression.

### What Round 1 simulations really showed (re-read through the framing lens)

Every "broken" finding from the simulations is actually a puzzle-game feature when reframed:

- **Defense-only extinction cascade** → "Puzzle: can you place 4 still lifes that don't cascade?" A legit puzzle prompt.
- **Offense bias** → Not a problem if there's no second player. Aggressive patterns are just strong tools in a puzzle toolkit.
- **Tiny-grid mechanical collapse** → "Solve this 8×8 puzzle in 3 moves" is the natural tutorial format.
- **Baseline wasn't actually fun** → Without a human opponent creating drama, strategy games feel like spreadsheets. Puzzle games don't need opponents to feel meaningful.

The simulation round didn't fail. It succeeded at telling us the multiplayer strategy direction doesn't work, AND it accidentally validated that the mechanics work as puzzles.

### The decision Gabriel needs to make when he returns

Not "should we pivot?" — the real questions:

1. **What's the ambition?** Viral daily puzzle? Beautiful ambient toy? Roguelite? Multiplayer strategy game for a small passionate audience? All are valid but they're different products.
2. **What does success look like?** A thing you use yourself? A thing 1,000 people play? A thing that goes cultural? Target shapes design.
3. **Drop chess framing entirely?** Or is "compete with chess" load-bearing to your motivation even if it's bad strategy?
4. **How attached to two-player?** Original v0.app prototype was two-player. Cute, but not 2026's primary interaction mode.

**Claude's honest recommendation:** Framing A. Lowest cost to validate, highest ceiling if it hits, preserves all valuable assets, doesn't close doors (multiplayer can be added later). But this is Gabriel's call.

---

## Original vision (pre-pause, kept for context)

Everything below was written during the "compete with chess" framing phase. It's kept for historical reference but is partially superseded by the framing review above. Read with that context.

---

## The pivot (2026-04-10)

### What we were building
A competitive two-player game where each turn you **toggle a single cell** on a shared grid, then hit "Advance" to apply one step of Conway's rules. Win condition: the board is empty on your turn.

### Why it wasn't working
When Gabriel played it, he said: "it seems hard to play." When analyzed through Salen & Zimmerman's **meaningful play** framework (*Rules of Play*, 2003), both criteria were failing:

- **Discernible** — the player can perceive what their action did. Toggling a cell and hitting Advance on an 8x8 board of evolving Conway chaos is cognitively impossible. Humans can't mentally simulate Conway's rules for 20+ cells. The player was guessing, not playing. Every move felt like pulling a slot machine lever.
- **Integrated** — the action matters to the larger outcome. With 1 toggle per turn on a 24-alive-cell board, a single toggle barely moves the needle toward "empty the board." The win condition was too distant. Individual moves felt like drops in an ocean. No visible progress.

The system was doing most of the work. The player was a spectator with a minor perturbation button.

### The chess question that unlocked everything
Gabriel pointed out: "if you analyze chess for discernible and integrated, it kinda fails too. Why is chess so famous?"

He's right. Chess beginners can't see 8 moves ahead either. A beginner moves a pawn and has no idea if it was good. So why does chess work?

**Chess has meaningful play for those who understand the system. The meaningfulness is earned through learning.** And crucially, chess is *designed so that learning is possible*:

1. Perfect information + deterministic rules. No hidden state, no randomness. You can study.
2. **Known pieces with known behaviors.** A knight moves in an L. A rook moves in lines. Players don't predict physics — they manipulate known objects.
3. **Named patterns.** Sicilian, Ruy Lopez, fork, pin, skewer, fianchetto. A vocabulary for talking about positions. Handles on otherwise impossible complexity.
4. **Clear intermediate goals.** Piece count, center control, king safety, pawn structure. Sub-objectives that give individual moves meaning.
5. **Spectator-friendly.** You can watch and broadly understand.

Current Petri had perfect information and deterministic rules, but **no named pieces, no intermediate goals, no vocabulary.** The player was toggling raw cells, which is equivalent to playing chess by teleporting pawns one cell at a time, one per turn.

### The unlock
**Don't make players predict Conway. Make them deploy Conway.**

Chess players don't actually predict — they deploy. They think in patterns: "I'll fianchetto my bishop." "I'll pin his knight." They manipulate known objects with known behaviors.

Petri should work the same way. Instead of toggling a raw cell, the player deploys a **pattern** from a shared catalog. Each pattern is a named Conway object with documented behavior:

- **Block** — a 4-cell square that never moves. Your immortal fortress.
- **Blinker** — 3 cells that flip every turn. Rhythm.
- **Beacon** — 8 cells that pulse period-2. Territory marker.
- **Glider** — 5 cells that travel diagonally across the dish. Your long-range attacker.
- **R-pentomino** — 5 cells that explode into chaos for 1000+ steps. Your wildcard.
- **Eater** — a specific still life that destroys incoming gliders. Your defense.
- **Loaf, Boat, Tub** — stable 3-5 cell life forms. Cheap territory claims.
- **Toad** — period-2 oscillator. More elaborate rhythm.

Now the game is chess-like. A small palette of named, known tools. You deploy them. They interact with your opponent's deployments. The board state is chaotic, but the **pieces are legible**.

### The cultural gift
Conway's Game of Life already has one of the richest pattern vocabularies in mathematics. Fifty-plus years of enthusiasts have cataloged patterns, named them, documented their periods, categorized their interactions, and built the LifeWiki with thousands of entries. Glider, pulsar, pentadecathlon, Cordership, breeder, switch engine, queen bee, lightweight spaceship, schick engine.

**These are our Sicilian and Ruy Lopez.** They already exist. They already have names. They already have documented behaviors. Every pattern has a Wikipedia-grade article. We don't need to invent a vocabulary — we need to *surface* one that's been quietly waiting for 50 years.

This is a massive unfair advantage that chess didn't have for its first 1000 years.

---

## Game modes

### Two-player: THE STANDOFF (the chess mode)

**Rules sketch:**

- Shared petri dish, fixed size (grid size TBD — likely 12x12 to 16x16 to allow room for patterns to interact)
- Each player has a palette of Conway patterns to choose from
- On your turn:
  1. Select a pattern from your palette
  2. Place it in any empty region of the dish (rotations/reflections allowed)
  3. Hit **Advance Time** — one Conway step is applied to the whole dish
- Cells you deploy and cells born from your neighborhood belong to you (colored emerald)
- Opponent's cells are amber
- When a cell is born from mixed neighbors: majority rule, ties → neutral
- Game ends after N cycles (e.g., 12) OR when one player has zero cells
- **Winner:** most cells on the dish when the game ends

**Strategic depth this creates:**
- Defensive play: blocks and beehives secure quiet corners
- Offensive play: gliders fly across the board into enemy territory
- Tempo play: oscillators generate color every turn, contributing to your count
- Disruption: R-pentominos thrown into enemy clusters spray chaos
- Counterplay: eaters placed in advance to catch incoming gliders
- Economy decisions: save turns for big patterns, or spam small ones

Every line above is a strategy someone could write an article about. Every line has a Conway-canonical name.

### Solo: DAILY PUZZLE (the Wordle mode)

One puzzle per day. Same puzzle for everyone. Shareable result.

**Format example:** "Sterilize this specimen in 5 moves or fewer." You see a starting pattern. You can place patterns, toggle cells, or advance time. Solve it. Compare your solve count and time to the global leaderboard. Share emojis showing your solve pattern (Wordle-style).

This is the viral growth engine. A daily puzzle + shareable result is the single best distribution model for puzzle games in the last 5 years.

### Solo: PUZZLE TREES

Hand-designed puzzle sets ordered by difficulty. Like chess endgame books or a Zachtronics game.

Examples:
- "Sterilize this R-pentomino in 8 moves or fewer"
- "Contain this glider before it reaches the corner"
- "Build a Gosper glider gun using only these 10 pieces in 12 turns"
- "Convert this chaotic seed into a stable still life"

Progression creates mastery. Unlock advanced puzzles by clearing earlier ones.

### Solo: PATTERN SANDBOX

Free-play mode. No opponent, no goal. Deploy things, watch them interact, step time forward. Learning tool. Every pattern deployment shows the Wikipedia name + period + history.

### Solo: SURVIVAL

A methuselah is seeded into the dish. Your job: prevent extinction (or force it) within N turns. Limited toggle/pattern budget. Creates a roguelike energy.

### Solo: BOSS PATTERNS

Fight a specific famous Life pattern. Can you kill an R-pentomino before it stabilizes? Can you contain a breeder within a specific region? Can you destroy a Gosper gun?

---

## Why this could compete with chess

1. **Rules complexity:** same order as chess. 4 Conway rules + pattern deployment vs. 6 chess piece types + board rules.
2. **Depth ceiling:** chess has ~10^120 possible games. Conway's Game of Life is Turing-complete — you can literally build logical computers inside it. The depth ceiling is effectively infinite.
3. **Pre-existing vocabulary:** chess took 500+ years to develop opening theory. Petri inherits 50 years of Conway cataloging on day one.
4. **Spectator-friendly:** watching colored patterns evolve and battle is visually legible. Chess took hundreds of years to figure out notation and commentary. Petri gets it for free through color.
5. **Teaching curve:** learn 3-4 patterns, you can play a casual game. Learn 12, you can play strategically. Learn 30, you're a specialist. There's no dead zone in the learning curve.
6. **Dual engagement model:** chess doesn't have a Wordle mode. Petri does. Daily puzzles + competitive play is a stronger hook than either alone.

---

## What carries over from the old build

The old single-toggle implementation is mostly reference material now, but key pieces survive:

- **PETRI visual language** (`petri-dish.tsx`): warm off-white dish, emerald cells with glow halos, rim ticks, glass highlights, mono typography. **Keep all of it.** The visual identity is locked in and perfect for the new direction.
- **Phone-shaped frame + mobile-first layout:** reuse as-is.
- **Conway step function** (`stepConway` in petri-dish.tsx): reuse directly.
- **Onboarding pattern** (top bar, step frame, typography, skip pill): reuse the chrome, replace the content to teach pattern deployment instead of cell toggling.
- **Logo screen with animated beacon:** keep. Still the right first impression.

What needs to be thrown out:
- 1-toggle-per-turn mechanic
- "Empty the board" win condition
- 8x8 grid size (too small for pattern-based play)
- The entire "predict Conway chaos" cognitive loop

---

## Empirical findings from paper-prototyping

As of 2026-04-10, we built a cheap Node-script simulator (`docs/simulations/sim.js`) that runs full scenarios and outputs annotated markdown logs. Running the first scenario already produced one **locked design decision**:

### ✅ Ghost preview of post-Advance state is NOT optional

**Evidence:** Scenario `01-first-interaction` had P1 place a block, then a second block adjacent to the first, trying to build a defensive wall. In Conway's rules, two touching blocks form an unstable 7-cell shape that collapses entirely in ~4 generations. P1 lost their entire territory on turn 2 for reasons they could not perceive.

**Implication:** Without a ghost preview that shows the player what the board will look like *after* Advance is pressed, beginners will lose games to their own moves and never understand why. The pivot direction is pedagogically brutal without preview.

**Decision locked:** Every placement action in the real game must show a live ghost overlay of the post-Advance state as the player positions a pattern. This is the core mechanism that converts Conway's chaotic physics into human-reasonable strategy. Equivalent to chess showing "this move would put you in check" before committing.

### ✅ `advanceSteps = 4` is the right default

**Evidence:** With 1 Conway step per turn, gliders barely move (they take 4 turns to shift 1 diagonal cell). With 4 steps per turn, gliders shift exactly 1 cell per turn, creating responsive traveling patterns while still letting still lifes stay stable. Tested in scenario 01 and confirmed in Round 1 comparison (scenarios 02-06). Scenario 05 proved that advance=8 produces cell-count swings too large for humans to read.

**Decision locked:** Each PETRI "advance time" action = 4 Conway generations. Solo-mode puzzles and competitive matches both use this default. Scenarios may override for specific tests.

### ✅ Grid size: 12×12 for the standoff mode

**Evidence:** Round 1 simulations (scenarios 02-06) compared 8×8, 12×12, and 20×20. Results:
- **8×8** (scenario 03): player eliminated by turn 5 due to overcrowding. Not enough room for patterns to exist without interfering.
- **20×20** (scenario 04): first 4 turns dead-boring (patterns too far apart), then runaway explosion. Uneven pacing. One player snowballed to 34 vs 7.
- **12×12** (scenario 02 baseline): genuine momentum swings, both players led at different points, final was decisive but not a rout.

**Decision locked:** **12×12 is the canonical grid size for standoff mode.** Smaller grids may work for solo puzzles where constraints are the point. Larger grids may work for tournament formats with extended turn counts and more pattern variety.

### ✅ Palette must be mixed (one defensive + one mobile pattern minimum)

**Evidence:** Scenarios 05 (offense-only) and 06 (defense-only) both produced unplayable results:
- **Offense-only (05):** huge cell-count swings, big R-pentomino explosions, visually exciting but cognitively unreadable. Not strategic.
- **Defense-only (06):** **both players went extinct by turn 7.** The cascade from closely-placed still lifes eliminated all territory on both sides. The "safe" strategy is the losing strategy.

**Decision locked:** Every standoff palette must include at least one still life AND at least one spaceship/methuselah. Pure defense is catastrophic. Pure offense is unreadable. Balance is required at the palette level, not just in player choice.

### 🚨 Open risk: possible systematic offense bias

**Observation:** Across all 5 Round 1 scenarios, Player 1 (playing defensive-leaning) lost every match. Margins ranged from -4 (close) to -27 (rout) to -12 (wipeout) to 0 (mutual extinction).

**Hypothesis:** Aggressive mobile patterns may systematically beat static defensive patterns in Conway-based territory play. If true, the game has an offense bias that breaks balance.

**Next action:** Run scenario 07 with reversed strategies (P1 aggressive, P2 defensive) to isolate the effect. If P2 wins again, it's player-choice-invariant and we have a balance problem. If P1 wins, the issue was scenario design, not game balance.

---

## Open design decisions (next working session starts here)

These need answers before code can resume:

### 1. Grid size for the standoff mode
The dish needs to be big enough for patterns to not immediately crash into each other. Candidates:
- **12x12** — intimate, patterns interact quickly, games are short
- **16x16** — room for gliders to travel, more strategic
- **20x20** — full breathing room, longer games, more chess-like

### 2. Pattern palette composition
Which patterns make it into the starter palette? Candidate list (need to pick ~10):

**Still lifes:** Block, Beehive, Loaf, Boat, Tub, Ship
**Oscillators (period 2):** Blinker, Toad, Beacon
**Oscillators (period 3):** Pulsar (needs 13x13)
**Spaceships:** Glider, Lightweight spaceship (LWSS)
**Methuselahs:** R-pentomino, Diehard, Acorn
**Eaters:** Eater 1 (fishhook)
**Guns:** Gosper glider gun (probably too big for starter palette)

Good starter: Block, Blinker, Beehive, Toad, Beacon, Glider, Eater, R-pentomino. Eight patterns. Mix of defensive, offensive, oscillating, chaotic.

### 3. Economy system
Options:
- **Free deployment** — deploy any pattern every turn. Simple but may create runaway advantages.
- **Turn cost** — some patterns take 2 turns to deploy (e.g., Gosper gun). Creates tempo decisions.
- **Energy system** — each turn you gain X energy, patterns cost energy based on cell count. Can save up for big plays. More strategic depth but more UI.
- **Hand system** — you draw 3 patterns each turn from your palette, play one. Adds luck/variety.

### 4. Ownership rules
When a new cell is born from Conway rules, whose is it?
- **Majority-of-parents:** if 2+ of its 3 neighbors are green → green. Natural but creates weird edge cases on ties.
- **Last-mover:** whoever hit Advance owns all new births that turn. Simpler but feels arbitrary.
- **Neutral births:** new cells are always white/neutral. Only the original deployment colors count.

Likely answer: **majority-of-parents, ties → neutral white**. Feels organic.

### 5. Can you place on top of existing cells?
- **No:** must place in empty regions. Keeps play clean.
- **Yes, destructive:** placing a pattern kills whatever was there. More aggressive play.
- **Yes, additive:** placing a pattern ORs your cells with the existing board. Complex but interesting.

Likely answer: **no overlap.** Simplest rule, forces spatial strategy.

### 6. Placement constraints
- Can you place in enemy territory?
- Rotation/reflection allowed?
- Is there a "footprint" around patterns they need clear?

### 7. Game length
- Fixed number of cycles (12? 20? 30?)
- Or: until one player has zero cells
- Or: until board is full/stable

### 8. Daily puzzle format
- Same puzzle for everyone globally
- What's the puzzle type? "Sterilize in N moves" is the cleanest starting format.
- How to share results (Wordle-style emoji grid)

---

## Implementation path (when work resumes)

1. **Design decisions** (above) — answer them, write the spec
2. **Pattern library** — build a typed catalog of Conway patterns as `boolean[][]` shapes with names, periods, and cell counts
3. **Placement UI** — select pattern from palette, preview ghost at cursor, confirm placement
4. **Ownership tracking** — extend grid state from `boolean` to `{ alive: boolean, owner: 0 | 1 | null }`
5. **Color rendering** — update `PetriDishGrid` to show owner colors
6. **Two-player loop** — turn order, pattern selection, placement, advance, win detection
7. **Tutorial replacement** — rewrite the 5-step onboarding to teach pattern deployment (the existing structure is reusable, only content changes)
8. **Single daily puzzle prototype** — simplest possible version, proves the format
9. **Playtesting + iteration**
10. **Additional solo modes** — puzzle trees, sandbox, survival, bosses

---

## The pitch (one paragraph, memorized)

> **PETRI.** A two-player cellular standoff and daily puzzle game built on Conway's Game of Life. Each turn, deploy one named Conway pattern from your palette into a shared petri dish. Time advances. Your cells spread, your opponent's resist, patterns collide in the emergent chaos of life. After 12 cycles, whoever owns the most territory wins the experiment. Every pattern has a name. Every interaction has been cataloged. Fifty years of Conway enthusiasts have already written the strategy guide — we just built the game around it. Simple rules. Infinite depth. Chess for the Wordle generation.

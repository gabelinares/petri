# PETRI — Paper-prototype simulator

> **Purpose:** validate the pattern-based game design before writing any real code. Simulate scenarios cheaply, record them as readable markdown, and answer "would this be fun?" without building the game.

## Design principle

**Computation is cheap, LLM reasoning is expensive.** So we split labor:

- **Node script (`sim.js`)** does all the Conway computation, ownership propagation, board rendering, and markdown output. Deterministic, fast, free.
- **LLM (Claude)** only reads the final markdown log and annotates it with feel notes, decision-time estimates, and design verdicts. Expensive work concentrated where it's actually valuable.

A full 20-turn scenario on a 16×16 board takes the script under 10ms. Claude only sees the final document and writes ~500 words of analysis. Compare to having Claude compute every Conway step by hand — that would cost 100× the credits and probably contain errors.

## How to run

```bash
node docs/simulations/sim.js docs/simulations/scenarios/01-first-interaction.json
```

The script reads the scenario JSON, runs the simulation, and writes a markdown log to `docs/simulations/outputs/01-first-interaction.md`. You can override the output path with a second argument.

No dependencies. Pure Node.js, no npm install needed.

## Notation

### Board state

Extended LifeWiki plaintext. Every board is rendered as a grid of characters:

```
   0123456789
 0 ..........
 1 .XX.......
 2 .XX.......
 3 ..........
 4 .......YY.
 5 .......YY.
 6 ..........
```

- `.` dead (empty agar)
- `X` Player 1 (emerald in-game)
- `Y` Player 2 (amber in-game)
- `*` neutral (contested birth, no owner)

Row and column numbers are included for easy annotation.

### Coordinates

`(row, col)` with `(0, 0)` at the top-left. A pattern placed at `(3, 5)` has its top-left cell at row 3, column 5.

### Patterns available

See `PATTERNS` at the top of `sim.js`. Current library:

**Still lifes:** `Block`, `Beehive`, `Loaf`, `Boat`, `Tub`
**Period-2 oscillators:** `BlinkerH`, `BlinkerV`, `Toad`, `Beacon`
**Spaceships:** `GliderSE`, `GliderSW`, `GliderNE`, `GliderNW`
**Methuselahs:** `RPent`, `Diehard`, `Acorn`
**Eaters:** `Eater`

Patterns can be rotated 90°/180°/270° and flipped via `rotation` and `flip` in the scenario JSON.

## Scenario format

A scenario is a JSON file with:

```json
{
  "meta": {
    "name": "Scenario name",
    "description": "What this scenario tests in one sentence.",
    "palette": ["Block", "Glider", "Eater"],
    "rules": "Optional notes on rules being tested",
    "questions": [
      "Design question this scenario targets",
      "Another one"
    ]
  },
  "size": 12,
  "advanceSteps": 4,
  "moves": [
    [
      { "type": "place", "player": 1, "pattern": "Block", "row": 5, "col": 5, "note": "optional move note" },
      { "type": "place", "player": 2, "pattern": "GliderSE", "row": 0, "col": 0 },
      { "type": "advance" }
    ],
    [
      { "type": "advance", "steps": 8, "note": "fast-forward 8 Conway steps" }
    ]
  ]
}
```

- `size` is a square grid shortcut (or use `rows` + `cols` for non-square)
- `advanceSteps` is the default number of Conway steps applied per `advance` action (can be overridden per-action)
- `moves` is an array of turns. Each turn is an array of actions (`place` or `advance`).
- `note` on any action is optional — it's rendered in the output markdown as a blockquote above the board state.
- `rotation` on a `place` action: 0/1/2/3 = 0°/90°/180°/270°
- `flip` on a `place` action: boolean, flips horizontally before rotating

### Why `advanceSteps`?

Conway's glider moves 1 cell diagonally per **4 generations**. If each PETRI turn only applies 1 Conway step, gliders barely move and the game feels static. Setting `advanceSteps: 4` means each turn, a glider moves 1 full cell — responsive pace.

Different scenarios may want different advance rates to test what feels right.

## Ownership rules (implemented)

When a new cell is born (exactly 3 alive neighbors):
1. Count parents by owner: `p1Count`, `p2Count` (neutral parents don't contribute to ownership).
2. If `p1Count > p2Count` → new cell is P1.
3. If `p2Count > p1Count` → new cell is P2.
4. Otherwise → neutral.

This is the "majority-of-parents" rule from `VISION.md` with ties going to neutral.

Surviving cells keep their current owner.

## What's in this folder

```
docs/simulations/
├── README.md              — this file
├── sim.js                 — the simulator (~400 lines, zero deps)
├── template.json          — blank scenario template to copy
├── scenarios/             — hand-written scenarios
│   └── 01-*.json
└── outputs/               — auto-generated markdown logs
    └── 01-*.md
```

## Analysis workflow

1. Decide which design question to test (see VISION.md → "Open design decisions")
2. Write a scenario JSON that isolates that question
3. Run `node sim.js scenarios/XX.json`
4. Read the output markdown
5. At the bottom of the output there's a `## Strategic analysis` section with TODO placeholders — fill it in with feel notes, decision-time estimates, and a verdict
6. Aggregate findings across scenarios in a `findings.md` (not created yet; will exist once we have a few scenarios to compare)

## What this is NOT

- Not a playable game — there's no UI, no turns taken by humans, no win detection in the sim itself
- Not a deep engine — it doesn't do minimax, pattern recognition, or AI play
- Not the final ownership rule — the "majority-of-parents" rule is the current guess. If scenarios show it feels wrong, we change it and re-run
- Not a replacement for real playtesting — but it's fast feedback at design time before code time

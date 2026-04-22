# Puzzle 02 — Catch the Glider

> SOLO PUZZLE. A Glider is traveling SE across the dish. Goal: destroy it in 1 move using the Eater. Teaches that named Conway patterns have known behaviors — the Eater is the specific tool for this job.

## Setup

- **Grid:** 10 × 10
- **Palette:** Eater
- **Advance steps per turn:** 4
- **Rules:** Solo mode. Prompt: 'Destroy the glider in 1 move.' Win check: 0 live cells from the glider, only eater remains stable.

### Design questions this scenario tests

- Does the eater actually consume the glider at this placement?
- Does the 'name the tool' moment land?
- Is the geometry obvious enough via ghost preview?


---

## Legend

- `.` dead (empty agar)
- `X` Player 1
- `Y` Player 2
- `*` neutral (contested birth)

---

## Initial state

```
   0123456789
 0 ..........
 1 ..X.......
 2 ...X......
 3 .XXX......
 4 ..........
 5 ..........
 6 ..........
 7 ..........
 8 ..........
 9 ..........
```
**Counts** · P1: **5** · P2: **0** · Neutral: 0 · Total: 5

### T1 — P2 plays `Eater` @ (6,6)

> Player places Eater in the glider's path, far enough that they don't overlap at t=0. The fishhook notch at (7,7) should catch the incoming glider.

```
   0123456789
 0 ..........
 1 ..X.......
 2 ...X......
 3 .XXX......
 4 ..........
 5 ..........
 6 ......YY..
 7 ......Y...
 8 .......YYY
 9 .........Y
```
**Counts** · P1: **5** · P2: **7** · Neutral: 0 · Total: 12

#### ⇢ T1 — Advance (4 Conway steps)

> Turn 1. Glider advances 1 diagonal cell.

```
   0123456789
 0 ..........
 1 ..........
 2 ...X......
 3 ....X.....
 4 ..XXX.....
 5 ..........
 6 ......YY..
 7 ......Y...
 8 .......YYY
 9 .........Y
```
**Counts** · P1: **5** · P2: **7** · Neutral: 0 · Total: 12

#### ⇢ T2 — Advance (4 Conway steps)

> Turn 2 observation. Glider continues toward eater.

```
   0123456789
 0 ..........
 1 ..........
 2 ..........
 3 ....X.....
 4 .....X....
 5 ...X......
 6 .......Y..
 7 .....Y....
 8 .......YYY
 9 .........Y
```
**Counts** · P1: **3** · P2: **6** · Neutral: 0 · Total: 9

#### ⇢ T3 — Advance (4 Conway steps)

> Expected impact.

```
   0123456789
 0 ..........
 1 ..........
 2 ..........
 3 ..........
 4 ..........
 5 ..........
 6 ..........
 7 ..........
 8 ..........
 9 ..........
```
**Counts** · P1: **0** · P2: **0** · Neutral: 0 · Total: 0

#### ⇢ T4 — Advance (4 Conway steps)

> Aftermath — let debris settle.

```
   0123456789
 0 ..........
 1 ..........
 2 ..........
 3 ..........
 4 ..........
 5 ..........
 6 ..........
 7 ..........
 8 ..........
 9 ..........
```
**Counts** · P1: **0** · P2: **0** · Neutral: 0 · Total: 0

---

## Final state

**Counts** · P1: **0** · P2: **0** · Neutral: 0 · Total: 0

**Winner by territory:** Tie

---

## Strategic analysis

_This section is for the LLM to annotate after reading the simulation output. Leave empty until analyzed._

### Feel notes

_TODO_

### Decision time per move (estimated)

_TODO_

### What worked

_TODO_

### What broke

_TODO_

### Verdict

_TODO_


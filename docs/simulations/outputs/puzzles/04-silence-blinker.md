# Puzzle 04 — Silence the Blinker

> SOLO PUZZLE. A Blinker oscillates at the center. Goal: destroy it in 1 move using a Block. Teaches that placing adjacent still lifes can kill oscillators via overcrowding.

## Setup

- **Grid:** 7 × 7
- **Palette:** Block
- **Advance steps per turn:** 4
- **Rules:** Solo mode. Prompt: 'Destroy the oscillator in 1 move.' Win check: 0 live cells at end.

### Design questions this scenario tests

- Does a Block placed adjacent to a Blinker actually sterilize it?
- Is the overcrowding cause-and-effect readable?
- Does ghost preview make the correct placement obvious?


---

## Legend

- `.` dead (empty agar)
- `X` Player 1
- `Y` Player 2
- `*` neutral (contested birth)

---

## Initial state

```
   0123456
 0 .......
 1 .......
 2 .......
 3 ..XXX..
 4 .......
 5 .......
 6 .......
```
**Counts** · P1: **3** · P2: **0** · Neutral: 0 · Total: 3

### T1 — P2 plays `Block` @ (2,2)

> Player drops a Block overlapping the left end of the blinker. placePattern skips already-alive cells, so this adds cells above and left of the blinker.

```
   0123456
 0 .......
 1 .......
 2 ..YY...
 3 ..XXX..
 4 .......
 5 .......
 6 .......
```
**Counts** · P1: **3** · P2: **2** · Neutral: 0 · Total: 5

#### ⇢ T1 — Advance (4 Conway steps)

> 4 Conway steps to let the interaction play out.

```
   0123456
 0 .......
 1 .......
 2 .......
 3 .......
 4 .......
 5 .......
 6 .......
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


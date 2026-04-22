"use client"

import { useState, useEffect, useId } from "react"
import { PETRI, MONO, PetriDishGrid, stepConway } from "./petri-dish"

interface Props {
  onComplete: () => void
}

type Screen = "logo" | "intro" | "count" | "eval" | "rules" | "colony"

// ============================================================
// Helpers
// ============================================================

function makeGrid(rows: number, cols: number): boolean[][] {
  return Array(rows).fill(null).map(() => Array(cols).fill(false))
}

function stepTorus(grid: boolean[][]): boolean[][] {
  const R = grid.length, C = grid[0].length
  return grid.map((row, r) =>
    row.map((cell, c) => {
      let n = 0
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          if (grid[((r + dr) % R + R) % R][((c + dc) % C + C) % C]) n++
        }
      return cell ? n === 2 || n === 3 : n === 3
    })
  )
}

function freshSeed(): boolean[][] {
  const R = 12, C = 12
  const g = makeGrid(R, C)
  const dr = Math.floor(Math.random() * R), dc = Math.floor(Math.random() * C)
  const set = (r: number, c: number) => { g[(r + dr) % R][(c + dc) % C] = true }
  set(0, 1); set(0, 2); set(1, 0); set(1, 1); set(2, 1)
  return g
}

// Pulsar — period-3 oscillator, 4-fold symmetry, the most beautiful standard GoL pattern
function makePulsar(): boolean[][] {
  const g: boolean[][] = Array.from({ length: 15 }, () => Array(15).fill(false))
  const s = (r: number, c: number) => { g[r + 1][c + 1] = true }
  ;[[0,3],[0,4],[0,5],[0,7],[0,8],[0,9],
    [2,0],[2,6],[2,12],[3,0],[3,6],[3,12],[4,0],[4,6],[4,12],
    [5,3],[5,4],[5,5],[5,7],[5,8],[5,9],
    [7,3],[7,4],[7,5],[7,7],[7,8],[7,9],
    [8,0],[8,6],[8,12],[9,0],[9,6],[9,12],[10,0],[10,6],[10,12],
    [11,3],[11,4],[11,5],[11,7],[11,8],[11,9],
    [12,3],[12,4],[12,5],[12,7],[12,8],[12,9],
  ].forEach(([r, c]) => s(r, c))
  return g
}

// ============================================================
// Eval board — 6x6 pattern demonstrating all four rules
//
//   F T F F F F   ← (0,1) isolated cell
//   F F F F F F
//   F T T T F F   ← cluster row 1
//   F T T T F F   ← cluster row 2
//   F F F F F F
//   F F F F F F
//
// Cells scanned in order:
//   (0,1)  n=0  → DIES     isolation
//   (2,1)  n=3  → LIVES    survival
//   (2,2)  n=5  → DIES     overcrowding
//   (1,1)  n=3  → BORN     birth (empty cell)
// ============================================================

const EVAL_BOARD: boolean[][] = (() => {
  const g = makeGrid(6, 6)
  g[0][1] = true
  g[2][1] = g[2][2] = g[2][3] = true
  g[3][1] = g[3][2] = g[3][3] = true
  return g
})()

type ScanOutcome = 'lives' | 'dies' | 'born'
type ScanPhase = 'neighbors' | 'outcome'

interface EvalCell {
  r: number; c: number; neighbors: number; outcome: ScanOutcome
  title: string
  captionN: string
  captionOutcome: string
}

const EVAL_CELLS: EvalCell[] = [
  {
    r: 0, c: 1, neighbors: 0, outcome: 'dies',
    title: "ALONE",
    captionN: "A lone cell. No neighbors anywhere near it.",
    captionOutcome: "Zero is not enough. It starves and disappears.",
  },
  {
    r: 2, c: 1, neighbors: 3, outcome: 'lives',
    title: "BALANCED",
    captionN: "Three neighbors surround it.",
    captionOutcome: "Three neighbors. Just right. It survives.",
  },
  {
    r: 2, c: 2, neighbors: 5, outcome: 'dies',
    title: "CROWDED",
    captionN: "Five neighbors packed around it.",
    captionOutcome: "Five is too many. No room. It suffocates.",
  },
  {
    r: 1, c: 1, neighbors: 3, outcome: 'born',
    title: "CREATION",
    captionN: "This space is empty. Count the cells around it.",
    captionOutcome: "Three neighbors surround the void. New life is born.",
  },
]

// ============================================================
// Eval state machine
// ============================================================

type EvalState =
  | { phase: 'intro' }
  | { phase: 'neighbors'; idx: number }
  | { phase: 'outcome'; idx: number }
  | { phase: 'done' }

// ============================================================
// Main
// ============================================================

export default function PetriOnboarding({ onComplete }: Props) {
  const [screen, setScreen] = useState<Screen>("logo")
  const go = (s: Screen) => setScreen(s)

  return (
    <PetriShell>
      {screen === "logo"    && <LogoScreen    onNext={() => go("intro")}   onSkip={onComplete} />}
      {screen === "intro"   && <IntroScreen   onNext={() => go("count")}   onSkip={onComplete} />}
      {screen === "count"   && <CountScreen   onNext={() => go("eval")}    onSkip={onComplete} />}
      {screen === "eval"    && <EvalScreen    onNext={() => go("rules")}   onSkip={onComplete} />}
      {screen === "rules"   && <RulesScreen   onNext={() => go("colony")} />}
      {screen === "colony"  && <ColonyScreen onComplete={onComplete} />}
    </PetriShell>
  )
}

// ============================================================
// Shell
// ============================================================

function PetriShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media (min-width: 640px) {
          .petri-shell { border-radius: 32px !important; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.18), 0 0 0 1px ${PETRI.border} !important; }
        }
        @keyframes petri-fade-in  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes petri-fade-up  { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes petri-pulse    { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes scan-ring-pulse { 0%,100% { opacity: 0.9; } 50% { opacity: 0.3; } }
        @keyframes pop-in { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cell-born { 0% { opacity: 0; transform: scale(0.2); } 40% { opacity: 1; transform: scale(1.3); } 70% { opacity: 0.8; transform: scale(1); } 100% { opacity: 0; transform: scale(0.2); } }
        .fade-in     { animation: petri-fade-in 0.35s ease-out; }
        .fade-up     { animation: petri-fade-up 0.5s cubic-bezier(0.16,1,0.3,1); }
        .scan-ring   { animation: scan-ring-pulse 0.75s ease-in-out infinite; }
        .pop-in      { animation: pop-in 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .fade-in-up  { animation: fade-in-up 0.4s ease-out both; }
      `}</style>
      <div style={{ minHeight: "100dvh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: PETRI.bgFrame }}>
        <div
          className="petri-shell"
          style={{ width: "100%", maxWidth: 440, height: "100dvh", maxHeight: "min(100dvh, 900px)", background: PETRI.bg, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: MONO, color: PETRI.ink, position: "relative" }}
        >
          {children}
        </div>
      </div>
    </>
  )
}

// ============================================================
// Shared atoms
// ============================================================

function TopBar({ left, right, onSkip }: { left: React.ReactNode; right?: React.ReactNode; onSkip?: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${PETRI.border}`, minHeight: 52, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: PETRI.life, animation: "petri-pulse 2s infinite" }} />
        <span style={{ fontSize: 9, letterSpacing: "0.22em", color: PETRI.muted, textTransform: "uppercase" }}>{left}</span>
      </div>
      {right && <div>{right}</div>}
      {onSkip && (
        <button onClick={onSkip} style={{ background: "transparent", border: `1px solid ${PETRI.border}`, color: PETRI.muted, fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", cursor: "pointer", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4 }}>
          Skip
        </button>
      )}
    </div>
  )
}

function PrimaryBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{ width: "100%", padding: "19px 24px", background: disabled ? "#EDEBE5" : PETRI.ink, color: disabled ? PETRI.muted : PETRI.bg, border: "none", fontSize: 15, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: MONO, transition: "background 0.15s", flexShrink: 0 }}
    >
      {children}
    </button>
  )
}


// ============================================================
// Arc Transition
// ============================================================

function ArcTransition({ num, name, copy, cta, onNext, accent = PETRI.life, dishGrid, dishColor, staticDish = false }: { num: string; name: string; copy: string; cta: string; onNext: () => void; accent?: string; dishGrid?: boolean[][]; dishColor?: string; staticDish?: boolean }) {
  return (
    <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 28px" }}>

      {/* Title */}
      <div className="fade-up" style={{ paddingTop: 28, paddingBottom: 18, borderBottom: `1px solid ${PETRI.border}` }}>
        <div style={{ fontSize: 9, letterSpacing: "0.38em", color: accent, textTransform: "uppercase", fontFamily: MONO, marginBottom: 8 }}>
          Arc {num}
        </div>
        <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: "0.04em", color: PETRI.ink, fontFamily: MONO, lineHeight: 0.92 }}>
          {name}
        </div>
      </div>

      {/* Dish — flex:1 so it fills all dead space */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 16, paddingBottom: 16 }}>
        {staticDish && dishGrid
          ? <PetriDishGrid grid={dishGrid} maxWidth={230} cellColor={dishColor} showLabels={false} />
          : <LogoDish maxWidth={230} initialGrid={dishGrid} cellColor={dishColor} />
        }
      </div>

      {/* Copy */}
      <p style={{ fontSize: 13, color: PETRI.muted, letterSpacing: "0.05em", fontFamily: MONO, margin: "0 0 24px", lineHeight: 1.75 }}>
        {copy}
      </p>

      {/* CTA */}
      <div style={{ paddingBottom: 32 }}>
        <div style={{ height: "1px", background: PETRI.border, marginBottom: 18 }} />
        <button
          onClick={onNext}
          style={{ width: "100%", padding: "17px 24px", background: PETRI.ink, color: PETRI.bg, border: "none", fontFamily: MONO, fontSize: 12, letterSpacing: "0.26em", textTransform: "uppercase", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span style={{ color: accent, fontSize: 9, letterSpacing: "0.3em" }}>NEXT</span>
          <span>{cta} →</span>
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Logo screen
// ============================================================

function LogoDish({ maxWidth = 280, initialGrid, cellColor }: { maxWidth?: number; initialGrid?: boolean[][]; cellColor?: string }) {
  const [state, setState] = useState(() => ({ grid: initialGrid ?? freshSeed(), gen: 0, bornCells: [] as [number, number][] }))
  useEffect(() => {
    const t = setInterval(() => {
      setState(prev => {
        const next = stepTorus(prev.grid)
        const alive = next.flat().filter(Boolean).length
        if (alive === 0) return { grid: freshSeed(), gen: 0, bornCells: [] }
        const born: [number, number][] = []
        next.forEach((row, r) => row.forEach((cell, c) => {
          if (cell && !prev.grid[r][c]) born.push([r, c])
        }))
        return { grid: next, gen: prev.gen + 1, bornCells: born }
      })
    }, 110)
    return () => clearInterval(t)
  }, [])
  return <PetriDishGrid grid={state.grid} maxWidth={maxWidth} bottomLabel={`gen · ${String(state.gen).padStart(3, "0")}`} cellColor={cellColor} bornCells={state.bornCells} />
}

function LogoScreen({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${PETRI.border}`, minHeight: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: PETRI.life, animation: "petri-pulse 2s infinite" }} />
          <span style={{ fontSize: 11, letterSpacing: "0.18em", color: PETRI.muted, textTransform: "uppercase" }}>Petri Labs · Est MMXXVI</span>
        </div>
        <button onClick={onSkip} style={{ background: "transparent", border: `1px solid ${PETRI.border}`, color: PETRI.muted, fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", cursor: "pointer", textTransform: "uppercase", padding: "5px 12px", borderRadius: 4 }}>Skip →</button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "36px 28px 24px", minHeight: 0 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 68, fontWeight: 700, letterSpacing: "0.14em", margin: 0, lineHeight: 0.9, color: PETRI.ink }}>PETRI</h1>
          <div style={{ width: 52, height: 1, background: PETRI.ink, margin: "16px auto" }} />
          <p style={{ fontSize: 12, letterSpacing: "0.24em", color: PETRI.muted, textTransform: "uppercase", margin: 0, fontWeight: 500 }}>a cellular puzzle game</p>
        </div>
        <LogoDish />
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1px solid ${PETRI.border}`, borderBottom: `1px solid ${PETRI.border}`, fontSize: 11, letterSpacing: "0.2em", color: PETRI.muted, textTransform: "uppercase", marginBottom: 20 }}>
            <span>Specimen · 001</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: PETRI.life }} /><span>Live Culture</span></div>
            <span>v 0.2</span>
          </div>
          <button onClick={onNext} style={{ width: "100%", padding: "18px 24px", background: PETRI.ink, color: PETRI.bg, border: "none", fontSize: 13, letterSpacing: "0.26em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span>▸</span><span>Begin Experiment</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Intro screen — narrative, dark
// ============================================================

function IntroScreen({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${PETRI.border}`, minHeight: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: PETRI.life, animation: "petri-pulse 2s infinite" }} />
          <span style={{ fontSize: 9, letterSpacing: "0.3em", color: PETRI.muted, textTransform: "uppercase" }}>Arc 01</span>
        </div>
        <button onClick={onSkip} style={{ background: "transparent", border: `1px solid ${PETRI.border}`, color: PETRI.muted, fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", cursor: "pointer", textTransform: "uppercase", padding: "4px 10px" }}>Skip</button>
      </div>

      {/* Content */}
      <div className="fade-up" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 28px" }}>

        {/* Title */}
        <div style={{ paddingTop: 28, paddingBottom: 20, borderBottom: `1px solid ${PETRI.border}` }}>
          <h1 style={{ fontSize: 52, fontWeight: 700, letterSpacing: "0.04em", color: PETRI.ink, margin: 0, fontFamily: MONO, lineHeight: 0.92 }}>
            A LIVING<br />COLONY
          </h1>
        </div>

        {/* Live colony — flex:1 so it fills all dead space */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 16, paddingBottom: 16 }}>
          <LogoDish maxWidth={210} />
        </div>

        {/* Narrative */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 16 }}>
          <p style={{ fontSize: 15, color: PETRI.ink, fontFamily: MONO, margin: 0, lineHeight: 1.55, letterSpacing: "0.02em" }}>
            Cells are born.<br />Cells die.
          </p>
          <p style={{ fontSize: 12, color: PETRI.muted, fontFamily: MONO, margin: 0, lineHeight: 1.8, letterSpacing: "0.04em" }}>
            Every generation, four rules apply to every cell simultaneously. Nothing else governs this world.
          </p>
        </div>

        {/* CTA */}
        <div style={{ paddingBottom: 32 }}>
          <div style={{ height: "1px", background: PETRI.border, marginBottom: 20 }} />
          <button
            onClick={onNext}
            style={{ width: "100%", padding: "17px 24px", background: PETRI.ink, color: PETRI.bg, border: "none", fontFamily: MONO, fontSize: 12, letterSpacing: "0.26em", textTransform: "uppercase", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ color: PETRI.life, fontSize: 9, letterSpacing: "0.3em" }}>NEXT</span>
            <span>Learn the rules →</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Count screen — what is n, tap-driven neighbor counting
// ============================================================

// 5x5 dish. Target cell: (2,2). Neighbors revealed per tap:
//   tap 1 → (1,1) appears  →  n=1
//   tap 2 → (2,3) appears  →  n=2
//   tap 3 → (3,1) appears  →  n=3 (turns green)
// All 8 surrounding positions shown as faint ghosts.

function CountDish({ count }: { count: number }) {
  const uid = useId().replace(/:/g, "")
  const CX = 120, CY = 120
  const spacing = 26, cellR = 9, haloR = 14

  // 8 neighborhood positions around (2,2) — shown as faint ghosts
  const NEIGHBORS_POS = [
    { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 },
    { r: 2, c: 1 },                  { r: 2, c: 3 },
    { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 },
  ]

  // Which of those are "live" (appear progressively)
  const LIVE_NEIGHBORS = [{ r: 1, c: 1 }, { r: 2, c: 3 }, { r: 3, c: 1 }]

  const cx = (c: number) => CX + (c - 2) * spacing
  const cy = (r: number) => CY + (r - 2) * spacing
  const nColor = count === 3 ? PETRI.life : PETRI.ink

  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 240 256" style={{ width: "min(230px, 85vw)", height: "auto", display: "block" }}>
        <defs>
          <clipPath id={`count-clip-${uid}`}><circle cx={CX} cy={CY} r="98" /></clipPath>
        </defs>

        <ellipse cx={CX} cy={230} rx="80" ry="4" fill="#00000012" />
        <circle cx={CX} cy={CY} r="100" fill={PETRI.dishBg} stroke={PETRI.ink} strokeWidth="2" />
        <circle cx={CX} cy={CY} r="92" fill="none" stroke={PETRI.ink} strokeWidth="0.8" opacity="0.25" />
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i * 10 * Math.PI) / 180
          return <line key={i} x1={CX + Math.cos(a) * 96} y1={CY + Math.sin(a) * 96} x2={CX + Math.cos(a) * 100} y2={CY + Math.sin(a) * 100} stroke={PETRI.ink} strokeWidth={i % 3 === 0 ? "1" : "0.5"} opacity={i % 3 === 0 ? "0.5" : "0.25"} />
        })}

        <g clipPath={`url(#count-clip-${uid})`}>
          {/* Ghost neighborhood positions */}
          {NEIGHBORS_POS.map(({ r, c }) => (
            <circle key={`ghost-${r}-${c}`} cx={cx(c)} cy={cy(r)} r={cellR * 0.55} fill="none" stroke={PETRI.muted} strokeWidth="1" opacity="0.2" strokeDasharray="2,2" />
          ))}

          {/* Live neighbors appearing one by one */}
          {LIVE_NEIGHBORS.slice(0, count).map(({ r, c }) => (
            <g key={`live-${r}-${c}`}>
              <circle cx={cx(c)} cy={cy(r)} r={haloR} fill={PETRI.amber} opacity="0.2" />
              <circle cx={cx(c)} cy={cy(r)} r={cellR} fill={PETRI.amber} />
              <circle cx={cx(c) - cellR * 0.28} cy={cy(r) - cellR * 0.28} r={cellR * 0.3} fill="white" opacity="0.5" />
            </g>
          ))}

          {/* Target cell — always shown, stronger halo when count=3 */}
          <circle cx={cx(2)} cy={cy(2)} r={haloR} fill={PETRI.life} opacity={count === 3 ? "0.22" : "0.15"} />
          <circle cx={cx(2)} cy={cy(2)} r={cellR} fill={PETRI.life} />
          <circle cx={cx(2) - cellR * 0.28} cy={cy(2) - cellR * 0.28} r={cellR * 0.3} fill="white" opacity="0.5" />
        </g>

        {/* Scan ring around target */}
        <circle cx={cx(2)} cy={cy(2)} r={haloR + 10} fill="none" stroke={nColor} strokeWidth="2" className="scan-ring" style={{ transition: "stroke 0.3s" }} />

        <text x={CX} y="243" textAnchor="middle" fill={PETRI.muted} fontSize="8" fontFamily={MONO} letterSpacing="0.14em">
          NEIGHBOR POSITIONS
        </text>
      </svg>
    </div>
  )
}

function CountScreen({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [count, setCount] = useState(0)
  const done = count >= 3

  const handleTap = () => {
    if (!done) setCount(c => c + 1)
    else onNext()
  }

  const btnLabel = done ? "The rules →" : count === 0 ? "Count →" : "Count →"

  return (
    <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <TopBar left="Step 1 · n" onSkip={onSkip} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 28px 0", gap: 12, minHeight: 0 }}>

        <h2 style={{ fontSize: 22, letterSpacing: "0.18em", margin: 0, textAlign: "center", textTransform: "uppercase", fontWeight: 700, color: PETRI.ink }}>
          THE COUNT
        </h2>

        {/* Dish */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 0 }}>
          <CountDish count={count} />
        </div>

        {/* n display — fixed height so dish never shifts */}
        <div style={{ height: 136, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {count === 0 ? (
            <div className="fade-in-up" style={{ fontSize: 13, letterSpacing: "0.2em", color: PETRI.muted, textTransform: "uppercase" }}>
              Each cell scans its 8 surrounding positions.
            </div>
          ) : (
            <div key={count} className="pop-in" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.35em", color: PETRI.muted, textTransform: "uppercase", marginBottom: 2 }}>n =</div>
              <div style={{ fontSize: 88, fontWeight: 700, color: done ? PETRI.life : PETRI.ink, lineHeight: 1, fontFamily: MONO, transition: "color 0.3s" }}>
                {count}
              </div>
              {done && (
                <div style={{ fontSize: 12, letterSpacing: "0.2em", color: PETRI.muted, textTransform: "uppercase", marginTop: 6 }}>
                  n = live neighbors · checked every generation
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      <div style={{ padding: "20px 28px 28px" }}>
        <PrimaryBtn onClick={handleTap}>{btnLabel}</PrimaryBtn>
      </div>
    </div>
  )
}

// ============================================================
// Eval screen — one pattern, user steps through 4 cells
// ============================================================

function EvalDish({ evalState }: { evalState: EvalState }) {
  const uid = useId().replace(/:/g, "")
  const grid = EVAL_BOARD
  const rows = 6, cols = 6
  const CX = 120, CY = 120
  const spacing = 19, cellR = 6, haloR = 10

  const activeCell = evalState.phase !== 'intro' && evalState.phase !== 'done'
    ? EVAL_CELLS[evalState.idx]
    : null
  const phase: ScanPhase | null = evalState.phase === 'neighbors' || evalState.phase === 'outcome' ? evalState.phase : null

  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 240 256" style={{ width: "min(250px, 88vw)", height: "auto", display: "block" }}>
        <defs>
          <clipPath id={`eval-clip-${uid}`}><circle cx={CX} cy={CY} r="98" /></clipPath>
        </defs>

        <ellipse cx={CX} cy={230} rx="80" ry="4" fill="#00000012" />
        <circle cx={CX} cy={CY} r="100" fill={PETRI.dishBg} stroke={PETRI.ink} strokeWidth="2" />
        <circle cx={CX} cy={CY} r="92" fill="none" stroke={PETRI.ink} strokeWidth="0.8" opacity="0.25" />
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i * 10 * Math.PI) / 180
          return <line key={i} x1={CX + Math.cos(a) * 96} y1={CY + Math.sin(a) * 96} x2={CX + Math.cos(a) * 100} y2={CY + Math.sin(a) * 100} stroke={PETRI.ink} strokeWidth={i % 3 === 0 ? "1" : "0.5"} opacity={i % 3 === 0 ? "0.5" : "0.25"} />
        })}

        <g clipPath={`url(#eval-clip-${uid})`}>
          {(() => {
            // Compute neighbor positions of active cell (only during 'neighbors' phase)
            const neighborSet = new Set<string>()
            if (activeCell && phase === 'neighbors') {
              for (let dr = -1; dr <= 1; dr++)
                for (let dc = -1; dc <= 1; dc++) {
                  if (dr === 0 && dc === 0) continue
                  const nr = activeCell.r + dr, nc = activeCell.c + dc
                  if (nr >= 0 && nr < rows && nc >= 0 && nc < cols)
                    neighborSet.add(`${nr},${nc}`)
                }
            }

            return grid.map((row, ri) => row.map((cell, ci) => {
              const cx = CX + (ci - (cols - 1) / 2) * spacing
              const cy = CY + (ri - (rows - 1) / 2) * spacing
              const isActive = activeCell?.r === ri && activeCell?.c === ci
              const isNeighbor = neighborSet.has(`${ri},${ci}`)
              const dying = isActive && phase === 'outcome' && activeCell!.outcome === 'dies'
              const born = isActive && phase === 'outcome' && activeCell!.outcome === 'born'

              if (cell) {
                if (isActive) {
                  return (
                    <g key={`${ri},${ci}`}>
                      <circle cx={cx} cy={cy} r={haloR} fill={PETRI.life} opacity={dying ? "0.03" : "0.22"} />
                      <circle cx={cx} cy={cy} r={cellR} fill={dying ? PETRI.muted : PETRI.life} opacity={dying ? "0.3" : "1"} />
                      {!dying && <circle cx={cx - cellR * 0.28} cy={cy - cellR * 0.28} r={cellR * 0.3} fill="white" opacity="0.5" />}
                    </g>
                  )
                } else if (isNeighbor) {
                  return (
                    <g key={`${ri},${ci}`}>
                      <circle cx={cx} cy={cy} r={haloR} fill={PETRI.amber} opacity="0.2" />
                      <circle cx={cx} cy={cy} r={cellR} fill={PETRI.amber} opacity="1" />
                      <circle cx={cx - cellR * 0.28} cy={cy - cellR * 0.28} r={cellR * 0.3} fill="white" opacity="0.5" />
                    </g>
                  )
                } else {
                  const dimmed = phase === 'neighbors'
                  return (
                    <g key={`${ri},${ci}`}>
                      <circle cx={cx} cy={cy} r={haloR} fill={PETRI.life} opacity="0.12" />
                      <circle cx={cx} cy={cy} r={cellR} fill={PETRI.life} opacity={dimmed ? "0.45" : "1"} />
                      {!dimmed && <circle cx={cx - cellR * 0.28} cy={cy - cellR * 0.28} r={cellR * 0.3} fill="white" opacity="0.5" />}
                    </g>
                  )
                }
              } else if (born) {
                return (
                  <g key={`${ri},${ci}`}>
                    <circle cx={cx} cy={cy} r={haloR} fill={PETRI.born} opacity="0.22" />
                    <circle cx={cx} cy={cy} r={cellR * 0.8} fill={PETRI.born} opacity="0.85" />
                    <circle cx={cx - cellR * 0.22} cy={cy - cellR * 0.22} r={cellR * 0.26} fill="white" opacity="0.45" />
                  </g>
                )
              } else if (isNeighbor) {
                return (
                  <circle key={`${ri},${ci}`} cx={cx} cy={cy} r={2.5} fill="none" stroke={PETRI.amber} strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                )
              } else {
                const isActiveEmpty = isActive && phase === 'neighbors'
                return (
                  <circle key={`${ri},${ci}`} cx={cx} cy={cy} r={isActiveEmpty ? 2.2 : 1.4} fill={PETRI.muted} opacity={isActiveEmpty ? "0.35" : "0.18"} />
                )
              }
            }))
          })()}
        </g>

        {/* Scan ring */}
        {activeCell && (
          <circle
            cx={CX + (activeCell.c - (cols - 1) / 2) * spacing}
            cy={CY + (activeCell.r - (rows - 1) / 2) * spacing}
            r={haloR + 9}
            fill="none"
            stroke={phase === 'outcome'
              ? (activeCell.outcome === 'dies' ? PETRI.warn : PETRI.life)
              : PETRI.ink}
            strokeWidth="2"
            className="scan-ring"
          />
        )}

        <text x={CX} y="243" textAnchor="middle" fill={PETRI.muted} fontSize="8" fontFamily={MONO} letterSpacing="0.14em">
          COLONY · 6 × 6
        </text>
      </svg>
    </div>
  )
}

// ============================================================
// Playback dish — runs EVAL_BOARD through Conway with full color rules
// born=purple, dying=red, surviving=green
// ============================================================

function PlaybackDish() {
  const uid = useId().replace(/:/g, "")
  const CX = 120, CY = 120
  const rows = 6, cols = 6
  const spacing = 19, cellR = 6, haloR = 10

  const [state, setState] = useState(() => ({
    prev: makeGrid(rows, cols),
    grid: EVAL_BOARD,
    gen: 0,
    extinct: false,
  }))

  useEffect(() => {
    if (state.extinct) return
    const t = setInterval(() => {
      setState(s => {
        if (s.extinct) return s
        const next = stepConway(s.grid)
        if (!next.flat().some(Boolean)) return { ...s, extinct: true }
        return { prev: s.grid, grid: next, gen: s.gen + 1, extinct: false }
      })
    }, 1100)
    return () => clearInterval(t)
  }, [state.extinct])

  // Compute per-cell fate from prev → grid → next
  const nextGrid = stepConway(state.grid)
  const bornSet = new Set<string>()
  const dyingSet = new Set<string>()
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`
      if (!state.prev[r][c] && state.grid[r][c]) bornSet.add(key)
      if (state.grid[r][c] && !nextGrid[r][c]) dyingSet.add(key)
    }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <svg viewBox="0 0 240 256" style={{ width: "min(250px, 88vw)", height: "auto", display: "block" }}>
        <defs>
          <clipPath id={`pb-clip-${uid}`}><circle cx={CX} cy={CY} r="98" /></clipPath>
        </defs>

        <ellipse cx={CX} cy={230} rx="80" ry="4" fill="#00000012" />
        <circle cx={CX} cy={CY} r="100" fill={PETRI.dishBg} stroke={PETRI.ink} strokeWidth="2" />
        <circle cx={CX} cy={CY} r="92" fill="none" stroke={PETRI.ink} strokeWidth="0.8" opacity="0.25" />
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i * 10 * Math.PI) / 180
          return <line key={i} x1={CX + Math.cos(a) * 96} y1={CY + Math.sin(a) * 96} x2={CX + Math.cos(a) * 100} y2={CY + Math.sin(a) * 100} stroke={PETRI.ink} strokeWidth={i % 3 === 0 ? "1" : "0.5"} opacity={i % 3 === 0 ? "0.5" : "0.25"} />
        })}

        <g clipPath={`url(#pb-clip-${uid})`}>
          {state.grid.map((row, ri) => row.map((cell, ci) => {
            const cx = CX + (ci - (cols - 1) / 2) * spacing
            const cy = CY + (ri - (rows - 1) / 2) * spacing
            const key = `${ri},${ci}`
            const isBorn = bornSet.has(key)
            const isDying = dyingSet.has(key)

            if (cell) {
              const color = isBorn ? PETRI.born : isDying ? PETRI.warn : PETRI.life
              const haloOp = isDying ? "0.08" : "0.18"
              const bodyOp = isDying ? "0.45" : "1"
              return (
                <g key={key}>
                  <circle cx={cx} cy={cy} r={haloR} fill={color} opacity={haloOp} />
                  <circle cx={cx} cy={cy} r={cellR} fill={color} opacity={bodyOp} />
                  {!isDying && <circle cx={cx - cellR * 0.28} cy={cy - cellR * 0.28} r={cellR * 0.3} fill="white" opacity="0.5" />}
                </g>
              )
            } else {
              return <circle key={key} cx={cx} cy={cy} r={1.4} fill={PETRI.muted} opacity="0.18" />
            }
          }))}
        </g>

        {state.extinct ? (
          <>
            <circle cx={CX} cy={CY} r="98" fill={PETRI.dishBg} opacity="0.92" clipPath={`url(#pb-clip-${uid})`} />
            <text x={CX} y={CY - 8} textAnchor="middle" fill={PETRI.muted} fontSize="13" fontFamily={MONO} letterSpacing="0.22em" fontWeight="700">ERADICATED</text>
            <text x={CX} y={CY + 10} textAnchor="middle" fill={PETRI.muted} fontSize="8" fontFamily={MONO} letterSpacing="0.14em" opacity="0.6">gen · {String(state.gen).padStart(3, "0")}</text>
          </>
        ) : (
          <text x={CX} y="243" textAnchor="middle" fill={PETRI.muted} fontSize="8" fontFamily={MONO} letterSpacing="0.14em">
            GEN · {String(state.gen).padStart(3, "0")}
          </text>
        )}
      </svg>
    </div>
  )
}

function EvalScreen({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [evalState, setEvalState] = useState<EvalState>({ phase: 'intro' })
  const [showPlayback, setShowPlayback] = useState(false)

  const advance = () => {
    setEvalState(prev => {
      if (prev.phase === 'intro') return { phase: 'neighbors', idx: 0 }
      if (prev.phase === 'neighbors') return { phase: 'outcome', idx: prev.idx }
      if (prev.phase === 'outcome') {
        if (prev.idx < EVAL_CELLS.length - 1) return { phase: 'neighbors', idx: prev.idx + 1 }
        return { phase: 'done' }
      }
      return prev
    })
  }

  const done = evalState.phase === 'done'

  // After reaching done, transition to playback after a short pause
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setShowPlayback(true), 700)
    return () => clearTimeout(t)
  }, [done])

  const activeCell = evalState.phase === 'neighbors' || evalState.phase === 'outcome'
    ? EVAL_CELLS[evalState.idx]
    : null
  const progress = evalState.phase === 'intro' ? 0
    : evalState.phase === 'done' ? EVAL_CELLS.length
    : evalState.idx + 1

  const btnLabel = (() => {
    if (evalState.phase === 'intro') return "→ Evaluate first cell"
    if (evalState.phase === 'neighbors') return "→ What happens?"
    if (evalState.phase === 'outcome') {
      if (evalState.idx < EVAL_CELLS.length - 1) return "→ Next cell"
      return "→ See the rules"
    }
    return "→ See the rules"
  })()

  const title = activeCell?.title ?? (done ? "PLAYING" : "EVALUATE")

  const copyContent = (() => {
    if (showPlayback) {
      return (
        <div className="fade-in" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: PETRI.born, letterSpacing: "0.1em", fontFamily: MONO }}>● born</span>
            <span style={{ fontSize: 11, color: PETRI.life, letterSpacing: "0.1em", fontFamily: MONO }}>● alive</span>
            <span style={{ fontSize: 11, color: PETRI.warn, letterSpacing: "0.1em", fontFamily: MONO }}>● dying</span>
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.6, color: PETRI.muted, margin: 0, letterSpacing: "0.04em" }}>
            The same four rules. Playing out every generation.
          </p>
        </div>
      )
    }
    if (evalState.phase === 'intro') {
      return (
        <p style={{ fontSize: 14, lineHeight: 1.65, textAlign: "center", color: PETRI.inkSoft, margin: 0, fontFamily: MONO, letterSpacing: "0.04em" }}>
          A frozen colony. We'll check every cell, one by one. Same rules apply to all of them.
        </p>
      )
    }
    if (evalState.phase === 'neighbors' && activeCell) {
      return (
        <div key={`n-${evalState.idx}`} className="pop-in" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.35em", color: PETRI.muted, textTransform: "uppercase", marginBottom: 2 }}>n =</div>
          <div style={{ fontSize: 84, fontWeight: 700, color: PETRI.ink, lineHeight: 1, fontFamily: MONO }}>
            {activeCell.neighbors}
          </div>
          <div style={{ fontSize: 12, letterSpacing: "0.14em", color: PETRI.muted, marginTop: 8, lineHeight: 1.5 }}>
            {activeCell.captionN}
          </div>
        </div>
      )
    }
    if (evalState.phase === 'outcome' && activeCell) {
      const isGood = activeCell.outcome !== 'dies'
      const color = isGood ? (activeCell.outcome === 'born' ? PETRI.born : PETRI.life) : PETRI.warn
      const word = activeCell.outcome === 'lives' ? 'LIVES' : activeCell.outcome === 'dies' ? 'DIES' : 'BORN'
      return (
        <div key={`o-${evalState.idx}`} className="pop-in" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, fontWeight: 700, color, lineHeight: 1, fontFamily: MONO, letterSpacing: "0.04em" }}>
            {word}
          </div>
          <div style={{ fontSize: 12, letterSpacing: "0.14em", color: PETRI.muted, marginTop: 10, lineHeight: 1.5 }}>
            {activeCell.captionOutcome}
          </div>
        </div>
      )
    }
    return null
  })()

  return (
    <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <TopBar
        left={`Step 2 · Evaluate`}
        right={
          <span style={{ fontSize: 9, letterSpacing: "0.2em", color: PETRI.muted, textTransform: "uppercase" }}>
            {evalState.phase !== 'intro' ? `${progress} / ${EVAL_CELLS.length}` : `0 / ${EVAL_CELLS.length}`}
          </span>
        }
        onSkip={onSkip}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 28px 0", gap: 12, minHeight: 0 }}>

        <h2 key={title} className="fade-in" style={{ fontSize: 22, letterSpacing: "0.18em", margin: 0, textAlign: "center", textTransform: "uppercase", fontWeight: 700, color: PETRI.ink }}>
          {title}
        </h2>

        {/* Dish — switches to live playback when done */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 0 }}>
          {showPlayback ? <PlaybackDish /> : <EvalDish evalState={evalState} />}
        </div>

        {/* Copy area — fixed height so dish never shifts */}
        <div style={{ height: 160, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
          {copyContent}
        </div>

      </div>

      <div style={{ padding: "20px 28px 28px" }}>
        {done
          ? <PrimaryBtn onClick={onNext}>See the rules →</PrimaryBtn>
          : <PrimaryBtn onClick={advance}>{btnLabel}</PrimaryBtn>
        }
      </div>
    </div>
  )
}

// ============================================================
// Rules screen — visual n-spectrum + warm cards
// ============================================================

const FADE_AMB = "#DC2626"  // red for dying/starving cells

function RulesScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <TopBar left="Step 3 · The sweet spot" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 24px 0", gap: 0, minHeight: 0, overflowY: "auto" }}>

        <h2 style={{ fontSize: 20, letterSpacing: "0.12em", margin: "0 0 6px", textAlign: "center", textTransform: "uppercase", fontWeight: 700, color: PETRI.ink }}>
          How many neighbors?
        </h2>
        <p style={{ fontSize: 13, color: PETRI.muted, textAlign: "center", margin: "0 0 28px", letterSpacing: "0.04em", lineHeight: 1.5 }}>
          Every cell counts its neighbors.<br />That number decides its fate.
        </p>

        {/* n spectrum: 0–8 circles */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 5, marginBottom: 10 }}>
          {Array.from({ length: 9 }, (_, n) => {
            const isLife = n === 2 || n === 3
            const bg = isLife ? PETRI.life : FADE_AMB
            const size = isLife ? 38 : 30
            return (
              <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: size, height: size, borderRadius: "50%",
                  background: bg, color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: isLife ? 15 : 12, fontWeight: 700, fontFamily: MONO,
                  boxShadow: isLife ? `0 4px 14px ${PETRI.life}45` : "none",
                  opacity: isLife ? 1 : 0.7,
                }}>
                  {n}
                </div>
                {n === 3 && (
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: PETRI.born,
                    animation: "cell-born 2s ease-in-out infinite",
                    boxShadow: `0 0 6px ${PETRI.born}80`,
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Zone labels */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px", marginBottom: 24 }}>
          <div style={{ textAlign: "center", width: 72 }}>
            <div style={{ fontSize: 10, color: FADE_AMB, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Starves</div>
            <div style={{ fontSize: 9, color: PETRI.muted, marginTop: 1 }}>0 – 1</div>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 11, color: PETRI.life, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Thrives</div>
            <div style={{ fontSize: 9, color: PETRI.muted, marginTop: 1 }}>2 – 3</div>
          </div>
          <div style={{ textAlign: "center", width: 90 }}>
            <div style={{ fontSize: 10, color: FADE_AMB, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Suffocates</div>
            <div style={{ fontSize: 9, color: PETRI.muted, marginTop: 1 }}>4 or more</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: PETRI.border, marginBottom: 20 }} />

        {/* Birth card */}
        <div style={{ background: PETRI.bg, border: `1px solid ${PETRI.border}`, borderRadius: 16, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: PETRI.life, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            New life
          </div>
          <div style={{ fontSize: 14, color: PETRI.inkSoft, lineHeight: 1.6, letterSpacing: "0.02em" }}>
            An empty space surrounded by exactly <span style={{ fontWeight: 700, color: PETRI.life }}>3 live neighbors</span> becomes a new living cell.
          </div>
        </div>

        <p style={{ fontSize: 11, color: PETRI.muted, textAlign: "center", letterSpacing: "0.08em", margin: "20px 0 0", lineHeight: 1.7 }}>
          Every cell. Every generation.
        </p>

      </div>

      <div style={{ padding: "20px 24px 28px" }}>
        <PrimaryBtn onClick={onNext}>Build →</PrimaryBtn>
      </div>
    </div>
  )
}

// ============================================================
// Colony screen — level one title screen
// ============================================================

function makeDigit1(): boolean[][] {
  const _ = false, X = true
  return [
    [_,_,_,_,_,_,_],
    [_,_,_,X,_,_,_],
    [_,_,X,X,_,_,_],
    [_,_,_,X,_,_,_],
    [_,_,_,X,_,_,_],
    [_,_,_,X,_,_,_],
    [_,_,_,X,_,_,_],
    [_,_,X,X,X,_,_],
    [_,_,_,_,_,_,_],
  ]
}

function ColonyScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <ArcTransition
      num="01"
      name="LEVEL ONE"
      copy="You know the rules. Now build something that survives."
      cta="Begin"
      onNext={onComplete}
      dishGrid={makeDigit1()}
      dishColor={PETRI.life}
      staticDish
    />
  )
}

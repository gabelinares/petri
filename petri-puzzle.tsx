"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import PetriOnboarding from "./petri-onboarding"
import { PETRI, MONO, PetriDishGrid, stepConway } from "./petri-dish"

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID = 8
const OB_KEY = "petri_ob_v2"
const PROGRESS_KEY = "petri_progress_v2"

// ─── Grid helpers ─────────────────────────────────────────────────────────────

function makeGrid(): boolean[][] {
  return Array(GRID).fill(null).map(() => Array(GRID).fill(false))
}

function cloneGrid(g: boolean[][]): boolean[][] {
  return g.map(r => [...r])
}

function gridsEqual(a: boolean[][], b: boolean[][]): boolean {
  return a.every((row, r) => row.every((cell, c) => cell === b[r][c]))
}

function stepN(g: boolean[][], n: number): boolean[][] {
  let h = g
  for (let i = 0; i < n; i++) h = stepConway(h)
  return h
}

function aliveCount(g: boolean[][]): number {
  return g.flat().filter(Boolean).length
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isStillLife(grid: boolean[][]): boolean {
  if (aliveCount(grid) < 1) return false
  return gridsEqual(stepConway(grid), grid)
}

function isOscillator(grid: boolean[][]): boolean {
  if (aliveCount(grid) < 2) return false
  const s1 = stepConway(grid)
  if (gridsEqual(s1, grid)) return false
  for (let p = 2; p <= 4; p++) {
    const sp = stepN(cloneGrid(grid), p)
    if (aliveCount(sp) === 0) return false
    if (gridsEqual(sp, grid)) return true
  }
  return false
}

function getOscillatorPeriod(grid: boolean[][]): number | null {
  const s1 = stepConway(grid)
  if (gridsEqual(s1, grid)) return 1
  for (let p = 2; p <= 4; p++) {
    if (gridsEqual(stepN(cloneGrid(grid), p), grid)) return p
  }
  return null
}

// ─── Share tries line ─────────────────────────────────────────────────────────

function makeTriesLine(tries: number): string {
  if (tries <= 0) return "🟢"
  return Array(tries - 1).fill("🔴").concat("🟢").join(" ")
}

// ─── Level definitions ────────────────────────────────────────────────────────

interface PuzzleDef {
  id: string
  name: string
  prompt: string
  targetCells: number | null
  validate: (grid: boolean[][]) => boolean
  testSteps: number
  hint: string
  successLabel: string
}

interface LevelDef {
  id: number
  chapter: string
  subtitle: string
  accent: string
  puzzles: PuzzleDef[]
}

const LEVELS: LevelDef[] = [
  {
    id: 1,
    chapter: "STILL LIFES",
    subtitle: "Some patterns never change.",
    accent: PETRI.life,
    puzzles: [
      {
        id: "1-1",
        name: "The Primordial Organism",
        prompt: "Place exactly 4 cells that survive unchanged. Forever.",
        targetCells: 4,
        validate: (g) => aliveCount(g) === 4 && isStillLife(g),
        testSteps: 3,
        hint: "Try grouping them tightly together.",
        successLabel: "Still life discovered.",
      },
      {
        id: "1-2",
        name: "The Hive",
        prompt: "Place exactly 6 cells that never change.",
        targetCells: 6,
        validate: (g) => aliveCount(g) === 6 && isStillLife(g),
        testSteps: 3,
        hint: "Think of a ring or a compact shape.",
        successLabel: "Still life discovered.",
      },
    ],
  },
  {
    id: 2,
    chapter: "OSCILLATORS",
    subtitle: "Some patterns pulse forever.",
    accent: PETRI.amber,
    puzzles: [
      {
        id: "2-1",
        name: "The First Movement",
        prompt: "Place exactly 3 cells that change, then come back.",
        targetCells: 3,
        validate: (g) => aliveCount(g) === 3 && isOscillator(g),
        testSteps: 5,
        hint: "Three cells in a straight line.",
        successLabel: "Oscillator discovered.",
      },
      {
        id: "2-2",
        name: "Pulsing Hearts",
        prompt: "Find a 6-cell pattern that pulses. It changes, then returns.",
        targetCells: 6,
        validate: (g) => aliveCount(g) === 6 && isOscillator(g),
        testSteps: 7,
        hint: "Explore different arrangements of 6 cells.",
        successLabel: "Oscillator discovered.",
      },
    ],
  },
]

// ─── Progress persistence ─────────────────────────────────────────────────────

interface ProgressData {
  completed: Record<string, number>
}

function loadProgress(): ProgressData {
  if (typeof window === "undefined") return { completed: {} }
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "null") ?? { completed: {} } }
  catch { return { completed: {} } }
}

function saveProgress(p: ProgressData) {
  if (typeof window !== "undefined") localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
}

function isLevelUnlocked(levelId: number, progress: ProgressData): boolean {
  if (levelId === 1) return true
  const prev = LEVELS[levelId - 2]
  return prev.puzzles.every(p => progress.completed[p.id] !== undefined)
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PetriPuzzle() {
  const [obDone, setObDone] = useState<boolean | null>(null)
  useEffect(() => { setObDone(!!localStorage.getItem(OB_KEY)) }, [])
  if (obDone === null) return null
  if (!obDone) return (
    <PetriOnboarding onComplete={() => { localStorage.setItem(OB_KEY, "1"); setObDone(true) }} />
  )
  const resetToOnboarding = () => { localStorage.removeItem(OB_KEY); setObDone(false) }
  return <PuzzleApp onRestart={resetToOnboarding} />
}

// ─── App router ───────────────────────────────────────────────────────────────

type AppScreen =
  | { tag: "home" }
  | { tag: "puzzle"; li: number; pi: number }
  | { tag: "success"; li: number; pi: number; tries: number; grid: boolean[][] }
  | { tag: "level-clear"; li: number }
  | { tag: "level-intro"; li: number }
  | { tag: "game-clear" }
  | { tag: "lab" }

function PuzzleApp({ onRestart }: { onRestart: () => void }) {
  const [screen, setScreen] = useState<AppScreen>({ tag: "home" })
  const [progress, setProgress] = useState<ProgressData>(loadProgress)

  const markComplete = useCallback((puzzleId: string, tries: number) => {
    setProgress(prev => {
      const best = prev.completed[puzzleId]
      const next: ProgressData = {
        completed: { ...prev.completed, [puzzleId]: best !== undefined ? Math.min(best, tries) : tries }
      }
      saveProgress(next)
      return next
    })
  }, [])

  const goHome = () => setScreen({ tag: "home" })

  if (screen.tag === "home") {
    return <HomeScreen progress={progress} onSelect={(li, pi) => {
      const neverStarted = li > 0 && LEVELS[li].puzzles.every(p => progress.completed[p.id] === undefined)
      setScreen(neverStarted ? { tag: "level-intro", li } : { tag: "puzzle", li, pi })
    }} onLab={() => setScreen({ tag: "lab" })} onRestart={onRestart} />
  }
  if (screen.tag === "puzzle") {
    const { li, pi } = screen
    return (
      <PuzzleScreen
        level={LEVELS[li]} puzzle={LEVELS[li].puzzles[pi]} li={li} pi={pi}
        onSuccess={(tries, grid) => {
          markComplete(LEVELS[li].puzzles[pi].id, tries)
          setScreen({ tag: "success", li, pi, tries, grid })
        }}
        onHome={goHome} onLab={() => setScreen({ tag: "lab" })}
      />
    )
  }
  if (screen.tag === "success") {
    const { li, pi, tries, grid } = screen
    const isLastPuzzle = pi === LEVELS[li].puzzles.length - 1
    const isLastLevel = li === LEVELS.length - 1
    return (
      <SuccessScreen
        level={LEVELS[li]} puzzle={LEVELS[li].puzzles[pi]} tries={tries} solvedGrid={grid}
        onNext={() => {
          if (isLastPuzzle) {
            if (isLastLevel) setScreen({ tag: "game-clear" })
            else setScreen({ tag: "level-clear", li })
          } else {
            setScreen({ tag: "puzzle", li, pi: pi + 1 })
          }
        }}
        onHome={goHome} onLab={() => setScreen({ tag: "lab" })}
      />
    )
  }
  if (screen.tag === "level-clear") {
    const { li } = screen
    return <LevelClearScreen level={LEVELS[li]} nextLevel={LEVELS[li + 1]} onNext={() => setScreen({ tag: "puzzle", li: li + 1, pi: 0 })} onHome={goHome} />
  }
  if (screen.tag === "level-intro") {
    const { li } = screen
    return <LevelIntroScreen level={LEVELS[li]} onStart={() => setScreen({ tag: "puzzle", li, pi: 0 })} />
  }
  if (screen.tag === "game-clear") {
    return <GameClearScreen onHome={goHome} onLab={() => setScreen({ tag: "lab" })} />
  }
  if (screen.tag === "lab") {
    return <LabScreen onBack={goHome} />
  }
  return null
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────

function PetriLogo({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: onClick ? "pointer" : "default" }}
    >
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: PETRI.life, animation: "petri-pulse 2s infinite" }} />
      <span style={{ fontSize: 14, letterSpacing: "0.22em", color: PETRI.ink, textTransform: "uppercase", fontWeight: 700, fontFamily: MONO }}>PETRI</span>
    </button>
  )
}

function HomeScreen({ progress, onSelect, onLab, onRestart }: {
  progress: ProgressData
  onSelect: (li: number, pi: number) => void
  onLab: () => void
  onRestart: () => void
}) {
  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: `1px solid ${PETRI.border}`, minHeight: 56 }}>
        <PetriLogo onClick={onRestart} />
        <button onClick={onLab} style={ghostBtn}>LAB →</button>
      </div>

      <div style={{ flex: 1, padding: "28px 24px 24px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <div style={{ marginBottom: 4 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: PETRI.muted, textTransform: "uppercase", margin: "0 0 6px" }}>Your Laboratory</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.06em", color: PETRI.ink, margin: 0 }}>Select Level</h1>
        </div>

        {LEVELS.map((level, li) => {
          const unlocked = isLevelUnlocked(level.id, progress)
          const completedCount = level.puzzles.filter(p => progress.completed[p.id] !== undefined).length
          const allDone = completedCount === level.puzzles.length
          const firstIncomplete = level.puzzles.findIndex(p => progress.completed[p.id] === undefined)
          const startPi = firstIncomplete === -1 ? 0 : firstIncomplete

          return (
            <div
              key={level.id}
              onClick={() => unlocked && onSelect(li, startPi)}
              style={{
                border: `1.5px solid ${unlocked ? (allDone ? level.accent + "80" : PETRI.border) : PETRI.border}`,
                borderRadius: 14, padding: "22px 22px", cursor: unlocked ? "pointer" : "default",
                opacity: unlocked ? 1 : 0.4,
                background: allDone ? `${level.accent}08` : "transparent",
                transition: "all 0.2s", position: "relative",
              }}
            >
              {allDone && (
                <div style={{ position: "absolute", top: 18, right: 18, fontSize: 10, letterSpacing: "0.2em", color: level.accent, textTransform: "uppercase", fontWeight: 700 }}>
                  COMPLETE ✓
                </div>
              )}
              {!unlocked && (
                <div style={{ position: "absolute", top: 18, right: 18, fontSize: 18 }}>🔒</div>
              )}
              <div style={{ fontSize: 10, letterSpacing: "0.32em", color: unlocked ? level.accent : PETRI.muted, textTransform: "uppercase", marginBottom: 5, fontWeight: 700 }}>
                Level {level.id}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.1em", color: PETRI.ink, textTransform: "uppercase", marginBottom: 4 }}>
                {level.chapter}
              </div>
              <div style={{ fontSize: 13, color: PETRI.muted, marginBottom: 16 }}>{level.subtitle}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {level.puzzles.map((p, i) => {
                  const done = progress.completed[p.id] !== undefined
                  const best = progress.completed[p.id]
                  return (
                    <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO, letterSpacing: "0.04em", lineHeight: 1, color: done ? level.accent : PETRI.border }}>
                        {done && best !== undefined ? String(best).padStart(2, "0") : "·"}
                      </div>
                      <div style={{ fontSize: 8, letterSpacing: "0.2em", color: PETRI.muted, textTransform: "uppercase" }}>
                        {done ? (best === 1 ? "first try" : "attempts") : `unsolved`}
                      </div>
                    </div>
                  )
                })}
                {!allDone && unlocked && (
                  <div style={{ fontSize: 10, color: PETRI.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    {completedCount}/{level.puzzles.length}
                  </div>
                )}
              </div>
              {unlocked && !allDone && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", background: PETRI.ink, color: PETRI.bg, fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, borderRadius: 6 }}>
                    {completedCount > 0 ? "Continue" : "Begin"} →
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div
          onClick={onLab}
          style={{ border: `1.5px solid ${PETRI.border}`, borderRadius: 14, padding: "22px 22px", cursor: "pointer", transition: "border-color 0.2s" }}
        >
          <div style={{ fontSize: 10, letterSpacing: "0.32em", color: PETRI.muted, textTransform: "uppercase", marginBottom: 5, fontWeight: 700 }}>Free Play</div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.1em", color: PETRI.ink, textTransform: "uppercase", marginBottom: 4 }}>LAB</div>
          <div style={{ fontSize: 13, color: PETRI.muted }}>Experiment freely. No rules, no score.</div>
        </div>
      </div>
    </Shell>
  )
}

// ─── PUZZLE SCREEN ────────────────────────────────────────────────────────────

type PuzzlePhase = "building" | "testing" | "fail-flash"

function PuzzleScreen({ level, puzzle, li, pi, onSuccess, onHome, onLab }: {
  level: LevelDef; puzzle: PuzzleDef; li: number; pi: number
  onSuccess: (tries: number, grid: boolean[][]) => void
  onHome: () => void; onLab: () => void
}) {
  const [grid, setGrid] = useState<boolean[][]>(makeGrid)
  const [savedGrid, setSavedGrid] = useState<boolean[][]>(makeGrid)
  const [phase, setPhase] = useState<PuzzlePhase>("building")
  const [tries, setTries] = useState(0)
  const [testStep, setTestStep] = useState(0)
  const [testResult, setTestResult] = useState<"pass" | "fail" | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [bornCells, setBornCells] = useState<[number, number][]>([])
  const [failReason, setFailReason] = useState<{ title: string; body: string }>({ title: "Not stable", body: "Try a different shape." })

  const cellCount = aliveCount(grid)
  const hasTarget = puzzle.targetCells !== null
  const canTest = hasTarget ? cellCount === puzzle.targetCells : cellCount >= 2

  // Testing animation
  useEffect(() => {
    if (phase !== "testing") return
    if (testStep >= puzzle.testSteps) {
      if (testResult === "pass") { onSuccess(tries, savedGrid); return }
      setPhase("fail-flash")
      const t = setTimeout(() => { setGrid(cloneGrid(savedGrid)); setBornCells([]); setPhase("building") }, 1400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setGrid(g => {
        const next = stepConway(g)
        const born: [number, number][] = []
        for (let r = 0; r < next.length; r++)
          for (let c = 0; c < next[0].length; c++)
            if (next[r][c] && !g[r][c]) born.push([r, c])
        setBornCells(born)
        return next
      })
      setTestStep(s => s + 1)
    }, 200)
    return () => clearTimeout(t)
  }, [phase, testStep, testResult, puzzle.testSteps, savedGrid, tries, onSuccess])

  const handleToggle = (r: number, c: number) => {
    if (phase !== "building") return
    setGrid(prev => {
      const isAlive = prev[r][c]
      // Don't allow placing beyond the target cell count
      if (!isAlive && hasTarget && aliveCount(prev) >= puzzle.targetCells!) return prev
      const next = cloneGrid(prev); next[r][c] = !next[r][c]; return next
    })
    setBornCells([])
  }

  const handleTest = () => {
    if (phase !== "building" || !canTest) return
    const current = cloneGrid(grid)
    setSavedGrid(current)
    setTries(t => t + 1)
    const passes = puzzle.validate(current)
    if (!passes) {
      if (level.id === 2) {
        if (isStillLife(current)) setFailReason({ title: "Frozen", body: "It never changes. Needs to pulse." })
        else if (!stepN(current, puzzle.testSteps).flat().some(Boolean)) setFailReason({ title: "Extinct", body: "Colony didn't survive. Try a denser shape." })
        else setFailReason({ title: "Doesn't return", body: "It changed but never came back." })
      } else {
        setFailReason({ title: "Not stable", body: "Cells moved. It needs to hold still." })
      }
    }
    setTestResult(passes ? "pass" : "fail")
    setTestStep(0)
    setPhase("testing")
  }

  const handleReset = () => {
    if (phase === "testing") return
    setGrid(makeGrid()); setPhase("building"); setShowHint(false)
  }

  const isFailing = phase === "fail-flash"
  const isTesting = phase === "testing"

  return (
    <Shell>
      {/* Top bar — HUD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: `1px solid ${PETRI.border}`, minHeight: 48, flexShrink: 0 }}>
        <button onClick={onHome} style={ghostBtn}>← Home</button>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.28em", color: level.accent, textTransform: "uppercase", fontWeight: 700 }}>L{level.id}</span>
          <span style={{ fontSize: 9, color: PETRI.border }}>·</span>
          <span style={{ fontSize: 9, letterSpacing: "0.22em", color: PETRI.muted, textTransform: "uppercase" }}>{pi + 1}/{LEVELS[li].puzzles.length}</span>
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.18em", color: tries > 0 ? PETRI.ink : PETRI.border, fontFamily: MONO, textTransform: "uppercase", fontWeight: tries > 0 ? 700 : 400 }}>
          {tries > 0 ? `#${tries}` : "·"}
        </div>
      </div>

      {/* Puzzle header — clinical layout: large chapter number alongside text */}
      <div style={{ display: "flex", gap: 14, padding: "12px 20px 10px", borderBottom: `1px solid ${PETRI.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 44, fontWeight: 300, letterSpacing: "-0.04em", color: PETRI.border, lineHeight: 1, flexShrink: 0, userSelect: "none", paddingTop: 2 }}>
          {String(level.id).padStart(2, "0")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.32em", color: level.accent, textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>
            {level.chapter}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.1em", color: PETRI.ink, textTransform: "uppercase", marginBottom: 4, lineHeight: 1.1 }}>
            {puzzle.name}
          </div>
          <p style={{ fontSize: 13, color: PETRI.inkSoft, lineHeight: 1.5, margin: 0 }}>
            {puzzle.prompt}
          </p>
        </div>
      </div>

      {/* Dish — overflow:hidden so SVG never pushes controls off-screen */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, overflow: "hidden", padding: "2px 12px", position: "relative" }}>
        <PetriDishGrid
          grid={grid}
          onCellClick={phase === "building" ? handleToggle : undefined}
          showLabels={false}
          bornCells={bornCells}
          maxWidth={300}

        />
        {isFailing && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: `${PETRI.warn}10`, gap: 6,
            animation: "petri-fade-in 0.2s ease-out",
            pointerEvents: "none",
          }}>
            <div style={{ fontSize: 14, letterSpacing: "0.3em", color: PETRI.warn, textTransform: "uppercase", fontWeight: 700 }}>{failReason.title}</div>
            <div style={{ fontSize: 11, color: PETRI.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{failReason.body}</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: "8px 20px 18px", borderTop: `1px solid ${PETRI.border}`, flexShrink: 0 }}>
        {/* Count row — fixed 26px so dish never shifts */}
        <div style={{ height: 26, marginBottom: 6, display: "flex", alignItems: "center" }}>
          {!isTesting && !isFailing && hasTarget && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {Array.from({ length: puzzle.targetCells! }).map((_, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < cellCount ? level.accent : PETRI.border, transition: "background 0.15s" }} />
              ))}
              <span style={{ fontSize: 9, letterSpacing: "0.16em", color: PETRI.muted, textTransform: "uppercase", marginLeft: 2 }}>
                {cellCount} of {puzzle.targetCells}
              </span>
            </div>
          )}
          {isTesting && (
            <div style={{ fontSize: 9, letterSpacing: "0.16em", color: PETRI.muted, textTransform: "uppercase" }}>
              Step {testStep} / {puzzle.testSteps}
            </div>
          )}
          {isFailing && (
            <div style={{ fontSize: 9, letterSpacing: "0.14em", color: PETRI.warn, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {failReason.title}. {failReason.body}
            </div>
          )}
          {!isTesting && !hasTarget && cellCount > 0 && (
            <div style={{ fontSize: 9, color: PETRI.muted, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {cellCount} cells placed
            </div>
          )}
        </div>

        {/* Action row */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleReset}
            disabled={isTesting}
            style={{ padding: "14px 16px", background: "transparent", border: `1.5px solid ${PETRI.border}`, color: PETRI.muted, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: MONO, cursor: isTesting ? "not-allowed" : "pointer", borderRadius: 6, fontWeight: 600 }}
          >
            Reset
          </button>
          <button
            onClick={handleTest}
            disabled={!canTest || phase !== "building"}
            style={{
              flex: 1, padding: "14px 20px",
              background: isTesting ? PETRI.muted : (!canTest || isFailing) ? "#EDEBE5" : PETRI.ink,
              color: isTesting ? PETRI.bg : (!canTest || isFailing) ? PETRI.muted : PETRI.bg,
              border: "none", fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase",
              fontWeight: 700, cursor: (!canTest || phase !== "building") ? "not-allowed" : "pointer",
              fontFamily: MONO, borderRadius: 6, transition: "all 0.2s",
            }}
          >
            {isTesting ? "Testing…" : !canTest && hasTarget ? `Need ${puzzle.targetCells} cells` : "▶ Test It"}
          </button>
        </div>

        {/* Hint — fixed 32px */}
        <div style={{ marginTop: 10, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {!showHint
            ? <button onClick={() => setShowHint(true)} style={{ background: "none", border: "none", fontSize: 10, letterSpacing: "0.2em", color: PETRI.muted, textTransform: "uppercase", cursor: "pointer", fontFamily: MONO }}>Need a hint?</button>
            : <p style={{ fontSize: 11, color: PETRI.muted, margin: 0, letterSpacing: "0.04em", lineHeight: 1.5, textAlign: "center" }}>{puzzle.hint}</p>
          }
        </div>
      </div>
    </Shell>
  )
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────

function SuccessScreen({ level, puzzle, tries, solvedGrid, onNext, onHome, onLab }: {
  level: LevelDef; puzzle: PuzzleDef; tries: number; solvedGrid: boolean[][]
  onNext: () => void; onHome: () => void; onLab: () => void
}) {
  const [copied, setCopied] = useState(false)
  const period = level.id === 2 ? getOscillatorPeriod(solvedGrid) : null
  const triesLine = makeTriesLine(tries)
  const shareText = `PETRI · ${level.chapter} #${puzzle.id.split("-")[1]}\n${triesLine}\n\npetri.app`

  const handleShare = async () => {
    if (navigator.share) { try { await navigator.share({ text: shareText }); return } catch {} }
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const failures = tries - 1

  return (
    <Shell>
      <div className="fade-up" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${PETRI.border}`, minHeight: 54 }}>
          <button onClick={onHome} style={ghostBtn}>← Home</button>
          <div style={{ fontSize: 10, letterSpacing: "0.24em", color: level.accent, textTransform: "uppercase", fontWeight: 700 }}>{level.chapter}</div>
          <button onClick={onLab} style={ghostBtn}>Lab →</button>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px" }}>

          {/* Solved label */}
          <div style={{ fontSize: 10, letterSpacing: "0.46em", color: level.accent, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
            {puzzle.successLabel}
          </div>

          {/* Big heading */}
          <h1 style={{ fontSize: 52, fontWeight: 700, letterSpacing: "0.05em", color: PETRI.ink, margin: "0 0 32px", textTransform: "uppercase", lineHeight: 1 }}>
            SOLVED
          </h1>

          {/* Tries dots */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            {Array(failures).fill(null).map((_, i) => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: PETRI.warn, opacity: 0.55 }} />
            ))}
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: PETRI.life, boxShadow: `0 0 8px ${PETRI.life}60` }} />
          </div>

          {/* Tries count */}
          <div style={{ fontSize: 11, letterSpacing: "0.28em", color: PETRI.muted, textTransform: "uppercase", marginBottom: period ? 28 : 40 }}>
            {tries === 1 ? "1 try" : `${tries} tries`}
          </div>

          {/* Period badge for oscillators */}
          {period && (
            <div style={{ marginBottom: 40, padding: "10px 20px", border: `1px solid ${level.accent}30`, borderRadius: 6, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.32em", color: level.accent, textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>
                Period {period}
              </div>
              <div style={{ fontSize: 12, color: PETRI.muted, letterSpacing: "0.06em" }}>
                repeats every {period} generation{period === 1 ? "" : "s"}
              </div>
            </div>
          )}

          {/* Share button */}
          <button
            onClick={handleShare}
            style={{ padding: "11px 26px", background: "transparent", border: `1px solid ${PETRI.border}`, color: PETRI.muted, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer", fontFamily: MONO, borderRadius: 6 }}
          >
            {copied ? "copied" : "share"}
          </button>
        </div>

        <div style={{ padding: "0 20px 28px" }}>
          <button onClick={onNext} style={{ width: "100%", padding: "18px 24px", background: PETRI.ink, color: PETRI.bg, border: "none", fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", fontFamily: MONO, borderRadius: 6 }}>
            Next Puzzle →
          </button>
        </div>
      </div>
    </Shell>
  )
}

// ─── DIGIT GRIDS ─────────────────────────────────────────────────────────────

const DIGIT_GRIDS: Record<number, boolean[][]> = (() => {
  const _ = false, X = true
  return {
    1: [
      [_,_,_,_,_,_,_],
      [_,_,_,X,_,_,_],
      [_,_,X,X,_,_,_],
      [_,_,_,X,_,_,_],
      [_,_,_,X,_,_,_],
      [_,_,_,X,_,_,_],
      [_,_,_,X,_,_,_],
      [_,_,X,X,X,_,_],
      [_,_,_,_,_,_,_],
    ],
    2: [
      [_,_,_,_,_,_,_],
      [_,_,X,X,X,_,_],
      [_,X,_,_,_,X,_],
      [_,_,_,_,_,X,_],
      [_,_,_,_,X,_,_],
      [_,_,_,X,_,_,_],
      [_,_,X,_,_,_,_],
      [_,X,X,X,X,X,_],
      [_,_,_,_,_,_,_],
    ],
  }
})()

// ─── LEVEL INTRO SCREEN ───────────────────────────────────────────────────────

function LevelIntroScreen({ level, onStart }: { level: LevelDef; onStart: () => void }) {
  const numGrid = DIGIT_GRIDS[level.id] ?? DIGIT_GRIDS[1]
  return (
    <Shell>
      <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 28px" }}>
        <div className="fade-up" style={{ paddingTop: 28, paddingBottom: 18, borderBottom: `1px solid ${PETRI.border}` }}>
          <div style={{ fontSize: 9, letterSpacing: "0.38em", color: level.accent, textTransform: "uppercase", fontFamily: MONO, marginBottom: 8 }}>
            Level {String(level.id).padStart(2, "0")}
          </div>
          <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: "0.04em", color: PETRI.ink, fontFamily: MONO, lineHeight: 0.92 }}>
            {level.chapter}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 16, paddingBottom: 16 }}>
          <PetriDishGrid grid={numGrid} maxWidth={230} cellColor={level.accent} showLabels={false} />
        </div>
        <p style={{ fontSize: 13, color: PETRI.muted, letterSpacing: "0.05em", fontFamily: MONO, margin: "0 0 24px", lineHeight: 1.75 }}>
          {level.subtitle}
        </p>
        <div style={{ paddingBottom: 32 }}>
          <div style={{ height: "1px", background: PETRI.border, marginBottom: 18 }} />
          <button
            onClick={onStart}
            style={{ width: "100%", padding: "17px 24px", background: PETRI.ink, color: PETRI.bg, border: "none", fontFamily: MONO, fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", borderRadius: 6 }}
          >
            Begin →
          </button>
        </div>
      </div>
    </Shell>
  )
}

// ─── LEVEL CLEAR SCREEN ───────────────────────────────────────────────────────

function LevelClearScreen({ level, nextLevel, onNext, onHome }: {
  level: LevelDef; nextLevel: LevelDef; onNext: () => void; onHome: () => void
}) {
  const nextGrid = DIGIT_GRIDS[nextLevel.id] ?? DIGIT_GRIDS[1]
  return (
    <Shell>
      <div className="fade-up" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 28px" }}>

        {/* Completed chapter — top */}
        <div style={{ paddingTop: 28, paddingBottom: 20, borderBottom: `1px solid ${PETRI.border}` }}>
          <div style={{ fontSize: 8, letterSpacing: "0.38em", color: PETRI.muted, textTransform: "uppercase", fontFamily: MONO, marginBottom: 10 }}>
            Chapter Complete
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: level.accent, textTransform: "uppercase", fontFamily: MONO, marginBottom: 4 }}>
            {level.chapter}
          </div>
          <div style={{ fontSize: 12, color: PETRI.muted, letterSpacing: "0.06em", lineHeight: 1.65, fontFamily: MONO }}>
            {level.subtitle}
          </div>
        </div>

        {/* Unlocked chapter dish — flex:1 fills the center */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 16, paddingBottom: 16 }}>
          <PetriDishGrid grid={nextGrid} maxWidth={230} cellColor={nextLevel.accent} showLabels={false} />
        </div>

        {/* Unlocked label + CTA — bottom */}
        <div style={{ paddingBottom: 36 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 8, letterSpacing: "0.38em", color: PETRI.muted, textTransform: "uppercase", fontFamily: MONO, marginBottom: 10 }}>
              Unlocked
            </div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: nextLevel.accent, textTransform: "uppercase", fontFamily: MONO, marginBottom: 4 }}>
              {nextLevel.chapter}
            </div>
            <div style={{ fontSize: 12, color: PETRI.muted, letterSpacing: "0.06em", lineHeight: 1.65, fontFamily: MONO }}>
              {nextLevel.subtitle}
            </div>
          </div>
          <div style={{ height: "1px", background: PETRI.border, marginBottom: 20 }} />
          <button onClick={onNext} style={{ width: "100%", padding: "17px 24px", background: PETRI.ink, color: PETRI.bg, border: "none", fontFamily: MONO, fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", borderRadius: 6, marginBottom: 16 }}>
            {nextLevel.chapter} →
          </button>
          <button onClick={onHome} style={{ width: "100%", background: "none", border: "none", color: PETRI.muted, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", fontFamily: MONO, padding: "8px 0" }}>← Home</button>
        </div>
      </div>
    </Shell>
  )
}

// ─── GAME CLEAR ───────────────────────────────────────────────────────────────

function GameClearScreen({ onHome, onLab }: { onHome: () => void; onLab: () => void }) {
  return (
    <Shell>
      <div className="fade-up" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", background: PETRI.ink }}>
        <div style={{ textAlign: "center", width: "100%" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.4em", color: PETRI.life, textTransform: "uppercase", marginBottom: 20 }}>Laboratory Complete</div>
          <h1 style={{ fontSize: 56, fontWeight: 700, letterSpacing: "0.06em", color: PETRI.bg, margin: "0 0 16px" }}>PETRI</h1>
          <p style={{ fontSize: 13, color: `${PETRI.bg}55`, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 36px", lineHeight: 1.9 }}>
            You discovered still lifes.<br />You discovered oscillators.<br />You followed the same path.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <button onClick={onLab} style={{ background: "transparent", border: `1px solid ${PETRI.bg}40`, color: PETRI.bg, padding: "16px 36px", fontFamily: MONO, fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", borderRadius: 6 }}>
              Open the Lab →
            </button>
            <button onClick={onHome} style={{ background: "none", border: "none", color: `${PETRI.bg}35`, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", fontFamily: MONO }}>← Back</button>
          </div>
        </div>
      </div>
    </Shell>
  )
}

// ─── LAB SCREEN ───────────────────────────────────────────────────────────────

function LabScreen({ onBack }: { onBack: () => void }) {
  const [grid, setGrid] = useState<boolean[][]>(makeGrid)
  const [running, setRunning] = useState(false)
  const [gen, setGen] = useState(0)
  const [bornCells, setBornCells] = useState<[number, number][]>([])
  const intRef = useRef<NodeJS.Timeout | null>(null)

  const stop = () => { if (intRef.current) clearInterval(intRef.current) }

  useEffect(() => {
    if (!running) { stop(); return }
    intRef.current = setInterval(() => {
      setGrid(g => {
        const next = stepConway(g)
        const born: [number, number][] = []
        for (let r = 0; r < next.length; r++)
          for (let c = 0; c < next[0].length; c++)
            if (next[r][c] && !g[r][c]) born.push([r, c])
        setBornCells(born)
        setGen(n => n + 1)
        return next
      })
    }, 140)
    return stop
  }, [running])

  const handleToggle = (r: number, c: number) => {
    if (running) return
    setBornCells([])
    setGrid(prev => { const next = cloneGrid(prev); next[r][c] = !next[r][c]; return next })
  }

  const handleStep = () => {
    if (running) return
    setGrid(g => {
      const next = stepConway(g)
      const born: [number, number][] = []
      for (let r = 0; r < next.length; r++)
        for (let c = 0; c < next[0].length; c++)
          if (next[r][c] && !g[r][c]) born.push([r, c])
      setBornCells(born)
      return next
    })
    setGen(n => n + 1)
  }

  const handleClear = () => { stop(); setRunning(false); setGrid(makeGrid()); setGen(0); setBornCells([]) }

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${PETRI.border}`, minHeight: 54 }}>
        <button onClick={onBack} style={ghostBtn}>← Back</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.22em", color: PETRI.ink, textTransform: "uppercase" }}>LAB</div>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: PETRI.muted, textTransform: "uppercase" }}>Free Experiment</div>
        </div>
        <div style={{ fontSize: 10, letterSpacing: "0.15em", color: PETRI.muted, textTransform: "uppercase" }}>Gen {String(gen).padStart(3, "0")}</div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, padding: "8px 12px" }}>
        <PetriDishGrid
          grid={grid}
          onCellClick={!running ? handleToggle : undefined}
          topLabel="LAB · FREE PLAY"
          bottomLabel={`alive · ${String(aliveCount(grid)).padStart(3, "0")}`}
          bornCells={bornCells}
          maxWidth={340}

        />
      </div>

      <div style={{ padding: "12px 20px 28px", borderTop: `1px solid ${PETRI.border}` }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={handleClear} style={{ padding: "15px 16px", background: "transparent", border: `1.5px solid ${PETRI.border}`, color: PETRI.muted, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: MONO, cursor: "pointer", borderRadius: 6, fontWeight: 600 }}>Clear</button>
          <button onClick={handleStep} disabled={running} style={{ padding: "15px 16px", background: "transparent", border: `1.5px solid ${running ? PETRI.border : PETRI.border}`, color: running ? PETRI.border : PETRI.ink, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: MONO, cursor: running ? "not-allowed" : "pointer", borderRadius: 6, fontWeight: 600 }}>Step ▸</button>
          <button onClick={() => setRunning(r => !r)} style={{ flex: 1, padding: "15px 20px", background: running ? PETRI.warn : PETRI.ink, color: PETRI.bg, border: "none", fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", fontFamily: MONO, borderRadius: 6, transition: "background 0.2s" }}>
            {running ? "⏹ Stop" : "▶ Play"}
          </button>
        </div>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", color: PETRI.muted, textTransform: "uppercase", textAlign: "center" }}>
          {running ? "Running · tap Stop to edit" : "Tap cells · Step or Play to advance"}
        </div>
      </div>
    </Shell>
  )
}

// ─── SHELL ────────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes petri-pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes petri-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(18px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .fade-up { animation: fade-up 0.45s cubic-bezier(0.16,1,0.3,1); }
        @media (min-width: 640px) { .petri-shell { border-radius: 32px !important; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.15), 0 0 0 1px ${PETRI.border} !important; } }
      `}</style>
      <div style={{ minHeight: "100dvh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: PETRI.bgFrame }}>
        <div className="petri-shell" style={{ width: "100%", maxWidth: 440, height: "100dvh", maxHeight: "min(100dvh, 900px)", background: PETRI.bg, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: MONO, color: PETRI.ink, backgroundImage: "radial-gradient(circle at 20% 10%, rgba(180,160,120,0.04), transparent 60%)" }}>
          {children}
        </div>
      </div>
    </>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const ghostBtn: React.CSSProperties = {
  background: "transparent", border: "none", color: PETRI.muted,
  fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em",
  textTransform: "uppercase", cursor: "pointer", padding: "4px 0",
}

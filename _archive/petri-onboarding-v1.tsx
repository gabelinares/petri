"use client"

import { useState, useEffect } from "react"
import { PETRI, MONO, PetriDishGrid, stepConway } from "./petri-dish"

// ============================================================
// Types + Props
// ============================================================

interface Props {
  onComplete: () => void
}

type Step = "logo" | "step1" | "step2" | "step3" | "step4" | "step5"

// ============================================================
// Initial patterns for each teaching step
// ============================================================

// Step 1 — empty 3x3 (free tapping)
const EMPTY_3: boolean[][] = [
  [false, false, false],
  [false, false, false],
  [false, false, false],
]

// Step 2 — single organism alone in 3x3
const LONE_CELL: boolean[][] = [
  [false, false, false],
  [false, true, false],
  [false, false, false],
]

// Step 3 — fully packed 3x3 (overcrowding)
const FULL_3: boolean[][] = [
  [true, true, true],
  [true, true, true],
  [true, true, true],
]

// Step 4 — L-shape: the empty center (1,1) has exactly 3 neighbors → birth
const L_SHAPE: boolean[][] = [
  [true, true, false],
  [true, false, false],
  [false, false, false],
]

// Step 5 — 8x8 with 2 isolated cells in opposing corners. Both die on advance.
const STANDOFF_8: boolean[][] = (() => {
  const g = Array(8).fill(null).map(() => Array(8).fill(false))
  g[1][1] = true
  g[6][6] = true
  return g
})()

// ============================================================
// Main
// ============================================================

export default function PetriOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("logo")

  return (
    <PetriFrame>
      {step === "logo" && <LogoScreen onNext={() => setStep("step1")} onSkip={onComplete} />}
      {step === "step1" && <Step1 onNext={() => setStep("step2")} onSkip={onComplete} />}
      {step === "step2" && <Step2 onNext={() => setStep("step3")} onSkip={onComplete} />}
      {step === "step3" && <Step3 onNext={() => setStep("step4")} onSkip={onComplete} />}
      {step === "step4" && <Step4 onNext={() => setStep("step5")} onSkip={onComplete} />}
      {step === "step5" && <Step5 onComplete={onComplete} />}
    </PetriFrame>
  )
}

// ============================================================
// Shared Frame (matches the game phone-frame)
// ============================================================

function PetriFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: PETRI.bgFrame,
        padding: 0,
      }}
    >
      <div
        className="petri-frame"
        style={{
          width: "100%",
          maxWidth: 440,
          height: "100dvh",
          maxHeight: "min(100dvh, 900px)",
          background: PETRI.bg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: MONO,
          color: PETRI.ink,
          position: "relative",
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(180, 160, 120, 0.04), transparent 60%), radial-gradient(circle at 80% 90%, rgba(120, 180, 160, 0.03), transparent 60%)",
        }}
      >
        <style>{`
          @media (min-width: 640px) {
            .petri-frame {
              border-radius: 32px;
              box-shadow: 0 40px 80px -20px rgba(0,0,0,0.15), 0 0 0 1px ${PETRI.border};
            }
          }
          @keyframes petri-fade-in {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes petri-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
          }
          .petri-fade-in { animation: petri-fade-in 0.35s ease-out; }
        `}</style>
        {children}
      </div>
    </div>
  )
}

// ============================================================
// Top bar (shared between logo and step screens)
// ============================================================

function TopBar({
  left,
  middle,
  onSkip,
}: {
  left: string
  middle?: React.ReactNode
  onSkip?: () => void
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        borderBottom: `1px solid ${PETRI.border}`,
        fontSize: 11,
        letterSpacing: "0.18em",
        color: PETRI.muted,
        textTransform: "uppercase",
        minHeight: 52,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: PETRI.life,
            animation: "petri-pulse 2s infinite",
          }}
        />
        <span>{left}</span>
      </div>

      {middle && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: PETRI.ink,
            letterSpacing: "0.18em",
            flex: "0 0 auto",
          }}
        >
          {middle}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        {onSkip ? (
          <button
            onClick={onSkip}
            style={{
              background: "transparent",
              border: `1px solid ${PETRI.border}`,
              color: PETRI.muted,
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.2em",
              cursor: "pointer",
              textTransform: "uppercase",
              padding: "5px 12px",
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            Skip →
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}

// ============================================================
// Logo screen — the pitch
// ============================================================

function LogoScreen({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="petri-fade-in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <TopBar left="Petri Labs · Est MMXXVI" onSkip={onSkip} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "36px 28px 24px",
          minHeight: 0,
        }}
      >
        {/* WORDMARK */}
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <h1
            style={{
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: "0.14em",
              margin: 0,
              lineHeight: 0.9,
              color: PETRI.ink,
            }}
          >
            PETRI
          </h1>
          <div
            style={{
              width: 52,
              height: 1,
              background: PETRI.ink,
              margin: "16px auto",
            }}
          />
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.24em",
              color: PETRI.muted,
              textTransform: "uppercase",
              margin: 0,
              fontWeight: 500,
            }}
          >
            a cellular standoff for two
          </p>
        </div>

        {/* ANIMATED LOGO DISH (beacon oscillator) */}
        <LogoDish />

        {/* SPECIMEN INFO + CTA */}
        <div style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderTop: `1px solid ${PETRI.border}`,
              borderBottom: `1px solid ${PETRI.border}`,
              fontSize: 11,
              letterSpacing: "0.2em",
              color: PETRI.muted,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            <span>Specimen · 001</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: PETRI.life,
                }}
              />
              <span>Live Culture</span>
            </div>
            <span>v 0.1</span>
          </div>

          <button
            onClick={onNext}
            style={{
              width: "100%",
              padding: "18px 24px",
              background: PETRI.ink,
              color: PETRI.bg,
              border: "none",
              fontSize: 13,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: MONO,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              transition: "transform 0.1s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <span>▸</span>
            <span>Begin Experiment</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Animated logo dish — beacon oscillator
// ============================================================

// Beacon pattern: two diagonal 2x2 blocks touching at corners.
// Oscillates period-2 between 8 cells and 6 cells.
const BEACON_INITIAL: boolean[][] = [
  [false, false, false, false, false, false],
  [false, true, true, false, false, false],
  [false, true, true, false, false, false],
  [false, false, false, true, true, false],
  [false, false, false, true, true, false],
  [false, false, false, false, false, false],
]

function LogoDish() {
  const [grid, setGrid] = useState<boolean[][]>(BEACON_INITIAL)

  useEffect(() => {
    const interval = setInterval(() => {
      setGrid((prev) => {
        const next = stepConway(prev)
        // Safety: if somehow extinct, restart
        if (next.flat().every((c) => !c)) return BEACON_INITIAL
        return next
      })
    }, 850)
    return () => clearInterval(interval)
  }, [])

  return <PetriDishGrid grid={grid} maxWidth={260} bottomLabel="live sample" />
}

// ============================================================
// Step Frame — locked layout so nothing jumps between steps
// ============================================================

function StepFrame({
  step,
  title,
  children,
  onSkip,
}: {
  step: number
  title: string
  children: React.ReactNode
  onSkip?: () => void
}) {
  return (
    <div
      className="petri-fade-in"
      style={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      <TopBar
        left={`Tutorial · ${String(step).padStart(2, "0")} / 05`}
        middle="PETRI"
        onSkip={onSkip}
      />

      {/* Locked grid: title (auto) — dish (1fr) — copy (fixed) — button (auto) */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateRows: "auto 1fr auto auto",
          padding: "28px 28px 28px",
          minHeight: 0,
          gap: 16,
        }}
      >
        {/* Title row */}
        <h2
          style={{
            fontSize: 18,
            letterSpacing: "0.22em",
            margin: 0,
            textAlign: "center",
            textTransform: "uppercase",
            fontWeight: 700,
            color: PETRI.ink,
          }}
        >
          {title}
        </h2>

        {/* Dish + copy + button get rendered by children in that order */}
        {children}
      </div>
    </div>
  )
}

// ============================================================
// Shared UI atoms
// ============================================================

function DishSlot({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 0,
      }}
    >
      {children}
    </div>
  )
}

function CopySlot({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: 96,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 8px",
      }}
    >
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.55,
          textAlign: "center",
          color: PETRI.inkSoft,
          margin: 0,
          maxWidth: 340,
          fontFamily: MONO,
        }}
      >
        {children}
      </p>
    </div>
  )
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "18px 24px",
        background: disabled ? "#EDEBE5" : PETRI.ink,
        color: disabled ? PETRI.muted : PETRI.bg,
        border: "none",
        fontSize: 13,
        letterSpacing: "0.26em",
        textTransform: "uppercase",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: MONO,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  )
}

// ============================================================
// STEP 1 — Life & Death (vocabulary)
// ============================================================

function Step1({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [grid, setGrid] = useState<boolean[][]>(EMPTY_3)
  const [interactions, setInteractions] = useState(0)

  const toggle = (r: number, c: number) => {
    setGrid((prev) => prev.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? !cell : cell))))
    setInteractions((n) => n + 1)
  }

  const copy =
    interactions === 0
      ? "Tap the agar to introduce an organism. Tap it again to remove it."
      : interactions === 1
      ? "Nice. Try tapping it again to remove the organism."
      : "You've got it. Let's see how they behave when time passes."

  return (
    <StepFrame step={1} title="Life & Death" onSkip={onSkip}>
      <DishSlot>
        <PetriDishGrid grid={grid} onCellClick={toggle} maxWidth={280} bottomLabel="specimen · blank" />
      </DishSlot>
      <CopySlot>{copy}</CopySlot>
      <PrimaryButton onClick={onNext} disabled={interactions === 0}>
        {interactions === 0 ? "Tap a cell first" : "Next →"}
      </PrimaryButton>
    </StepFrame>
  )
}

// ============================================================
// STEP 2 — Isolation (underpopulation)
// ============================================================

function Step2({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [grid, setGrid] = useState<boolean[][]>(LONE_CELL)
  const [advanced, setAdvanced] = useState(false)

  const advance = () => {
    setGrid(stepConway(grid))
    setAdvanced(true)
  }

  return (
    <StepFrame step={2} title="Isolation" onSkip={onSkip}>
      <DishSlot>
        <PetriDishGrid grid={grid} maxWidth={280} bottomLabel="specimen · lone" />
      </DishSlot>
      <CopySlot>
        {advanced ? (
          <>
            <span style={{ color: PETRI.life, fontWeight: 700 }}>Starved.</span> With fewer than 2 neighbors, a cell always dies.
          </>
        ) : (
          "An organism alone has no neighbors to share nutrients with. Watch what happens when time passes."
        )}
      </CopySlot>
      {advanced ? (
        <PrimaryButton onClick={onNext}>Next →</PrimaryButton>
      ) : (
        <PrimaryButton onClick={advance}>▸ Advance Time</PrimaryButton>
      )}
    </StepFrame>
  )
}

// ============================================================
// STEP 3 — Overcrowding (overpopulation)
// ============================================================

function Step3({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [grid, setGrid] = useState<boolean[][]>(FULL_3)
  const [advanced, setAdvanced] = useState(false)

  const advance = () => {
    setGrid(stepConway(grid))
    setAdvanced(true)
  }

  return (
    <StepFrame step={3} title="Overcrowding" onSkip={onSkip}>
      <DishSlot>
        <PetriDishGrid grid={grid} maxWidth={280} bottomLabel="specimen · packed" />
      </DishSlot>
      <CopySlot>
        {advanced ? (
          <>
            <span style={{ color: PETRI.life, fontWeight: 700 }}>Suffocated.</span> With more than 3 neighbors, a cell always dies.
          </>
        ) : (
          "Pack too many organisms into a single patch and they suffocate each other."
        )}
      </CopySlot>
      {advanced ? (
        <PrimaryButton onClick={onNext}>Next →</PrimaryButton>
      ) : (
        <PrimaryButton onClick={advance}>▸ Advance Time</PrimaryButton>
      )}
    </StepFrame>
  )
}

// ============================================================
// STEP 4 — New Life (birth rule)
// ============================================================

function Step4({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [grid, setGrid] = useState<boolean[][]>(L_SHAPE)
  const [advanced, setAdvanced] = useState(false)

  const advance = () => {
    setGrid(stepConway(grid))
    setAdvanced(true)
  }

  return (
    <StepFrame step={4} title="New Life" onSkip={onSkip}>
      <DishSlot>
        <PetriDishGrid grid={grid} maxWidth={280} bottomLabel="specimen · l-shape" />
      </DishSlot>
      <CopySlot>
        {advanced ? (
          <>
            <span style={{ color: PETRI.life, fontWeight: 700 }}>New cell born.</span> Exactly 3 neighbors creates life from nothing.
          </>
        ) : (
          "When exactly 3 organisms surround an empty patch of agar…"
        )}
      </CopySlot>
      {advanced ? (
        <PrimaryButton onClick={onNext}>Next →</PrimaryButton>
      ) : (
        <PrimaryButton onClick={advance}>▸ Advance Time</PrimaryButton>
      )}
    </StepFrame>
  )
}

// ============================================================
// STEP 5 — The Standoff (win condition, 8x8)
// ============================================================

function Step5({ onComplete }: { onComplete: () => void }) {
  const [grid, setGrid] = useState<boolean[][]>(STANDOFF_8)
  const [won, setWon] = useState(false)

  const advance = () => {
    setGrid(stepConway(grid))
    setWon(true)
  }

  return (
    <StepFrame step={5} title="The Standoff">
      <DishSlot>
        <PetriDishGrid grid={grid} maxWidth={320} bottomLabel="specimen · duel" />
      </DishSlot>
      <CopySlot>
        {won ? (
          <>
            <span style={{ color: PETRI.life, fontWeight: 700 }}>Dish sterilized.</span> On your turn. You win the experiment.
          </>
        ) : (
          "You take turns. Toggle one cell. Advance time. Empty the dish on your own turn to win the experiment."
        )}
      </CopySlot>
      {won ? (
        <PrimaryButton onClick={onComplete}>▸ Play Petri</PrimaryButton>
      ) : (
        <PrimaryButton onClick={advance}>▸ Advance Time</PrimaryButton>
      )}
    </StepFrame>
  )
}

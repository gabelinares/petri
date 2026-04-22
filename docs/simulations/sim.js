#!/usr/bin/env node
/**
 * PETRI — paper-prototype simulator
 *
 * Self-contained Node script. Zero dependencies. Run with:
 *   node docs/simulations/sim.js <scenario.json> [output.md]
 *
 * Reads a scenario JSON, applies Conway's Game of Life (with ownership
 * propagation), and writes a markdown log of every board state, move, and
 * advance. Designed to be cheap — all computation in script, LLM only
 * annotates the final log with strategic analysis.
 *
 * Cell states:
 *   0 = dead
 *   1 = Player 1 (X)
 *   2 = Player 2 (Y)
 *   3 = neutral (contested birth, no clear owner) (*)
 *
 * Ownership on birth:
 *   Majority of the 3 alive parents. Ties → neutral.
 *   (With exactly 3 parents, ties can occur: 1 P1 + 1 P2 + 1 neutral → tie.)
 */

const fs = require('fs')
const path = require('path')

// ============================================================
// Pattern library
//
// Each pattern is a 2D array of 0/1. 0 = off, 1 = on.
// Add new patterns here. Orientations are encoded by naming
// convention (e.g., GliderSE vs GliderNW).
// ============================================================

const PATTERNS = {
  // Still lifes
  Block: [
    [1, 1],
    [1, 1],
  ],
  Beehive: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
  ],
  Loaf: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 0, 1],
    [0, 0, 1, 0],
  ],
  Boat: [
    [1, 1, 0],
    [1, 0, 1],
    [0, 1, 0],
  ],
  Tub: [
    [0, 1, 0],
    [1, 0, 1],
    [0, 1, 0],
  ],

  // Period-2 oscillators
  BlinkerH: [[1, 1, 1]],
  BlinkerV: [[1], [1], [1]],
  Toad: [
    [0, 1, 1, 1],
    [1, 1, 1, 0],
  ],
  Beacon: [
    [1, 1, 0, 0],
    [1, 1, 0, 0],
    [0, 0, 1, 1],
    [0, 0, 1, 1],
  ],

  // Spaceships (glider travels diagonally 1 cell per 4 generations)
  GliderSE: [
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1],
  ],
  GliderSW: [
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
  GliderNE: [
    [1, 1, 1],
    [0, 0, 1],
    [0, 1, 0],
  ],
  GliderNW: [
    [1, 1, 1],
    [1, 0, 0],
    [0, 1, 0],
  ],

  // Methuselahs
  RPent: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 1, 0],
  ],
  Diehard: [
    [0, 0, 0, 0, 0, 0, 1, 0],
    [1, 1, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 1, 1, 1],
  ],
  Acorn: [
    [0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [1, 1, 0, 0, 1, 1, 1],
  ],

  // Eater — canonical Eater 1 (fishhook), 7-cell still life. The previous
  // 6-cell definition was not a valid still life and decayed on contact.
  // This orientation has the "hook notch" facing NW, catching gliders
  // traveling SE. Rotate for other glider directions.
  Eater: [
    [1, 1, 0, 0],
    [1, 0, 0, 0],
    [0, 1, 1, 1],
    [0, 0, 0, 1],
  ],
}

// ============================================================
// Board helpers
// ============================================================

function emptyBoard(rows, cols) {
  return Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0))
}

function cloneBoard(board) {
  return board.map((row) => row.slice())
}

function countCells(board) {
  let p1 = 0
  let p2 = 0
  let neutral = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell === 1) p1++
      else if (cell === 2) p2++
      else if (cell === 3) neutral++
    }
  }
  return { p1, p2, neutral, total: p1 + p2 + neutral }
}

// ============================================================
// Conway step with ownership propagation
// ============================================================

function step(board) {
  const h = board.length
  const w = board[0].length
  const next = emptyBoard(h, w)

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const neighbors = []
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < h && nc >= 0 && nc < w && board[nr][nc] !== 0) {
            neighbors.push(board[nr][nc])
          }
        }
      }
      const n = neighbors.length
      const alive = board[r][c] !== 0

      if (alive) {
        // Survives with 2 or 3 neighbors, keeps current owner
        if (n === 2 || n === 3) next[r][c] = board[r][c]
      } else {
        // Born with exactly 3 neighbors
        if (n === 3) {
          const p1 = neighbors.filter((x) => x === 1).length
          const p2 = neighbors.filter((x) => x === 2).length
          if (p1 > p2) next[r][c] = 1
          else if (p2 > p1) next[r][c] = 2
          else next[r][c] = 3 // tie or all-neutral → neutral
        }
      }
    }
  }

  return next
}

// ============================================================
// Pattern rotation / reflection helpers
// ============================================================

function rotate90(pattern) {
  const h = pattern.length
  const w = pattern[0].length
  const out = Array(w)
    .fill(0)
    .map(() => Array(h).fill(0))
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      out[c][h - 1 - r] = pattern[r][c]
    }
  }
  return out
}

function flipH(pattern) {
  return pattern.map((row) => row.slice().reverse())
}

function transformPattern(pattern, rotation = 0, flip = false) {
  let p = pattern
  if (flip) p = flipH(p)
  const rot = ((rotation % 4) + 4) % 4
  for (let i = 0; i < rot; i++) p = rotate90(p)
  return p
}

// ============================================================
// Placement
// ============================================================

function placePattern(board, patternName, row, col, player, options = {}) {
  const base = PATTERNS[patternName]
  if (!base) throw new Error(`Unknown pattern: ${patternName}`)

  const { rotation = 0, flip = false, allowOverwrite = false } = options
  const pattern = transformPattern(base, rotation, flip)

  const h = board.length
  const w = board[0].length

  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c]) {
        const br = row + r
        const bc = col + c
        if (br >= 0 && br < h && bc >= 0 && bc < w) {
          if (allowOverwrite || board[br][bc] === 0) {
            board[br][bc] = player
          }
        }
      }
    }
  }
  return board
}

// ============================================================
// Rendering
// ============================================================

function render(board) {
  return board
    .map((row) =>
      row
        .map((cell) => {
          if (cell === 0) return '.'
          if (cell === 1) return 'X'
          if (cell === 2) return 'Y'
          if (cell === 3) return '*'
          return '?'
        })
        .join('')
    )
    .join('\n')
}

function renderWithGrid(board) {
  // Render with column numbers at top and row numbers at left, for annotation clarity.
  const w = board[0].length
  const colHeader = '   ' + Array.from({ length: w }, (_, i) => (i % 10).toString()).join('')
  const rows = board.map((row, i) => {
    const idx = i.toString().padStart(2, ' ')
    return `${idx} ${row
      .map((cell) => {
        if (cell === 0) return '.'
        if (cell === 1) return 'X'
        if (cell === 2) return 'Y'
        if (cell === 3) return '*'
        return '?'
      })
      .join('')}`
  })
  return [colHeader, ...rows].join('\n')
}

// ============================================================
// Scenario runner
// ============================================================

function runScenario(scenario) {
  const {
    size,
    rows,
    cols,
    moves,
    advanceSteps = 1,
    initialBoard = null,
  } = scenario

  const h = rows ?? size
  const w = cols ?? size

  let board
  if (initialBoard) {
    // Parse a plaintext board: array of strings
    board = initialBoard.map((rowStr) =>
      rowStr.split('').map((ch) => {
        if (ch === '.') return 0
        if (ch === 'X') return 1
        if (ch === 'Y') return 2
        if (ch === '*') return 3
        return 0
      })
    )
  } else {
    board = emptyBoard(h, w)
  }

  const log = []

  log.push({
    type: 'init',
    board: render(board),
    boardGrid: renderWithGrid(board),
    counts: countCells(board),
  })

  for (let turnIdx = 0; turnIdx < moves.length; turnIdx++) {
    const turn = moves[turnIdx]
    const turnNumber = turnIdx + 1

    for (const action of turn) {
      if (action.type === 'place') {
        board = placePattern(
          board,
          action.pattern,
          action.row,
          action.col,
          action.player,
          {
            rotation: action.rotation || 0,
            flip: action.flip || false,
            allowOverwrite: action.allowOverwrite || false,
          }
        )
        log.push({
          type: 'place',
          turn: turnNumber,
          player: action.player,
          pattern: action.pattern,
          row: action.row,
          col: action.col,
          rotation: action.rotation || 0,
          flip: action.flip || false,
          note: action.note || null,
          board: render(board),
          boardGrid: renderWithGrid(board),
          counts: countCells(board),
        })
      } else if (action.type === 'advance') {
        const stepsThisAdvance = action.steps != null ? action.steps : advanceSteps
        for (let s = 0; s < stepsThisAdvance; s++) {
          board = step(board)
        }
        log.push({
          type: 'advance',
          turn: turnNumber,
          steps: stepsThisAdvance,
          note: action.note || null,
          board: render(board),
          boardGrid: renderWithGrid(board),
          counts: countCells(board),
        })
      }
    }
  }

  return log
}

// ============================================================
// Markdown output
// ============================================================

function toMarkdown(log, scenario) {
  const meta = scenario.meta || {}
  let md = `# ${meta.name || 'Unnamed scenario'}\n\n`
  if (meta.description) md += `> ${meta.description}\n\n`

  md += `## Setup\n\n`
  md += `- **Grid:** ${scenario.rows ?? scenario.size} × ${scenario.cols ?? scenario.size}\n`
  md += `- **Palette:** ${(meta.palette || []).join(', ') || '—'}\n`
  md += `- **Advance steps per turn:** ${scenario.advanceSteps || 1}\n`
  md += `- **Rules:** ${meta.rules || 'Standard Conway + majority-of-parents ownership'}\n`
  if (meta.questions && meta.questions.length) {
    md += `\n### Design questions this scenario tests\n\n`
    for (const q of meta.questions) md += `- ${q}\n`
    md += `\n`
  }
  md += `\n---\n\n`
  md += `## Legend\n\n`
  md += `- \`.\` dead (empty agar)\n`
  md += `- \`X\` Player 1\n`
  md += `- \`Y\` Player 2\n`
  md += `- \`*\` neutral (contested birth)\n\n`
  md += `---\n\n`

  for (const entry of log) {
    if (entry.type === 'init') {
      md += `## Initial state\n\n`
      md += `\`\`\`\n${entry.boardGrid}\n\`\`\`\n`
      md += countsLine(entry.counts) + `\n\n`
    } else if (entry.type === 'place') {
      const playerLabel = entry.player === 1 ? 'P1' : entry.player === 2 ? 'P2' : `P${entry.player}`
      const rotLabel =
        entry.rotation || entry.flip
          ? ` (rot=${entry.rotation * 90}°${entry.flip ? ', flipped' : ''})`
          : ''
      md += `### T${entry.turn} — ${playerLabel} plays \`${entry.pattern}\`${rotLabel} @ (${entry.row},${entry.col})\n\n`
      if (entry.note) md += `> ${entry.note}\n\n`
      md += `\`\`\`\n${entry.boardGrid}\n\`\`\`\n`
      md += countsLine(entry.counts) + `\n\n`
    } else if (entry.type === 'advance') {
      md += `#### ⇢ T${entry.turn} — Advance (${entry.steps} Conway step${entry.steps !== 1 ? 's' : ''})\n\n`
      if (entry.note) md += `> ${entry.note}\n\n`
      md += `\`\`\`\n${entry.boardGrid}\n\`\`\`\n`
      md += countsLine(entry.counts) + `\n\n`
    }
  }

  const final = log[log.length - 1]
  md += `---\n\n## Final state\n\n`
  md += countsLine(final.counts) + `\n\n`
  const winner =
    final.counts.p1 > final.counts.p2
      ? 'P1'
      : final.counts.p2 > final.counts.p1
      ? 'P2'
      : 'Tie'
  md += `**Winner by territory:** ${winner}\n\n`

  md += `---\n\n## Strategic analysis\n\n`
  md += `_This section is for the LLM to annotate after reading the simulation output. Leave empty until analyzed._\n\n`
  md += `### Feel notes\n\n_TODO_\n\n`
  md += `### Decision time per move (estimated)\n\n_TODO_\n\n`
  md += `### What worked\n\n_TODO_\n\n`
  md += `### What broke\n\n_TODO_\n\n`
  md += `### Verdict\n\n_TODO_\n\n`

  return md
}

function countsLine(counts) {
  return `**Counts** · P1: **${counts.p1}** · P2: **${counts.p2}** · Neutral: ${counts.neutral} · Total: ${counts.total}`
}

// ============================================================
// CLI
// ============================================================

function main() {
  const args = process.argv.slice(2)
  if (args.length < 1) {
    console.error(
      'Usage: node sim.js <scenario.json> [output.md]\n' +
        '  If output.md is omitted, writes to ./outputs/<basename>.md'
    )
    process.exit(1)
  }

  const scenarioPath = path.resolve(args[0])
  const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'))

  let outputPath
  if (args[1]) {
    outputPath = path.resolve(args[1])
  } else {
    const scenarioDir = path.dirname(scenarioPath)
    const parentDir = path.dirname(scenarioDir)
    const outputsDir = path.join(parentDir, 'outputs')
    if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true })
    const baseName = path.basename(scenarioPath, '.json')
    outputPath = path.join(outputsDir, `${baseName}.md`)
  }

  const log = runScenario(scenario)
  const md = toMarkdown(log, scenario)
  fs.writeFileSync(outputPath, md)

  const final = log[log.length - 1]
  console.log(`✓ Scenario: ${scenario.meta?.name || path.basename(scenarioPath)}`)
  console.log(`✓ Output:   ${outputPath}`)
  console.log(
    `  Final counts: P1=${final.counts.p1} P2=${final.counts.p2} Neutral=${final.counts.neutral}`
  )
}

if (require.main === module) {
  main()
}

module.exports = {
  PATTERNS,
  emptyBoard,
  step,
  placePattern,
  render,
  renderWithGrid,
  countCells,
  runScenario,
  toMarkdown,
}

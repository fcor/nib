/**
 * Pen-up travel optimization.
 *
 * Reorders polylines (and flips their direction where it helps) so each stroke
 * starts near where the previous one ended, using a greedy nearest-neighbour
 * pass. This never changes stroke shape — only draw order — so the artwork is
 * identical; it just plots with far less wasted pen-up movement.
 *
 * Home is assumed at (0,0), the sheet's top-left (typical plotter origin).
 */

function sqDist(ax, ay, bx, by) {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

export function optimizeTravel(polylines, startX = 0, startY = 0) {
  const n = polylines.length
  if (n <= 1) return polylines

  const used = new Array(n).fill(false)
  const result = []
  let cx = startX
  let cy = startY

  for (let k = 0; k < n; k++) {
    let best = -1
    let bestDist = Infinity
    let bestFlip = false

    for (let i = 0; i < n; i++) {
      if (used[i]) continue
      const line = polylines[i]
      const s = line[0]
      const e = line[line.length - 1]
      const ds = sqDist(cx, cy, s[0], s[1])
      if (ds < bestDist) {
        bestDist = ds
        best = i
        bestFlip = false
      }
      const de = sqDist(cx, cy, e[0], e[1])
      if (de < bestDist) {
        bestDist = de
        best = i
        bestFlip = true
      }
    }

    used[best] = true
    const line = bestFlip ? polylines[best].slice().reverse() : polylines[best]
    result.push(line)
    const last = line[line.length - 1]
    cx = last[0]
    cy = last[1]
  }

  return result
}

/** Total pen-up (tip lifted) travel for polylines drawn in the given order. */
export function penUpTravel(polylines, startX = 0, startY = 0) {
  let total = 0
  let cx = startX
  let cy = startY
  for (const line of polylines) {
    if (!line.length) continue
    total += Math.hypot(line[0][0] - cx, line[0][1] - cy)
    const last = line[line.length - 1]
    cx = last[0]
    cy = last[1]
  }
  return total
}

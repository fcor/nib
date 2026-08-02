/**
 * Fit an image aspect ratio into a paper's drawable area, in millimetres.
 * Returns the centered rectangle { x, y, w, h } the algorithm draws into.
 */
export function computeDrawArea(paper, aspect, margin = 10) {
  const availW = paper.width - margin * 2
  const availH = paper.height - margin * 2
  let w, h
  if (availW / availH > aspect) {
    h = availH
    w = h * aspect
  } else {
    w = availW
    h = w / aspect
  }
  return { x: (paper.width - w) / 2, y: (paper.height - h) / 2, w, h }
}

/** Total pen-down travel length (mm) across all polylines. */
export function pathLength(polylines) {
  let total = 0
  for (const line of polylines) {
    for (let i = 1; i < line.length; i++) {
      total += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1])
    }
  }
  return total
}

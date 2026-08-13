const TAU = Math.PI * 2
const MIN_PLOTTER_MOVE = 0.02 // mm; avoids zero-length paths being discarded

/**
 * Fill a circular mark with one continuous Archimedean spiral.
 *
 * `diameter` describes the outside of the ink, not just the centreline. The
 * outer radius therefore subtracts half a nib. Full turns keep small spirals
 * visually balanced, while a pitch below the nib width makes adjacent turns
 * overlap enough to read as a filled disk.
 */
export function spiralDisk(
  cx,
  cy,
  diameter,
  nibWidth,
  { endAngle = 0, overlap = 0.85 } = {},
) {
  if (
    !Number.isFinite(cx) ||
    !Number.isFinite(cy) ||
    !Number.isFinite(diameter) ||
    !Number.isFinite(nibWidth) ||
    diameter <= 0 ||
    nibWidth <= 0
  ) {
    return []
  }

  const directionX = Math.cos(endAngle)
  const directionY = Math.sin(endAngle)
  const centerlineRadius = Math.max(0, (diameter - nibWidth) / 2)

  // A physical pen cannot make a mark narrower than its nib. Give it a real,
  // tiny movement so SVG consumers and plotter drivers retain the dot.
  if (centerlineRadius <= MIN_PLOTTER_MOVE) {
    const move = Math.max(MIN_PLOTTER_MOVE, centerlineRadius)
    return [
      [cx, cy],
      [cx + directionX * move, cy + directionY * move],
    ]
  }

  const targetPitch = nibWidth * Math.min(0.95, Math.max(0.5, overlap))
  const turns = Math.max(1, Math.ceil(centerlineRadius / targetPitch))
  const thetaMax = turns * TAU
  const radialGrowth = centerlineRadius / thetaMax
  const targetSegment = Math.min(0.3, nibWidth * 0.75)
  const points = [[cx, cy]]
  let theta = 0

  while (theta < thetaMax) {
    const radius = radialGrowth * theta
    const arcRate = Math.hypot(radius, radialGrowth)
    const step = Math.min(Math.PI / 6, targetSegment / arcRate)
    theta = Math.min(thetaMax, theta + step)

    const nextRadius = radialGrowth * theta
    const angle = theta + endAngle
    points.push([
      cx + Math.cos(angle) * nextRadius,
      cy + Math.sin(angle) * nextRadius,
    ])
  }

  return points
}

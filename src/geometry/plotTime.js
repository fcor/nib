const MM_PER_INCH = 25.4

// AxiDraw API 3.9.6 defaults for model 1 (V2/V3), high-resolution motion.
// Kept explicit so a real-world timing comparison can tune the profile later.
export const AXIDRAW_V3_DEFAULT = Object.freeze({
  name: 'AxiDraw V3 default',
  speedDownPercent: 25,
  speedUpPercent: 75,
  accelerationPercent: 75,
  maxSpeedInchesPerSecond: 8.6979,
  accelerationDownInchesPerSecond2: 40,
  accelerationUpInchesPerSecond2: 60,
  penPositionUp: 60,
  penPositionDown: 30,
  penRateRaise: 75,
  penRateLower: 50,
  servoSweepTimeMs: 200,
  servoMoveMinMs: 45,
  servoMoveSlopeMs: 2.69,
  pathJoinThresholdMm: 0.006 * MM_PER_INCH,
  cornering: 10,
  minSegmentMm: 0.000348 * MM_PER_INCH,
  timeSliceSeconds: 0.025,
  minCommandSeconds: 0.001,
  autoRotate: true,
  autoRotateCounterclockwise: true,
})

function distance(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1])
}

function polylineLength(line) {
  let total = 0
  for (let i = 1; i < line.length; i++) {
    total += distance(line[i - 1], line[i])
  }
  return total
}

function machinePoint(point, pageSize, profile) {
  if (
    !profile.autoRotate ||
    !pageSize ||
    pageSize.height <= pageSize.width
  ) {
    return point
  }

  return profile.autoRotateCounterclockwise
    ? [point[1], pageSize.width - point[0]]
    : [pageSize.height - point[1], point[0]]
}

function plannedSegmentDuration(
  distanceMm,
  initialSpeed,
  finalSpeed,
  speedLimit,
  acceleration,
  fallbackSpeed,
  profile,
) {
  if (distanceMm <= 0 || speedLimit <= 0 || acceleration <= 0) return 0

  let vi = Math.min(initialSpeed, speedLimit)
  const vf = Math.min(finalSpeed, speedLimit)
  const timeSlice = profile.timeSliceSeconds
  const accelTime = (speedLimit - vi) / acceleration
  const decelTime = (speedLimit - vf) / acceleration
  const accelDistance =
    vi * accelTime + 0.5 * acceleration * accelTime ** 2
  const decelDistance =
    vf * decelTime + 0.5 * acceleration * decelTime ** 2

  let seconds = 0
  let useConstantSpeed = false

  if (
    distanceMm >
      accelDistance + decelDistance + timeSlice * speedLimit &&
    distanceMm / speedLimit > 4 * timeSlice
  ) {
    if (Math.floor(accelTime / timeSlice) > 0) seconds += accelTime

    const coastDistance = distanceMm - accelDistance - decelDistance
    if (coastDistance > timeSlice * speedLimit) {
      seconds += coastDistance / speedLimit
    }

    if (Math.floor(decelTime / timeSlice) > 0) seconds += decelTime
  } else {
    let localAcceleration = acceleration
    const fullRampDistance = accelDistance + decelDistance

    if (distanceMm >= 0.9 * fullRampDistance && fullRampDistance > 0) {
      localAcceleration =
        0.9 * (fullRampDistance / distanceMm) * acceleration
    }

    let rampUpTime =
      (Math.sqrt(
        2 * vi ** 2 +
          2 * vf ** 2 +
          4 * localAcceleration * distanceMm,
      ) -
        2 * vi) /
      (2 * localAcceleration)
    const peakSpeed = vi + localAcceleration * rampUpTime
    const rampUpIntervals = Math.floor(rampUpTime / timeSlice)

    if (rampUpIntervals === 0) rampUpTime = 0

    const rampDownTime =
      rampUpTime - (vf - vi) / localAcceleration
    const rampDownIntervals = Math.floor(rampDownTime / timeSlice)

    if (rampUpIntervals + rampDownIntervals > 4) {
      if (rampUpIntervals > 0) seconds += rampUpTime
      if (rampDownIntervals > 0) seconds += rampDownTime
    } else {
      vi = (peakSpeed + vi) / 2
      const requestedAcceleration =
        (vf ** 2 - vi ** 2) / (2 * distanceMm)
      const linearAcceleration = Math.max(
        -acceleration,
        Math.min(acceleration, requestedAcceleration),
      )

      if (linearAcceleration === 0) {
        useConstantSpeed = true
      } else {
        const linearTime = (vf - vi) / linearAcceleration
        if (Math.floor(linearTime / timeSlice) > 1) {
          seconds += linearTime
        } else {
          vi = peakSpeed
          useConstantSpeed = true
        }
      }
    }
  }

  if (useConstantSpeed) {
    const constantSpeed = Math.max(vi, vf, fallbackSpeed)
    seconds = distanceMm / constantSpeed
  }

  // EBB motion commands are scheduled in whole milliseconds.
  return Math.max(
    profile.minCommandSeconds,
    Math.round(seconds * 1000) / 1000,
  )
}

function plannedPolylineDuration(
  line,
  speedLimit,
  acceleration,
  fallbackSpeed,
  profile,
) {
  if (line.length < 2) return 0

  const segmentDistances = []
  const segmentVectors = []
  let previous = line[0]

  for (let i = 1; i < line.length; i++) {
    const dx = line[i][0] - previous[0]
    const dy = line[i][1] - previous[1]
    const segmentDistance = Math.hypot(dx, dy)

    if (line.length === 2 || segmentDistance >= profile.minSegmentMm) {
      segmentDistances.push(segmentDistance)
      segmentVectors.push([dx / segmentDistance, dy / segmentDistance])
      previous = line[i]
    }
  }

  if (!segmentDistances.length) return 0

  const speeds = [0]
  const cornerToleranceMm =
    (profile.cornering / 5000) * MM_PER_INCH

  for (let i = 0; i < segmentDistances.length - 1; i++) {
    const reachableSpeed = Math.min(
      speedLimit,
      Math.sqrt(
        speeds[i] ** 2 + 2 * acceleration * segmentDistances[i],
      ),
    )
    const incoming = segmentVectors[i]
    const outgoing = segmentVectors[i + 1]
    const cosineFactor = Math.max(
      -1,
      Math.min(
        1,
        -(
          incoming[0] * outgoing[0] +
          incoming[1] * outgoing[1]
        ),
      ),
    )
    const rootFactor = Math.sqrt((1 - cosineFactor) / 2)
    const denominator = 1 - rootFactor
    const radiusFactor =
      denominator > 0.0001
        ? (cornerToleranceMm * rootFactor) / denominator
        : 100000 * MM_PER_INCH
    const cornerSpeed = Math.sqrt(acceleration * radiusFactor)

    speeds.push(Math.min(reachableSpeed, cornerSpeed))
  }
  speeds.push(0)

  for (let i = segmentDistances.length - 1; i >= 0; i--) {
    const decelerationLimit = Math.sqrt(
      speeds[i + 1] ** 2 + 2 * acceleration * segmentDistances[i],
    )
    speeds[i] = Math.min(speeds[i], decelerationLimit)
  }

  return segmentDistances.reduce(
    (total, segmentDistance, i) =>
      total +
      plannedSegmentDuration(
        segmentDistance,
        speeds[i],
        speeds[i + 1],
        speedLimit,
        acceleration,
        fallbackSpeed,
        profile,
      ),
    0,
  )
}

function servoDurationMs(profile, rate) {
  const travel = Math.abs(profile.penPositionUp - profile.penPositionDown)
  if (travel < 0.9) return 0

  const physicalMove =
    profile.servoMoveSlopeMs * travel + profile.servoMoveMinMs
  const signalSweep = (profile.servoSweepTimeMs * travel) / rate
  return Math.floor((physicalMove ** 4 + signalSweep ** 4) ** 0.25)
}

export function estimateAxiDrawV3(
  layers,
  pageSize = null,
  profile = AXIDRAW_V3_DEFAULT,
) {
  const speedScale =
    (profile.maxSpeedInchesPerSecond * MM_PER_INCH) / 110
  const speedDown = profile.speedDownPercent * speedScale
  const speedUp = profile.speedUpPercent * speedScale
  const accelDown =
    profile.accelerationDownInchesPerSecond2 *
    MM_PER_INCH *
    (profile.accelerationPercent / 100)
  const accelUp =
    profile.accelerationUpInchesPerSecond2 *
    MM_PER_INCH *
    (profile.accelerationPercent / 100)
  const raiseSeconds = servoDurationMs(profile, profile.penRateRaise) / 1000
  const lowerSeconds = servoDurationMs(profile, profile.penRateLower) / 1000

  let seconds = 0
  let penDownMm = 0
  let penUpMm = 0
  let penLifts = 0
  let plottedLayers = 0
  let current = [0, 0]

  for (const layer of layers || []) {
    const paths = layer.polylines.filter((line) => line.length > 1)
    if (!paths.length) continue

    plottedLayers++
    let penIsDown = false

    for (const line of paths) {
      const lineStart = machinePoint(line[0], pageSize, profile)
      const lineEnd = machinePoint(line.at(-1), pageSize, profile)
      const gap = distance(current, lineStart)
      const canJoin =
        penIsDown && gap <= profile.pathJoinThresholdMm

      if (canJoin) {
        penDownMm += gap
        seconds += plannedSegmentDuration(
          gap,
          0,
          0,
          speedDown,
          accelDown,
          speedDown / 10,
          profile,
        )
      } else {
        if (penIsDown) {
          seconds += raiseSeconds
          penLifts++
        }
        penUpMm += gap
        seconds += plannedSegmentDuration(
          gap,
          0,
          0,
          speedUp,
          accelUp,
          speedDown / 10,
          profile,
        )
        seconds += lowerSeconds
        penIsDown = true
      }

      const length = polylineLength(line)
      penDownMm += length
      seconds += plannedPolylineDuration(
        line,
        speedDown,
        accelDown,
        speedDown / 10,
        profile,
      )
      current = lineEnd
    }

    if (penIsDown) {
      seconds += raiseSeconds
      penLifts++
    }
  }

  const homeTravel = distance(current, [0, 0])
  penUpMm += homeTravel
  seconds += plannedSegmentDuration(
    homeTravel,
    0,
    0,
    speedUp,
    accelUp,
    speedDown / 10,
    profile,
  )

  return {
    profile: profile.name,
    seconds,
    penDownMm,
    penUpMm,
    penLifts,
    penChanges: Math.max(0, plottedLayers - 1),
  }
}

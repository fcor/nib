import { serpentine } from './serpentine.js'
import { spiral } from './spiral.js'
import { crosshatch } from './crosshatch.js'

/** Ordered list of available algorithms. Add new techniques here. */
export const algorithms = [serpentine, spiral, crosshatch]

export const algorithmsById = Object.fromEntries(
  algorithms.map((a) => [a.id, a]),
)

/** Build a params object filled with an algorithm's default values. */
export function defaultParams(algorithm) {
  return Object.fromEntries(algorithm.params.map((p) => [p.key, p.default]))
}

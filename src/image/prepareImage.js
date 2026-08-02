const MAX_SAMPLE_DIM = 700

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v
}

function loadHTMLImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * Prepare a source image for sampling.
 *
 * Draws the image (downscaled to at most MAX_SAMPLE_DIM on its long side) to an
 * offscreen canvas once, extracts a grayscale buffer, and returns a bilinear
 * sampler. `sample(nx, ny)` takes normalized coords in [0,1] (y downward) and
 * returns brightness in [0,1] (0 = black, 1 = white).
 */
export async function prepareImage(url) {
  const img = await loadHTMLImage(url)
  const scale = Math.min(1, MAX_SAMPLE_DIM / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    gray[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  }

  return {
    width: w,
    height: h,
    aspect: img.width / img.height,
    sample(nx, ny) {
      const fx = clamp(nx, 0, 1) * (w - 1)
      const fy = clamp(ny, 0, 1) * (h - 1)
      const x0 = Math.floor(fx)
      const y0 = Math.floor(fy)
      const x1 = Math.min(x0 + 1, w - 1)
      const y1 = Math.min(y0 + 1, h - 1)
      const tx = fx - x0
      const ty = fy - y0
      const a = gray[y0 * w + x0]
      const b = gray[y0 * w + x1]
      const c = gray[y1 * w + x0]
      const d = gray[y1 * w + x1]
      const top = a + (b - a) * tx
      const bot = c + (d - c) * tx
      return top + (bot - top) * ty
    },
  }
}

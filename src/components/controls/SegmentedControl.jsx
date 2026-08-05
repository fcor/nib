/**
 * Segmented control with a knockout sliding indicator.
 *
 * Two identical rows of labels are stacked. The lower one is drawn in ink on
 * the surface; the upper one is drawn inverted and clipped to a moving black
 * pill, so a label flips colour exactly as the pill crosses it. The pill and
 * the inverted row slide the same distance in opposite directions — that's
 * what keeps the two copies registered.
 *
 * Segments are equal width, so both offsets are pure percentages of the
 * segment count and nothing has to be measured at runtime.
 */
export default function SegmentedControl({ value, options, onChange }) {
  const index = Math.max(
    0,
    options.findIndex((opt) => opt.value === value),
  )

  return (
    <div
      className="segmented"
      role="group"
      style={{ '--seg-count': options.length, '--seg-index': index }}
    >
      <div className="segmented__row">
        {options.map((opt, i) => (
          <button
            key={opt.value}
            type="button"
            /* The two dividers touching the pill are dropped: relying on the
               pill to cover them leaves a subpixel sliver at some widths. */
            className={
              'segmented__option' +
              (i === index || i === index - 1 ? ' segmented__option--nodiv' : '')
            }
            aria-pressed={opt.value === value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="segmented__fill" aria-hidden="true">
        <div className="segmented__row segmented__row--knockout">
          {options.map((opt) => (
            <span key={opt.value} className="segmented__option">
              {opt.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

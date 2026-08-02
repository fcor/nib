export default function SegmentedControl({ value, options, onChange }) {
  return (
    <div className="segmented" role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={
            'segmented__option' +
            (opt.value === value ? ' segmented__option--active' : '')
          }
          aria-pressed={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

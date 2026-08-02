export default function Select({ label, value, options, onChange }) {
  return (
    <label className="control control--select">
      {label ? <span className="control__label">{label}</span> : null}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function Toggle({ label, value, onChange }) {
  return (
    <label className="control control--toggle">
      <span className="control__label">{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="control__switch" aria-hidden="true" />
    </label>
  )
}

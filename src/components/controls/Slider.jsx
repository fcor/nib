export default function Slider({ label, value, min, max, step, unit, onChange }) {
  return (
    <label className="control control--slider">
      <span className="control__label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="control__value">
        {value}
        {unit ? <span className="control__unit"> {unit}</span> : null}
      </span>
    </label>
  )
}

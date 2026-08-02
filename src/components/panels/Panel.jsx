export default function Panel({ step, title, children }) {
  return (
    <section className="panel">
      <h2 className="panel__title">
        <span className="panel__step">{step}</span>
        {title}
      </h2>
      <div className="panel__body">{children}</div>
    </section>
  )
}

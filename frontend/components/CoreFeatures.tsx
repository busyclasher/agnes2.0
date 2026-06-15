const FEATURES = [
  {
    title: "Sign and label translation",
    copy: "Reads warning signs, PPE notices, chemical labels, and equipment stickers.",
  },
  {
    title: "Risk grading",
    copy: "Uses Green, Yellow, Red, or Unclear so workers understand urgency.",
  },
  {
    title: "Pictogram safety cards",
    copy: "Creates simple visual guidance for multilingual and low-literacy workers.",
  },
  {
    title: "Audio guidance",
    copy: "Reads key instructions aloud while keeping the transcript visible.",
  },
  {
    title: "Incident reporting",
    copy: "Turns worker input into a reviewable incident or near-miss draft.",
  },
  {
    title: "Daily safety briefings",
    copy: "Generates short, site-specific guidance in the worker’s language.",
  },
];

export function CoreFeatures() {
  return (
    <section className="features-section" aria-labelledby="features-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Powered by Agnes AI</p>
          <h2 id="features-title">One multimodal safety workflow</h2>
        </div>
        <span className="agnes-badge">Agnes AI</span>
      </div>
      <div className="features-grid">
        {FEATURES.map((feature, index) => (
          <article key={feature.title}>
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

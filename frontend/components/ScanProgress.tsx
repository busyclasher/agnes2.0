"use client";

import {useEffect, useState} from "react";

const STEPS = [
  "Reading the sign",
  "Translating the warning",
  "Checking the risk",
  "Preparing action guidance",
];

export function ScanProgress() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((current) => Math.min(current + 1, STEPS.length - 1)),
      700,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="progress-card" aria-live="polite">
      <div className="scanner-line" aria-hidden="true" />
      <p className="eyebrow">SafePoint is working</p>
      <h2>{STEPS[active]}</h2>
      <ol className="progress-list">
        {STEPS.map((step, index) => (
          <li key={step} className={index <= active ? "active" : ""}>
            <span aria-hidden="true">{index < active ? "✓" : index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}

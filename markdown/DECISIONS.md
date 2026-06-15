# SafePoint Decision Records

Use this file to record important decisions.

## ADR Template

### ADR-[Number]: [Decision Title]

**Date:** [YYYY-MM-DD]

**Status:** Proposed / Accepted / Superseded / Deprecated

### Context

[What problem or decision are we facing?]

### Decision

[What did we decide?]

### Alternatives Considered

- [Alternative 1]
- [Alternative 2]

### Consequences

Positive:

- [Positive consequence]

Tradeoff:

- [Tradeoff]

---

## ADR-001: Worker-Side First

**Date:** [YYYY-MM-DD]

**Status:** Accepted

### Context

Most safety technology is designed for safety officers, compliance, and management reporting.

### Decision

SafePoint will be worker-side first. The primary interaction is the worker scanning a sign or label at the point of risk.

### Consequences

Positive:

- Clear product differentiation
- Stronger human impact
- Easier demo story

Tradeoff:

- Less immediate enterprise dashboard functionality

---

## ADR-002: Camera-First Flow

**Date:** [YYYY-MM-DD]

**Status:** Accepted

### Context

Workers encounter signs, labels, and notices in the physical environment.

### Decision

SafePoint will prioritize camera scanning over manual text input.

### Consequences

Positive:

- More realistic on-site workflow
- Stronger use of Agnes vision

Tradeoff:

- Requires image quality handling and fallback states

---

## ADR-003: No Official Safety Determination

**Date:** [YYYY-MM-DD]

**Status:** Accepted

### Context

AI can misread signs or classify hazards incorrectly.

### Decision

SafePoint will provide comprehension support, not official safety/legal determinations.

### Consequences

Positive:

- Safer positioning
- Lower legal risk
- More credible pitch

Tradeoff:

- Must use careful wording and supervisor-check prompts

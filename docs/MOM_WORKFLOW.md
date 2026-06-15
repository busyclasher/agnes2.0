# MOM Workflow Alignment

SafePoint prepares a worker-confirmed handoff for a supervisor. It does not
submit an incident report to the Ministry of Manpower and does not make a legal
decision about whether an event is reportable.

This design was checked against MOM guidance available on 15 June 2026.

## Official workflow

MOM states that:

- The employer, workplace occupier, or doctor reports, depending on the event.
- An employee should inform the employer of a work injury or disease
  immediately and provide updates about medical leave.
- Reportable employee accidents include injuries that result in outpatient or
  hospitalisation leave, light duty, death, or an Occupational Disease.
- A workplace occupier reports a Dangerous Occurrence, including when nobody
  is injured.
- Specified serious events require notification to the Commissioner as soon as
  reasonably practicable.
- Fatal and qualifying non-fatal incident reports generally have a 10-day
  deadline.
- Official submissions require reporter and company details, accident details,
  and injured-person employment, injury, medical, and insurance information.
- Employers and occupiers must retain submitted reports for three years.

Official sources:

- [MOM work accident reporting](https://www.mom.gov.sg/workplace-safety-and-health/work-accident-reporting)
- [What and when to report](https://www.mom.gov.sg/workplace-safety-and-health/work-accident-reporting/what-and-when-to-report)
- [Who should report](https://www.mom.gov.sg/workplace-safety-and-health/work-accident-reporting/who-should-report)
- [Report a work-related accident](https://www.mom.gov.sg/workplace-safety-and-health/work-accident-reporting/report-a-work-related-accident)

## SafePoint boundary

SafePoint collects only the first worker account:

- date and time
- location
- worker-selected event category
- known medical outcome
- number of people affected
- witness account
- immediate actions

It then produces:

- a formal English supervisor handoff
- the worker-language account
- deterministic routine, prompt, or urgent review guidance
- a checklist of information still needed for an official report
- an explicit `submitted_to_mom: false` state

SafePoint deliberately does not collect NRIC, FIN, phone numbers, medical
documents, insurance details, employer credentials, or MOM login information
in this release.

## Review priority

`urgent` is used for a reported death or a major equipment or structure event.
The supervisor or occupier must assess immediate Commissioner notification.

`prompt` is used for injury or illness reports, uncertain cases, hospital
treatment, medical leave, light duty, or an unknown medical outcome.

`routine` is used for a near miss or unsafe condition with no known medical
outcome. The supervisor must still assess the facts and reporting route.

These priorities support triage only. They are not official MOM
classifications.

## 30-second briefing

The briefing is a worker-language supplement to the site's official toolbox
talk. It has a 30-second target and includes:

- site zone
- today's tasks
- main hazards
- required PPE
- approved safe-work procedure reminder
- stop-work and supervisor escalation wording when controls are missing

The visible transcript and spoken audio must be identical. Bengali, Tamil, and
Hindi are supported. The briefing does not replace training, risk assessments,
safe-work procedures, permit-to-work controls, or supervisor instructions.

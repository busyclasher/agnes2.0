import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach, describe, expect, it, vi} from "vitest";

import {DailyBriefingForm} from "@/components/DailyBriefingForm";
import {IncidentReportForm} from "@/components/IncidentReportForm";
import {
  generateDailyBriefing,
  generateIncidentReport,
} from "@/lib/api";

vi.mock("@/lib/api", () => ({
  SafePointApiError: class SafePointApiError extends Error {},
  generateDailyBriefing: vi.fn(),
  generateIncidentReport: vi.fn(),
}));

vi.mock("@/lib/download", () => ({
  downloadText: vi.fn(),
  shareText: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/components/AudioGuidance", () => ({
  AudioGuidance: ({text, language}: {text: string; language: string}) => (
    <div data-testid="audio-guidance">
      {language}: {text}
    </div>
  ),
}));

describe("MOM-aligned worker workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an urgent supervisor handoff without claiming MOM submission", async () => {
    const user = userEvent.setup();
    vi.mocked(generateIncidentReport).mockResolvedValue({
      report_id: "report_urgent",
      english_report: "Incident Summary\nA mobile crane toppled.",
      worker_language_summary: "கிரேன் கவிழ்ந்தது.",
      incident_type: "major_equipment_or_structure_event",
      severity: "potential_dangerous_occurrence",
      suggested_next_step: "Stop work and tell the supervisor.",
      mom_workflow: {
        draft_status: "worker_draft_for_supervisor",
        review_priority: "urgent",
        reportability_note: "Escalate now for supervisor assessment.",
        responsible_party_note:
          "SafePoint does not submit to MOM. The occupier reviews the event.",
        deadline_note:
          "Specified serious events may require immediate notification and a report within 10 days.",
        missing_official_fields: [
          "Reporter personal particulars and company details",
        ],
        submitted_to_mom: false,
      },
      requires_confirmation: true,
      source_state: "sample",
    });

    render(<IncidentReportForm language="Tamil" onClose={vi.fn()} />);
    await user.clear(screen.getByLabelText("Location"));
    await user.type(screen.getByLabelText("Location"), "Loading bay");
    await user.selectOptions(
      screen.getByLabelText("What kind of event was it?"),
      "major_equipment_or_structure_event",
    );
    await user.selectOptions(
      screen.getByLabelText("Known medical outcome"),
      "unsure",
    );
    await user.clear(screen.getByLabelText("People affected"));
    await user.type(screen.getByLabelText("People affected"), "0");
    await user.type(
      screen.getByLabelText("What happened? Use Tamil if preferred."),
      "A mobile crane toppled.",
    );
    await user.type(
      screen.getByLabelText("What was done immediately?"),
      "Stopped work and cleared the area.",
    );
    await user.click(
      screen.getByRole("button", {name: "Create report draft"}),
    );

    expect(generateIncidentReport).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "Tamil",
        eventType: "major_equipment_or_structure_event",
        medicalOutcome: "unsure",
        peopleAffected: 0,
      }),
    );
    expect(screen.getByText("URGENT supervisor review")).toBeVisible();
    expect(
      screen.getByText("Still needed for an official MOM report"),
    ).toBeVisible();
    expect(screen.getByText(/SafePoint does not submit to MOM/)).toBeVisible();
    expect(
      screen.getByRole("button", {name: "Save / share reviewed draft"}),
    ).toBeDisabled();
  });

  it("generates a selected-language briefing with a 30-second target", async () => {
    const user = userEvent.setup();
    vi.mocked(generateDailyBriefing).mockResolvedValue({
      language: "Hindi",
      briefing_text: "काम शुरू करने से पहले सुरक्षा हेलमेट जांचें।",
      audio_text: "काम शुरू करने से पहले सुरक्षा हेलमेट जांचें।",
      target_duration_seconds: 30,
      video_prompt: "Create a 30-second briefing.",
      pictogram_prompt: "Create a briefing card.",
      source_state: "sample",
    });

    render(<DailyBriefingForm language="Hindi" onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", {name: "Generate in Hindi"}));

    expect(generateDailyBriefing).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "Hindi",
        requiredPpe: [
          "safety helmet",
          "safety harness",
          "safety boots",
        ],
      }),
    );
    expect(screen.getByText("30-second target")).toBeVisible();
    expect(screen.getByText("Hindi worker briefing")).toBeVisible();
    expect(screen.getByTestId("audio-guidance")).toHaveTextContent(
      "Hindi: काम शुरू करने से पहले सुरक्षा हेलमेट जांचें।",
    );
  });
});

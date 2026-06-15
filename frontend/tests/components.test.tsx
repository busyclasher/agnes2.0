import {render, screen} from "@testing-library/react";
import {describe, expect, it} from "vitest";

import {RiskBadge} from "@/components/RiskBadge";
import {SourceStatePill} from "@/components/SourceStatePill";
import {CoreFeatures} from "@/components/CoreFeatures";

describe("RiskBadge", () => {
  it.each([
    ["red", "Danger"],
    ["yellow", "Caution"],
    ["green", "Information"],
    ["unknown", "Unclear"],
  ] as const)("renders %s with a text label", (level, label) => {
    render(<RiskBadge level={level} label={label} />);
    expect(screen.getByTestId("risk-badge")).toHaveClass(`risk-${level}`);
    expect(screen.getByText(label)).toBeVisible();
  });
});

describe("SourceStatePill", () => {
  it("makes sample data visible", () => {
    render(<SourceStatePill state="sample" />);
    expect(screen.getByRole("status")).toHaveTextContent("Demo sample");
  });

  it("does not label live data", () => {
    const {container} = render(<SourceStatePill state="live" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("CoreFeatures", () => {
  it("credits Agnes AI and includes all six workflows", () => {
    render(<CoreFeatures />);
    expect(screen.getByText("Powered by Agnes AI")).toBeVisible();
    expect(screen.getByText("Sign and label translation")).toBeVisible();
    expect(screen.getByText("Daily safety briefings")).toBeVisible();
  });
});

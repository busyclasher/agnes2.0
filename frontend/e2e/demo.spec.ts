import {expect, test} from "@playwright/test";

const fixtures = {
  "Open edge": {risk: "Danger", hazard: "fall_hazard"},
  "Corrosive chemical": {risk: "Danger", hazard: "chemical_hazard"},
  "PPE required": {risk: "Caution", hazard: "ppe_required"},
};

test("captures a frame from the live rear-camera preview", async ({page}) => {
  await page.goto("/");
  await page.getByRole("button", {name: "Scan sign"}).click();
  await expect(page.getByText("Camera live")).toBeVisible();
  const preview = page.getByLabel("Live camera preview");
  await expect(preview).toBeVisible();
  await expect.poll(
    () => preview.evaluate((video: HTMLVideoElement) => video.videoWidth),
  ).toBeGreaterThan(0);
  await page.getByRole("button", {name: "Capture photo"}).click();
  await expect(
    page.getByRole("button", {name: "Analyse safety sign"}),
  ).toBeEnabled();
});

for (const [sample, expected] of Object.entries(fixtures)) {
  test(`${sample} completes the worker flow`, async ({page}) => {
    await page.route("**/api/scan-safety-image", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          scan_id: "scan_e2e",
          language: "Bengali",
          detected_text: "DEMO SAFETY SIGN",
          translated_text: "ডেমো নিরাপত্তা নির্দেশনা",
          plain_explanation: "This appears to be a safety warning.",
          risk_level: expected.risk === "Danger" ? "red" : "yellow",
          risk_label: expected.risk,
          risk_reason: "A demo warning was detected.",
          hazard_type: expected.hazard,
          ppe_required: [{name: "Safety helmet", icon: "helmet", required: true}],
          action_steps: [{label: "Stop and check the warning.", priority: "high"}],
          audio_text: "Stop and check the warning.",
          confidence: 0.9,
          uncertainty_note: "Demo image is clear.",
          pictogram_prompt: "Demo pictogram.",
          source_state: "sample",
        }),
      });
    });
    await page.route("**/api/generate-pictogram-card", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          image_url: "/api/pictogram-assets/red/demo.svg?language=Bengali",
          alt_text: "Demo pictogram",
          source_state: "sample",
        }),
      });
    });
    await page.route("**/api/pictogram-assets/**", async (route) => {
      await route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#b42318"/></svg>',
      });
    });

    await page.goto("/");
    await page.getByRole("button", {name: new RegExp(sample, "i")}).click();
    await page.getByRole("button", {name: "Analyse safety sign"}).click();
    await expect(page.getByTestId("risk-badge")).toContainText(expected.risk);
    await expect(page.getByText("What to do now")).toBeVisible();
    await expect(page.getByText("Demo sample").first()).toBeVisible();
  });
}

test("incident draft requires confirmation before export", async ({page}) => {
  await page.route("**/api/scan-safety-image", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        scan_id: "scan_report",
        language: "Tamil",
        detected_text: "WET FLOOR",
        translated_text: "ஈரமான தரை",
        plain_explanation: "The floor may be slippery.",
        risk_level: "yellow",
        risk_label: "Caution",
        risk_reason: "A wet floor warning was detected.",
        hazard_type: "slip_hazard",
        ppe_required: [],
        action_steps: [{label: "Walk carefully.", priority: "high"}],
        audio_text: "Walk carefully.",
        confidence: 0.9,
        uncertainty_note: "Demo image is clear.",
        pictogram_prompt: "Wet floor.",
        source_state: "sample",
      }),
    });
  });
  await page.route("**/api/generate-pictogram-card", (route) => route.abort());
  await page.route("**/api/generate-incident-report", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        report_id: "report_e2e",
        english_report: "A worker nearly slipped at the staircase.",
        worker_language_summary: "தொழிலாளர் கிட்டத்தட்ட வழுக்கினார்.",
        incident_type: "slip_trip_fall",
        severity: "near_miss",
        suggested_next_step: "Notify the supervisor and mark the wet area.",
        requires_confirmation: true,
        source_state: "sample",
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Your language").selectOption("Tamil");
  await page.getByRole("button", {name: /Open edge/i}).click();
  await page.getByRole("button", {name: "Analyse safety sign"}).click();
  await page.getByRole("button", {name: "Report incident"}).click();
  await page.getByLabel("What happened?").fill("I slipped near the wet staircase.");
  await page.getByLabel("Location").fill("Level 3 staircase");
  await page.getByRole("button", {name: "Create report draft"}).click();
  const exportButton = page.getByRole("button", {
    name: "Save / share reviewed draft",
  });
  await expect(exportButton).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(exportButton).toBeEnabled();
});

test("daily briefing produces worker-language guidance", async ({page}) => {
  await page.route("**/api/generate-briefing", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        briefing_text: "आज Level 3 क्षेत्र में खुले किनारे का काम है।",
        audio_text: "आज Level 3 क्षेत्र में खुले किनारे का काम है।",
        video_prompt: "Create a calm 30-second safety briefing.",
        pictogram_prompt: "Create a high-contrast fall-hazard briefing card.",
        source_state: "sample",
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Your language").selectOption("Hindi");
  await page.getByRole("button", {name: /Today’s safety briefing/i}).click();
  await page.getByLabel("Site zone").fill("Level 3");
  await page.getByRole("button", {name: "Generate in Hindi"}).click();
  await expect(page.getByText(/आज Level 3/)).toBeVisible();
  await expect(page.getByText("Demo sample")).toBeVisible();
  await expect(page.getByRole("button", {name: "Play audio guidance"})).toBeVisible();
});

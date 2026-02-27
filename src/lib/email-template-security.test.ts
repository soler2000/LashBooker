import assert from "node:assert/strict";
import test from "node:test";

import { renderTemplateString } from "@/lib/email-template-security";

test("formats Date template variables into readable email datetime", () => {
  const rendered = renderTemplateString("Starts: {{startAt}}", {
    startAt: new Date("2026-01-15T10:00:00.000Z"),
  });

  assert.equal(rendered, "Starts: 2026-01-15 at 10:00AM");
});

test("formats ISO date string template variables into readable email datetime", () => {
  const rendered = renderTemplateString("Starts: {{startAt}}", {
    startAt: "2026-01-15T22:05:00.000Z",
  });

  assert.equal(rendered, "Starts: 2026-01-15 at 10:05PM");
});

import assert from "node:assert/strict";
import test from "node:test";
import { adminSettingsUpdateSchema } from "./schema";

test("admin settings schema accepts homepage content fields", () => {
  const parsed = adminSettingsUpdateSchema.safeParse({
    heroTitle: "New hero",
    heroSubtitle: "New subtitle",
    chapter1Title: "Classic",
    chapter1Copy: "Soft",
    bookingCtaBody: "Body text",
  });

  assert.equal(parsed.success, true);
});

test("admin settings schema rejects blank homepage content fields", () => {
  const parsed = adminSettingsUpdateSchema.safeParse({
    heroTitle: "   ",
  });

  assert.equal(parsed.success, false);
  if (!parsed.success) {
    assert.equal(parsed.error.issues[0]?.path.join("."), "heroTitle");
  }
});

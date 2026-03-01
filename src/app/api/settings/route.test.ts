import assert from "node:assert/strict";
import test from "node:test";
import { toPublicSettings } from "./public-settings";

test("toPublicSettings maps homepage content fields", () => {
  const response = toPublicSettings({
    heroTitle: "Custom Hero",
    chapter3Copy: "Custom volume copy",
    bookingCtaBody: "Custom CTA body",
    siteImagesJson: null,
  });

  assert.equal(response.homepageContent.heroTitle, "Custom Hero");
  assert.equal(response.homepageContent.chapter3Copy, "Custom volume copy");
  assert.equal(response.homepageContent.bookingCtaBody, "Custom CTA body");
});

test("toPublicSettings falls back to defaults when values are missing", () => {
  const response = toPublicSettings(null);

  assert.equal(response.homepageContent.heroTitle.length > 0, true);
  assert.equal(response.homepageContent.bookingCtaTitle.length > 0, true);
  assert.equal(Array.isArray(response.qualificationCertificates), true);
});

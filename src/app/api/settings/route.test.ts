import assert from "node:assert/strict";
import test from "node:test";

import { toPublicSettings } from "@/app/api/settings/public-settings";

test("toPublicSettings exposes homepage copy fields", () => {
  const result = toPublicSettings({
    instagramUrl: "https://instagram.com/lashed",
    heroTitle: "Custom Hero",
    heroSubtitle: "Custom subtitle",
    scene2Title: "Scene Two",
    scene2Description: "Scene two body",
    scene3Title: "Scene Three",
    scene3Description: "Scene three body",
    chapter1Title: "C1",
    chapter1Copy: "Copy 1",
    chapter2Title: "C2",
    chapter2Copy: "Copy 2",
    chapter3Title: "C3",
    chapter3Copy: "Copy 3",
    chapter4Title: "C4",
    chapter4Copy: "Copy 4",
    bookingCtaTitle: "CTA",
    bookingCtaBody: "CTA body",
  });

  assert.equal(result.heroTitle, "Custom Hero");
  assert.equal(result.scene2Description, "Scene two body");
  assert.equal(result.chapter4Copy, "Copy 4");
  assert.equal(result.bookingCtaBody, "CTA body");
  assert.equal(result.instagramUrl, "https://instagram.com/lashed");
});

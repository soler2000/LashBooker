import assert from "node:assert/strict";
import test from "node:test";

import { updateSchema } from "@/app/api/admin/settings/schema";

test("updateSchema accepts structured homepage copy fields", () => {
  const parsed = updateSchema.safeParse({
    heroTitle: "Custom hero",
    heroSubtitle: "A subtitle",
    scene2Title: "Scene 2",
    scene2Description: "Description 2",
    scene3Title: "Scene 3",
    scene3Description: "Description 3",
    chapter1Title: "Classic",
    chapter1Copy: "Classic copy",
    chapter2Title: "Hybrid",
    chapter2Copy: "Hybrid copy",
    chapter3Title: "Volume",
    chapter3Copy: "Volume copy",
    chapter4Title: "Refill",
    chapter4Copy: "Refill copy",
    bookingCtaTitle: "Book now",
    bookingCtaBody: "Reserve in minutes",
  });

  assert.equal(parsed.success, true);
});

test("updateSchema rejects blank homepage titles", () => {
  const parsed = updateSchema.safeParse({ heroTitle: "   " });

  assert.equal(parsed.success, false);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_HERO_VIDEO_DATA_URL_LENGTH,
  MAX_SITE_IMAGE_VALUE_LENGTH,
  getMaxSiteImageValueLength,
} from "@/lib/site-images";

test("uses extended data-url limit for hero MP4 values", () => {
  const limit = getMaxSiteImageValueLength("hero", "data:video/mp4;base64,abc123");

  assert.equal(limit, MAX_HERO_VIDEO_DATA_URL_LENGTH);
  assert.ok(limit > MAX_SITE_IMAGE_VALUE_LENGTH);
});

test("uses standard limit for non-video values", () => {
  assert.equal(
    getMaxSiteImageValueLength("hero", "https://cdn.example.com/hero.jpg"),
    MAX_SITE_IMAGE_VALUE_LENGTH,
  );
  assert.equal(
    getMaxSiteImageValueLength("scene2Story", "data:video/mp4;base64,abc123"),
    MAX_SITE_IMAGE_VALUE_LENGTH,
  );
});

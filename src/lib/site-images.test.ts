import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_HERO_VIDEO_DATA_URL_LENGTH,
  MAX_SITE_IMAGE_VALUE_LENGTH,
  getMaxSiteImageValueLength,
} from "@/lib/site-images";

test("uses extended data-url limit for hero video values", () => {
  const mp4Limit = getMaxSiteImageValueLength("hero", "data:video/mp4;base64,abc123");
  const quicktimeLimit = getMaxSiteImageValueLength("hero", "data:video/quicktime;base64,abc123");

  assert.equal(mp4Limit, MAX_HERO_VIDEO_DATA_URL_LENGTH);
  assert.equal(quicktimeLimit, MAX_HERO_VIDEO_DATA_URL_LENGTH);
  assert.ok(mp4Limit > MAX_SITE_IMAGE_VALUE_LENGTH);
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

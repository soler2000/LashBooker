import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultQualificationCertificates,
  isPdfCertificateAsset,
  sanitizeQualificationCertificates,
} from "@/lib/qualification-certificates";

test("keeps valid certificate image values", () => {
  const sanitized = sanitizeQualificationCertificates([
    {
      title: " Volume Certificate ",
      description: " Covers advanced fan placement. ",
      image: " https://cdn.example.com/certs/volume.png ",
    },
  ]);

  assert.deepEqual(sanitized, [
    {
      title: "Volume Certificate",
      description: "Covers advanced fan placement.",
      image: "https://cdn.example.com/certs/volume.png",
    },
  ]);
});

test("drops blank certificate image values", () => {
  const sanitized = sanitizeQualificationCertificates([
    {
      title: "Hygiene Certificate",
      description: "Sanitation and prep standards.",
      image: "   ",
    },
  ]);

  assert.deepEqual(sanitized, [
    {
      title: "Hygiene Certificate",
      description: "Sanitation and prep standards.",
    },
  ]);
});

test("falls back to defaults when certificates are invalid", () => {
  const sanitized = sanitizeQualificationCertificates([
    {
      title: "",
      description: "",
      image: "https://cdn.example.com/invalid.png",
    },
  ]);

  assert.deepEqual(sanitized, defaultQualificationCertificates);
});

test("detects PDF certificate assets", () => {
  assert.equal(isPdfCertificateAsset("data:application/pdf;base64,abc123"), true);
  assert.equal(isPdfCertificateAsset("https://cdn.example.com/certs/lash-training.PDF"), true);
  assert.equal(isPdfCertificateAsset("https://cdn.example.com/certs/lash-training.png"), false);
});

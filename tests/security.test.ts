import test from "node:test";
import assert from "node:assert/strict";
import { jwtVerify } from "jose";
import {
  numberSchema,
  certificateInput,
  publicFields,
} from "../lib/validation";
import { sessionToken } from "../lib/auth";
const sample = {
  certificateNumber: "BSR-2026-001234",
  candidateName: "Demo Candidate",
  examNumber: "DEMO-001",
  examCenter: "Demo Center",
  dateOfBirth: "2005-02-14",
  examDate: "2025-06-20",
  issuedDate: "2025-09-10",
  isVerified: false,
  certificateType: "First School Leaving Certificate",
  institution: "Demo School",
};
test("certificate numbers normalize consistently; query objects are rejected", () => {
  assert.equal(numberSchema.parse(" bsr-2026-001234 "), "BSR-2026-001234");
  assert.equal(numberSchema.safeParse({ $ne: null }).success, false);
  assert.equal(numberSchema.safeParse("x").success, false);
});
test("unverified records remain unverified; arbitrary fields are rejected", () => {
  assert.equal(certificateInput.parse(sample).isVerified, false);
  assert.equal(
    certificateInput.safeParse({ ...sample, createdBy: "spoof" }).success,
    false,
  );
  assert.equal(
    certificateInput.safeParse({ ...sample, isVerified: "false" }).success,
    false,
  );
});
test("impossible dates and reversed chronology fail", () => {
  for (const changes of [
    { dateOfBirth: "2005-02-30" },
    { issuedDate: "2025-06-19" },
    { dateOfBirth: "2025-06-21" },
    { examDate: "2999-01-01" },
  ])
    assert.equal(
      certificateInput.safeParse({ ...sample, ...changes }).success,
      false,
    );
});
test("public projection excludes identifiers and administrative metadata", () => {
  assert.ok(publicFields.includes("-_id"));
  assert.equal(publicFields.includes("createdBy"), false);
  assert.equal(publicFields.includes("passwordHash"), false);
});
test("session has expiry, intended audience, and rejects a tampered signature", async () => {
  process.env.SESSION_SECRET =
    "test-only-secret-that-is-at-least-32-characters";
  const token = await sessionToken("test-admin", 3);
  const key = new TextEncoder().encode(process.env.SESSION_SECRET);
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"],
    issuer: "bsrverifier",
    audience: "bsr-admin",
  });
  assert.equal(payload.sub, "test-admin");
  assert.equal(payload.version, 3);
  assert.equal(payload.exp! - payload.iat!, 8 * 3600);
  const parts = token.split(".");
  parts[2] = (parts[2][0] === "a" ? "b" : "a") + parts[2].slice(1);
  await assert.rejects(jwtVerify(parts.join("."), key));
});

import assert from "node:assert/strict";
import { decodePendingMfa, encodePendingMfa } from "../lib/auth";

const encoded = encodePendingMfa({
  userId: "user-admin",
  deviceId: "BCB-TEST-DEVICE",
  issuedAt: new Date().toISOString()
});

const decoded = decodePendingMfa(encoded);
assert.equal(decoded?.userId, "user-admin");
assert.equal(decoded?.deviceId, "BCB-TEST-DEVICE");

const [body, signature] = encoded.split(".");
const tamperedBody = Buffer.from(
  JSON.stringify({
    userId: "user-chairman",
    deviceId: "BCB-TEST-DEVICE",
    issuedAt: new Date().toISOString()
  })
).toString("base64url");

assert.equal(decodePendingMfa(`${tamperedBody}.${signature}`), null);
assert.equal(decodePendingMfa(`${body}.invalid-signature`), null);

console.log("Auth security tests passed.");

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createHmac } from "node:crypto";
import { authenticateWebhook, verifyHmacSha256 } from "../src/webhook-security.js";
test("rejects unsigned webhooks", async () => {
  assert.equal(await authenticateWebhook({rawBody:Buffer.from("{}"),headers:{}}), "rejected");
});
test("rejects invalid signature and accepts valid HMAC in generic verifier", () => {
  const body=Buffer.from('{"event":"test"}');
  const signature=createHmac("sha256","secret").update(body).digest("hex");
  assert.equal(verifyHmacSha256(body,signature,"secret"),true);
  assert.equal(verifyHmacSha256(body,"0".repeat(64),"secret"),false);
});
test("rejects provider verification errors", async () => {
  assert.equal(await authenticateWebhook({rawBody:Buffer.from("{}"),headers:{}},()=>{throw new Error("bad");}),"rejected");
});
test("rejects oversized webhook", async () => {
  assert.equal(await authenticateWebhook({rawBody:Buffer.alloc(1024*1024+1),headers:{}},()=>true),"rejected");
});

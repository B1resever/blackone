import assert from "node:assert/strict";
import test from "node:test";
import { transitionService } from "../src/b1-lab/service-state.js";

test("complete professional lifecycle", () => {
  let state = transitionService("requested", "begin_search", "dispatcher");
  state = transitionService(state, "offer", "dispatcher");
  state = transitionService(state, "accept", "professional");
  state = transitionService(state, "depart", "professional");
  state = transitionService(state, "arrive", "professional");
  state = transitionService(state, "begin_service", "professional");
  state = transitionService(state, "complete", "professional");
  assert.equal(state, "completed");
});

test("rejects unauthorized roles", () => {
  assert.throws(() => transitionService("offered", "accept", "institution"), /ROLE_NOT_ALLOWED/);
  assert.throws(() => transitionService("in_service", "complete", "dispatcher"), /ROLE_NOT_ALLOWED/);
});

test("rejects invalid and terminal transitions", () => {
  assert.throws(() => transitionService("requested", "complete", "professional"), /INVALID_SERVICE_TRANSITION/);
  assert.throws(() => transitionService("completed", "reassign", "dispatcher"), /INVALID_SERVICE_TRANSITION/);
  assert.throws(() => transitionService("cancelled", "begin_search", "dispatcher"), /INVALID_SERVICE_TRANSITION/);
});

test("allows dispatcher escalation and reassignment", () => {
  assert.equal(transitionService("accepted", "reassign", "dispatcher"), "searching");
  assert.equal(transitionService("arrived", "escalate", "dispatcher"), "escalated");
});

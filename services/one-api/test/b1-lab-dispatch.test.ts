import assert from "node:assert/strict";
import test from "node:test";
import { eligibleCandidates, nextOffer, type ProfessionalCandidate, type ServiceRequest } from "../src/b1-lab/dispatch.js";

const request: ServiceRequest = {
  id: "req-1", tenantId: "lab-a", specialty: "phlebotomy", zone: "33131", status: "requested",
};
const worker = (overrides: Partial<ProfessionalCandidate> = {}): ProfessionalCandidate => ({
  id: "worker-a", specialties: ["phlebotomy"], credentialStatus: "verified",
  eligibleTenantIds: ["lab-a"], available: true, coverageZones: ["33131"],
  activeAssignmentCount: 0, maxConcurrentAssignments: 1, ...overrides,
});

test("only verified, available, tenant-authorized professionals can receive offers", () => {
  const candidates = [
    worker(), worker({ id: "unverified", credentialStatus: "pending" }),
    worker({ id: "other-tenant", eligibleTenantIds: ["lab-b"] }),
    worker({ id: "unavailable", available: false }),
    worker({ id: "wrong-zone", coverageZones: ["33024"] }),
    worker({ id: "at-capacity", activeAssignmentCount: 1 }),
    worker({ id: "wrong-specialty", specialties: ["ekg"] }),
  ];
  assert.deepEqual(eligibleCandidates(request, candidates).map((p) => p.id), ["worker-a"]);
});

test("rejecting an offer advances to the next eligible professional", () => {
  const people = [worker(), worker({ id: "worker-b" })];
  const now = new Date("2026-11-16T15:00:00Z");
  const first = nextOffer(request, people, [], now);
  assert.equal(first?.professionalId, "worker-a");
  const second = nextOffer(request, people, [{ ...first!, decision: "rejected" }], now);
  assert.equal(second?.professionalId, "worker-b");
});

test("active offers block duplicates and expired offers permit reassignment", () => {
  const now = new Date("2026-11-16T15:00:00Z");
  const people = [worker(), worker({ id: "worker-b" })];
  const first = nextOffer(request, people, [], now)!;
  assert.equal(nextOffer(request, people, [first], now), null);
  assert.equal(nextOffer(request, people, [first], new Date(now.getTime() + 91_000))?.professionalId, "worker-b");
});

test("accepted assignments cannot be offered again", () => {
  const accepted = { requestId: request.id, professionalId: "worker-a", expiresAt: "2026-11-16T15:01:00Z", decision: "accepted" as const };
  assert.equal(nextOffer(request, [worker({ id: "worker-b" })], [accepted], new Date("2026-11-16T15:00:00Z")), null);
});

test("invalid status, empty pool and invalid TTL are handled safely", () => {
  const now = new Date("2026-11-16T15:00:00Z");
  assert.equal(nextOffer({ ...request, status: "completed" }, [worker()], [], now), null);
  assert.equal(nextOffer(request, [], [], now), null);
  assert.throws(() => nextOffer(request, [worker()], [], now, 0), RangeError);
});

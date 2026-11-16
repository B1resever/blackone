/**
 * B1 LAB dispatch domain — isolated from passenger transportation.
 * Pure functions: no PHI, payment calls, GPS storage or database mutations.
 * Production adapters must enforce tenant authorization, atomic offer claims,
 * expiry and audit events transactionally.
 */
export type Specialty = "phlebotomy" | "specimen_courier" | "ekg" | "vitals" | "nursing";
export type CredentialStatus = "pending" | "verified" | "expired" | "suspended";
export type ServiceStatus =
  | "requested" | "searching" | "offered" | "accepted" | "en_route"
  | "arrived" | "in_service" | "completed" | "unable_to_complete"
  | "cancelled" | "escalated";

export interface ProfessionalCandidate {
  id: string;
  specialties: readonly Specialty[];
  credentialStatus: CredentialStatus;
  eligibleTenantIds: readonly string[];
  available: boolean;
  coverageZones: readonly string[];
  activeAssignmentCount: number;
  maxConcurrentAssignments: number;
}

export interface ServiceRequest {
  id: string;
  tenantId: string;
  specialty: Specialty;
  zone: string;
  status: ServiceStatus;
}

export function eligibleCandidates(
  request: ServiceRequest,
  professionals: readonly ProfessionalCandidate[],
  excludedIds: ReadonlySet<string> = new Set(),
): ProfessionalCandidate[] {
  if (request.status !== "requested" && request.status !== "searching") return [];
  return professionals
    .filter((p) =>
      !excludedIds.has(p.id) &&
      p.credentialStatus === "verified" &&
      p.available &&
      p.specialties.includes(request.specialty) &&
      p.eligibleTenantIds.includes(request.tenantId) &&
      p.coverageZones.includes(request.zone) &&
      p.activeAssignmentCount < p.maxConcurrentAssignments,
    )
    .sort((a, b) => a.activeAssignmentCount - b.activeAssignmentCount || a.id.localeCompare(b.id));
}

export type OfferDecision = "accepted" | "rejected" | "expired" | "cancelled";
export interface DispatchOffer {
  requestId: string;
  professionalId: string;
  expiresAt: string;
  decision?: OfferDecision;
}

/** One active offer per request; persist with a DB unique constraint/transaction. */
export function nextOffer(
  request: ServiceRequest,
  professionals: readonly ProfessionalCandidate[],
  priorOffers: readonly DispatchOffer[],
  now: Date,
  offerTtlSeconds = 90,
): DispatchOffer | null {
  if (!Number.isSafeInteger(offerTtlSeconds) || offerTtlSeconds < 1 || offerTtlSeconds > 3600) {
    throw new RangeError("Invalid offer TTL");
  }
  if (priorOffers.some((o) => o.requestId === request.id && o.decision === "accepted")) return null;
  if (priorOffers.some((o) => o.requestId === request.id && !o.decision && Date.parse(o.expiresAt) > now.getTime())) return null;
  const excluded = new Set(priorOffers.filter((o) => o.requestId === request.id).map((o) => o.professionalId));
  const candidate = eligibleCandidates(request, professionals, excluded)[0];
  if (!candidate) return null; // caller escalates to dispatcher
  return {
    requestId: request.id,
    professionalId: candidate.id,
    expiresAt: new Date(now.getTime() + offerTtlSeconds * 1000).toISOString(),
  };
}

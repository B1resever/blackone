/**
 * B1 LAB dispatch domain guardrails.
 * Pure, side-effect-free rules; persistence/authentication/locking belong to the API.
 * No PHI is accepted or returned here.
 */
export const LAB_SERVICES = ["phlebotomy","specimen_courier","ekg","vitals","nursing","injections","massage"] as const;
export type LabService = typeof LAB_SERVICES[number];
export type CredentialStatus = "pending" | "verified" | "expired" | "suspended";
export type RequestStatus = "requested" | "searching" | "offered" | "accepted" | "en_route" | "arrived" | "in_service" | "completed" | "unable_to_complete" | "cancelled" | "escalated";
export type ProfessionalEligibility = {
  credentialStatus: CredentialStatus;
  available: boolean;
  specialties: readonly LabService[];
  coverageZones: readonly string[];
  authorizationExpiresAt: string | null;
  maxConcurrentAssignments: number;
  activeAssignments: number;
};
export type DispatchRequest = {
  specialty: LabService;
  coverageZone: string;
  status: RequestStatus;
};
const transitions: Readonly<Record<RequestStatus, readonly RequestStatus[]>> = {
  requested:["searching","cancelled","escalated"],
  searching:["offered","cancelled","escalated"],
  offered:["accepted","searching","cancelled","escalated"],
  accepted:["en_route","unable_to_complete","cancelled","escalated"],
  en_route:["arrived","unable_to_complete","cancelled","escalated"],
  arrived:["in_service","unable_to_complete","escalated"],
  in_service:["completed","unable_to_complete","escalated"],
  completed:[], unable_to_complete:[], cancelled:[], escalated:[]
};
export function canTransition(from: RequestStatus,to: RequestStatus): boolean {
  return transitions[from].includes(to);
}
export function checkEligibility(req: DispatchRequest, p: ProfessionalEligibility, now: Date): { eligible:boolean; reason:string } {
  if(req.status!=="searching") return {eligible:false,reason:"request_not_searching"};
  if(p.credentialStatus!=="verified") return {eligible:false,reason:"credentials_not_verified"};
  if(!p.available) return {eligible:false,reason:"professional_unavailable"};
  if(!p.specialties.includes(req.specialty)) return {eligible:false,reason:"specialty_not_authorized"};
  if(!p.coverageZones.includes(req.coverageZone)) return {eligible:false,reason:"outside_coverage"};
  if(!p.authorizationExpiresAt || !Number.isFinite(Date.parse(p.authorizationExpiresAt)) ||
      Date.parse(p.authorizationExpiresAt)<=now.getTime()) return {eligible:false,reason:"authorization_expired_or_missing"};
  if(!Number.isInteger(p.maxConcurrentAssignments)||p.maxConcurrentAssignments<1||
     !Number.isInteger(p.activeAssignments)||p.activeAssignments<0||
     p.activeAssignments>=p.maxConcurrentAssignments) return {eligible:false,reason:"capacity_exceeded"};
  return {eligible:true,reason:"eligible"};
}
/**
 * These domain checks do not replace primary-source license checks, professional scope,
 * medical orders, insurance, background checks, tenant authorization or transaction locks.
 * Injections and massage are catalog proposals; keep disabled in production pending legal review.
 */

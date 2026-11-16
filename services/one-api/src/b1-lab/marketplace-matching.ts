import {checkEligibility, type ProfessionalEligibility, type LabService} from "./dispatch-rules.js";
export type MarketplaceCandidate={professionalId:string;eligibility:ProfessionalEligibility};
export type OfferCandidateResult={professionalId:string;eligible:boolean;reason:string};
const enabled=new Set<LabService>(["phlebotomy","specimen_courier"]);
/** Deterministic preselection only. API must verify credentials and authorization again
 * inside a transaction before dispatching or accepting offers.
 */
export function shortlistMarketplaceProfessionals(input:{
 specialty:LabService;coverageZone:string;candidates:readonly MarketplaceCandidate[];now:Date;
}):OfferCandidateResult[]{
 if(!enabled.has(input.specialty))return input.candidates.map(x=>({professionalId:x.professionalId,eligible:false,reason:"service_not_enabled"}));
 const seen=new Set<string>();
 return input.candidates.map(({professionalId,eligibility})=>{
  if(seen.has(professionalId))return {professionalId,eligible:false,reason:"duplicate_professional"};
  seen.add(professionalId);
  const decision=checkEligibility({specialty:input.specialty,coverageZone:input.coverageZone,status:"searching"},eligibility,input.now);
  return {professionalId,...decision};
 });
}

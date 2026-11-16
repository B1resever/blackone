import {validateWorkOrderDraft, type WorkOrderDraft} from "./work-order.js";
import {shortlistMarketplaceProfessionals, type MarketplaceCandidate} from "./marketplace-matching.js";
import {validateJobTransition, type JobState, type ActorRole} from "./marketplace-state.js";
import {calculateJobSettlement, type JobSettlement} from "./marketplace-economics.js";
export type WorkflowJob={draft:WorkOrderDraft;state:JobState;acceptedProfessionalId:string|null;offeredProfessionalIds:readonly string[];settlement:JobSettlement|null};
export type WorkflowResult={ok:true;job:WorkflowJob}|{ok:false;errors:string[]};
/** In-memory deterministic domain orchestration for synthetic integration tests.
 * NOT an authenticated API, durable storage, payment processor or production dispatcher.
 */
export function createWorkflow(raw:unknown,now:Date):WorkflowResult{
 const checked=validateWorkOrderDraft(raw,now);
 if(!checked.ok)return {ok:false,errors:checked.errors};
 return {ok:true,job:{draft:checked.value,state:"created",acceptedProfessionalId:null,offeredProfessionalIds:[],settlement:null}};
}
export function offerWorkflow(job:WorkflowJob,candidates:readonly MarketplaceCandidate[],now:Date):WorkflowResult{
 const transition=validateJobTransition({from:job.state,to:"offered",actor:"system",hasAcceptedProfessional:false});
 if(!transition.ok)return {ok:false,errors:[transition.reason]};
 const eligible=shortlistMarketplaceProfessionals({specialty:job.draft.specialty,coverageZone:job.draft.coverageZone,candidates,now}).filter(x=>x.eligible).map(x=>x.professionalId);
 if(!eligible.length)return {ok:false,errors:["no_eligible_professionals"]};
 return {ok:true,job:{...job,state:"offered",offeredProfessionalIds:eligible}};
}
export function acceptWorkflow(job:WorkflowJob,professionalId:string):WorkflowResult{
 if(!job.offeredProfessionalIds.includes(professionalId))return {ok:false,errors:["professional_not_offered"]};
 if(job.acceptedProfessionalId!==null)return {ok:false,errors:["already_assigned"]};
 const transition=validateJobTransition({from:job.state,to:"accepted",actor:"professional",hasAcceptedProfessional:false});
 if(!transition.ok)return {ok:false,errors:[transition.reason]};
 return {ok:true,job:{...job,state:"accepted",acceptedProfessionalId:professionalId}};
}
export function progressWorkflow(job:WorkflowJob,to:"in_progress"|"completed",actor:ActorRole,completionConfirmed=false):WorkflowResult{
 const transition=validateJobTransition({from:job.state,to,actor,hasAcceptedProfessional:job.acceptedProfessionalId!==null,completionConfirmed});
 if(!transition.ok)return {ok:false,errors:[transition.reason]};
 return {ok:true,job:{...job,state:to}};
}
export function quoteCompletedJob(job:WorkflowJob,commissionBps:number):WorkflowResult{
 if(job.state!=="completed"||!job.acceptedProfessionalId)return {ok:false,errors:["job_not_completed"]};
 try{return {ok:true,job:{...job,settlement:calculateJobSettlement({grossCents:job.draft.offeredCompensationCents,commissionBps})}}}
 catch{return {ok:false,errors:["invalid_commission"]}}
}

export type JobState="created"|"offered"|"accepted"|"in_progress"|"completed"|"declined"|"expired"|"cancelled"|"disputed";
export type ActorRole="organization"|"professional"|"system"|"admin";
export type TransitionInput={from:JobState;to:JobState;actor:ActorRole;hasAcceptedProfessional:boolean;completionConfirmed?:boolean};
export type TransitionResult={ok:true}|{ok:false;reason:"invalid_transition"|"not_assigned"|"completion_not_confirmed"};
const allowed:Record<JobState,Partial<Record<JobState,readonly ActorRole[]>>>={
 created:{offered:["system","admin"],cancelled:["organization","admin"]},
 offered:{accepted:["professional"],declined:["professional"],expired:["system"],cancelled:["organization","admin"]},
 accepted:{in_progress:["professional"],cancelled:["organization","admin"],disputed:["organization","professional","admin"]},
 in_progress:{completed:["organization","admin"],disputed:["organization","professional","admin"]},
 completed:{disputed:["organization","professional","admin"]},
 declined:{},expired:{},cancelled:{},disputed:{}
};
export function validateJobTransition(x:TransitionInput):TransitionResult {
 if(!allowed[x.from]?.[x.to]?.includes(x.actor))return {ok:false,reason:"invalid_transition"};
 if(["in_progress","completed"].includes(x.to)&&!x.hasAcceptedProfessional)return {ok:false,reason:"not_assigned"};
 if(x.to==="completed"&&!x.completionConfirmed)return {ok:false,reason:"completion_not_confirmed"};
 return {ok:true};
}
// API must separately verify authenticated role, tenant, professional ownership and transaction locks.

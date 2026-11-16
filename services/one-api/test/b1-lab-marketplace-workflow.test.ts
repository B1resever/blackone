import test from "node:test";
import assert from "node:assert/strict";
import {createWorkflow,offerWorkflow,acceptWorkflow,progressWorkflow,quoteCompletedJob} from "../src/b1-lab/marketplace-workflow.ts";
const now=new Date("2026-11-16T12:00:00Z");
const draft={organizationId:"11111111-1111-4111-8111-111111111111",specialty:"phlebotomy",coverageZone:"miami-dade",scheduledAt:"2026-11-17T12:00:00Z",offeredCompensationCents:8000,requesterReference:"TEST-1"};
const candidate={professionalId:"pro-1",eligibility:{credentialStatus:"verified" as const,available:true,specialties:["phlebotomy" as const],coverageZones:["miami-dade"],authorizationExpiresAt:"2027-01-01T00:00:00Z",maxConcurrentAssignments:1,activeAssignments:0}};
function ok<T extends {ok:boolean}>(x:T):Extract<T,{ok:true}>{assert.equal(x.ok,true,JSON.stringify(x));return x as Extract<T,{ok:true}>}
test("synthetic end-to-end job lifecycle and settlement quote",()=>{
 let j=ok(createWorkflow(draft,now)).job;
 j=ok(offerWorkflow(j,[candidate],now)).job;
 j=ok(acceptWorkflow(j,"pro-1")).job;
 j=ok(progressWorkflow(j,"in_progress","professional")).job;
 assert.equal(progressWorkflow(j,"completed","organization").ok,false);
 j=ok(progressWorkflow(j,"completed","organization",true)).job;
 j=ok(quoteCompletedJob(j,1000)).job;
 assert.equal(j.settlement?.platformCommissionCents,800);
 assert.equal(j.settlement?.professionalAmountCents,7200);
});
test("unverified professional cannot be offered",()=>{
 const j=ok(createWorkflow(draft,now)).job;
 assert.deepEqual(offerWorkflow(j,[{...candidate,eligibility:{...candidate.eligibility,credentialStatus:"pending"}}],now),{ok:false,errors:["no_eligible_professionals"]});
});
test("unauthorized professional cannot accept",()=>{
 const j=ok(offerWorkflow(ok(createWorkflow(draft,now)).job,[candidate],now)).job;
 assert.deepEqual(acceptWorkflow(j,"stranger"),{ok:false,errors:["professional_not_offered"]});
});
test("cannot quote before completion",()=>assert.deepEqual(quoteCompletedJob(ok(createWorkflow(draft,now)).job,1000),{ok:false,errors:["job_not_completed"]}));

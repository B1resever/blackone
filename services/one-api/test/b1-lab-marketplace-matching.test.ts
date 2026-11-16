import test from "node:test";
import assert from "node:assert/strict";
import {shortlistMarketplaceProfessionals} from "../src/b1-lab/marketplace-matching.ts";
const now=new Date("2026-11-16T12:00:00Z");
const eligible={credentialStatus:"verified" as const,available:true,specialties:["phlebotomy" as const],coverageZones:["miami-dade"],authorizationExpiresAt:"2027-01-01T00:00:00Z",maxConcurrentAssignments:1,activeAssignments:0};
test("shortlists verified professional in service zone",()=>assert.deepEqual(shortlistMarketplaceProfessionals({specialty:"phlebotomy",coverageZone:"miami-dade",now,candidates:[{professionalId:"p1",eligibility:eligible}]}),[{professionalId:"p1",eligible:true,reason:"eligible"}]));
test("excludes unavailable and unverified",()=>{const results=shortlistMarketplaceProfessionals({specialty:"phlebotomy",coverageZone:"miami-dade",now,candidates:[{professionalId:"p1",eligibility:{...eligible,available:false}},{professionalId:"p2",eligibility:{...eligible,credentialStatus:"pending"}}]});assert.equal(results.filter(x=>x.eligible).length,0)});
test("disables unapproved massage",()=>assert.equal(shortlistMarketplaceProfessionals({specialty:"massage",coverageZone:"miami-dade",now,candidates:[{professionalId:"p1",eligibility:eligible}]} )[0].reason,"service_not_enabled"));
test("deduplicates professional offers",()=>assert.equal(shortlistMarketplaceProfessionals({specialty:"phlebotomy",coverageZone:"miami-dade",now,candidates:[{professionalId:"p1",eligibility:eligible},{professionalId:"p1",eligibility:eligible}]} )[1].reason,"duplicate_professional"));

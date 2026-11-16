import test from "node:test";
import assert from "node:assert/strict";
import {calculateJobSettlement,calculateMonthlyPlatformRevenue} from "../src/b1-lab/marketplace-economics.ts";
test("splits completed $80 job at 10 percent",()=>assert.deepEqual(calculateJobSettlement({grossCents:8000,commissionBps:1000}),{grossCents:8000,refundCents:0,netServiceCents:8000,platformCommissionCents:800,professionalAmountCents:7200}));
test("prorates commission on partial refund",()=>{const x=calculateJobSettlement({grossCents:8000,refundCents:2000,commissionBps:1000});assert.equal(x.platformCommissionCents,600);assert.equal(x.professionalAmountCents,5400)});
test("full refund has zero commission",()=>assert.equal(calculateJobSettlement({grossCents:8000,refundCents:8000,commissionBps:1000}).platformCommissionCents,0));
test("rejects invalid amounts and commission",()=>{for(const input of [{grossCents:-1,commissionBps:1000},{grossCents:10,refundCents:11,commissionBps:1000},{grossCents:10,commissionBps:10001},{grossCents:10.5,commissionBps:1000}])assert.throws(()=>calculateJobSettlement(input))});
test("subscription plus job commissions",()=>{const settlements=Array.from({length:20},()=>calculateJobSettlement({grossCents:8000,commissionBps:1000}));assert.equal(calculateMonthlyPlatformRevenue({subscriptionCents:2500,settlements}),18500)});

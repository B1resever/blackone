import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readInbox, routeAuthorized } from "../src/inbox-api.js";
import type { InboxItem } from "../src/inbox.js";
test("store returning all projects still cannot leak across tenants", async () => {
 const rows: InboxItem[] = [
  {id:"p",project:"granelli-property",status:"new",createdAt:"2026-11-04",lastActivityAt:"2026-11-04",language:"es"},
  {id:"b",project:"black-one",status:"new",createdAt:"2026-11-04",lastActivityAt:"2026-11-04",language:"en"}
 ];
 const result=await readInbox({listForProjects:async()=>rows},{subject:"agent-1",role:"agent",allowedProjects:new Set(["granelli-property" as const])});
 assert.deepEqual(result.items.map(x=>x.id),["p"]);
 assert.equal(result.metrics.total,1);
});
test("cannot read inbox with empty permissions", async () => {
 await assert.rejects(readInbox({listForProjects:async()=>[]},{subject:"agent-1",role:"agent",allowedProjects:new Set()}));
});
test("routing principal cannot route into unauthorized project",()=>{
 const result=routeAuthorized({eventId:"1",conversationId:"1",channel:"whatsapp",text:"reserva de viaje"},
 {enabledProjects:new Set(["black-one"]),agentPermissions:[{agentId:"b",project:"black-one",canReply:true,canEscalate:true}],seenEventIds:new Set()},
 {subject:"p",role:"agent",allowedProjects:new Set(["granelli-property"])});
 assert.equal(result.status,"human_review");
});

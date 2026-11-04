import { test } from "node:test";
import { strict as assert } from "node:assert";
import { MemoryInboxStore } from "../src/memory-store.js";
import { readInbox } from "../src/inbox-api.js";
test("in-memory adapter deduplicates and isolates project data", async()=>{
 const store=new MemoryInboxStore();
 const item={id:"evt-1",project:"granelli-property" as const,status:"new" as const,createdAt:"2026-11-04T10:00:00Z",lastActivityAt:"2026-11-04T10:00:00Z",language:"es" as const};
 assert.equal(store.insert(item),true);
 assert.equal(store.insert(item),false);
 const result=await readInbox(store,{subject:"user-1",role:"supervisor",allowedProjects:new Set(["black-one" as const])});
 assert.equal(result.metrics.total,0);
});

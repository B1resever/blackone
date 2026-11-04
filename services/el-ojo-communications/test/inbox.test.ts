import { test } from "node:test";
import { strict as assert } from "node:assert";
import { inboxMetrics, listInbox, type InboxItem } from "../src/inbox.js";
const items: InboxItem[] = [
 {id:"a",project:"granelli-property",status:"new",createdAt:"2026-11-04T10:00:00Z",lastActivityAt:"2026-11-04T10:00:00Z",language:"es"},
 {id:"b",project:"black-one",status:"human_review",createdAt:"2026-11-04T11:00:00Z",lastActivityAt:"2026-11-04T11:00:00Z",language:"en"}
];
test("project isolation in inbox",()=>{
 const viewer={role:"agent" as const,allowedProjects:new Set(["granelli-property" as const])};
 assert.deepEqual(listInbox(items,viewer).map(i=>i.id),["a"]);
 assert.deepEqual(inboxMetrics(items,viewer),{total:1,pending:1,humanReview:0,resolved:0});
});

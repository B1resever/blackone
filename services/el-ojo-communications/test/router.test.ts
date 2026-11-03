import { strict as assert } from "node:assert";
import { test } from "node:test";
import { routeIncoming, type RoutingContext, type Incoming } from "../src/router.js";
const context = (): RoutingContext => ({
  enabledProjects: new Set(["granelli-property", "black-one", "nodo-applications"]),
  agentPermissions: [{agentId:"property-agent",project:"granelli-property",canReply:true,canEscalate:true}],
  seenEventIds: new Set(),
});
const event = (text:string,id="event-1"): Incoming => ({eventId:id,conversationId:"conv-1",channel:"whatsapp",text});
test("routes authorized property messages", () => {
  const r=routeIncoming(event("Quiero comprar una propiedad"),context());
  assert.equal(r.status,"routed"); assert.equal(r.project,"granelli-property");
});
test("rejects duplicate webhook event", () => {
  const c=context();routeIncoming(event("Quiero comprar una propiedad"),c);
  assert.equal(routeIncoming(event("Quiero comprar una propiedad"),c).status,"duplicate");
});
test("never crosses a pinned tenant automatically", () => {
  const c=context();c.existingConversationProject="granelli-property";
  assert.equal(routeIncoming(event("Necesito reserva de viaje"),c).status,"human_review");
});
test("requires authorized agent", () => {
  assert.equal(routeIncoming(event("Necesito reserva de viaje"),context()).reason,"no_authorized_agent");
});
test("does not route ambiguous text", () => {
  assert.equal(routeIncoming(event("Hello"),context()).status,"clarification");
});
test("blocks unapproved clinical and minors flows", () => {
  const c=context();c.enabledProjects=new Set(["open-research","family-game"]);
  c.agentPermissions=[{agentId:"a",project:"open-research",canReply:true,canEscalate:true}];
  assert.equal(routeIncoming(event("clinical trial"),c).status,"human_review");
});

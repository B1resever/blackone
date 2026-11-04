import type { Incoming, ProjectId, RoutingContext, RoutingResult } from "./router.js";
import { routeIncoming } from "./router.js";
import { inboxMetrics, listInbox, type InboxItem, type InboxViewer } from "./inbox.js";

/** Pure application service. HTTP authentication and persistent stores must be supplied by the host. */
export interface InboxStore {
  listForProjects(projects: ReadonlySet<ProjectId>): Promise<readonly InboxItem[]>;
}
export type Principal = Readonly<{
  subject: string;
  allowedProjects: ReadonlySet<ProjectId>;
  role: "agent" | "supervisor";
}>;
export async function readInbox(store: InboxStore, principal: Principal) {
  if (!principal.subject || principal.allowedProjects.size === 0) throw new Error("unauthorized");
  const viewer: InboxViewer = {role: principal.role, allowedProjects: principal.allowedProjects};
  const rows = await store.listForProjects(principal.allowedProjects);
  // Defense in depth: never trust storage filters alone.
  return {items: listInbox(rows, viewer), metrics: inboxMetrics(rows, viewer)};
}
export function routeAuthorized(event: Incoming, context: RoutingContext, principal: Principal): RoutingResult {
  if (!principal.subject || principal.allowedProjects.size === 0) throw new Error("unauthorized");
  const enabled = new Set([...context.enabledProjects].filter(id => principal.allowedProjects.has(id)));
  return routeIncoming(event, {...context, enabledProjects: enabled});
}

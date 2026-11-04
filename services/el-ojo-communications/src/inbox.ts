import type { ProjectId } from "./router.js";
export type InboxStatus = "new" | "assigned" | "human_review" | "resolved";
export type InboxItem = Readonly<{
  id: string;
  project: ProjectId;
  status: InboxStatus;
  assignedAgentId?: string;
  createdAt: string;
  lastActivityAt: string;
  language: "es" | "en";
  /** No message bodies in the cross-project overview. */
}>;
export type InboxViewer = Readonly<{
  role: "supervisor" | "agent";
  allowedProjects: ReadonlySet<ProjectId>;
}>;
export function listInbox(items: readonly InboxItem[], viewer: InboxViewer): InboxItem[] {
  return items.filter(item => viewer.allowedProjects.has(item.project))
    .sort((a,b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}
export function inboxMetrics(items: readonly InboxItem[], viewer: InboxViewer) {
  const visible = listInbox(items, viewer);
  return {
    total: visible.length,
    pending: visible.filter(item => item.status !== "resolved").length,
    humanReview: visible.filter(item => item.status === "human_review").length,
    resolved: visible.filter(item => item.status === "resolved").length,
  };
}

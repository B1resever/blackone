import type { InboxItem } from "./inbox.js";
import type { InboxStore } from "./inbox-api.js";
import type { ProjectId } from "./router.js";

/** Test-only implementation; never use for production messages. */
export class MemoryInboxStore implements InboxStore {
  private readonly items = new Map<string, InboxItem>();
  constructor(initial: readonly InboxItem[] = []) { for (const item of initial) this.items.set(item.id, item); }
  async listForProjects(projects: ReadonlySet<ProjectId>): Promise<readonly InboxItem[]> {
    return [...this.items.values()].filter(item => projects.has(item.project));
  }
  insert(item: InboxItem): boolean {
    if (this.items.has(item.id)) return false;
    this.items.set(item.id, item);
    return true;
  }
}

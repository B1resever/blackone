/**
 * EL OJO Communications: isolated, provider-neutral routing foundation.
 * No network access, no outbound messaging, no clinical content persistence.
 */
export type ProjectId =
  | "granelli-property" | "nodo-applications" | "black-one"
  | "nodo-facility" | "open-research" | "nodo-property-manager"
  | "nodo-adultos-mayores" | "family-game";
export type Language = "es" | "en";
export type Incoming = Readonly<{
  eventId: string;
  conversationId: string;
  channel: "whatsapp";
  text: string;
  projectHint?: ProjectId;
  language?: Language;
}>;
export type RoutingResult = Readonly<{
  eventId: string;
  conversationId: string;
  status: "routed" | "clarification" | "human_review" | "duplicate";
  project?: ProjectId;
  language: Language;
  reason: string;
}>;
export type AgentPermission = Readonly<{
  agentId: string;
  project: ProjectId;
  canReply: boolean;
  canEscalate: boolean;
}>;
export type RoutingContext = {
  enabledProjects: ReadonlySet<ProjectId>;
  agentPermissions: readonly AgentPermission[];
  seenEventIds: Set<string>;
  existingConversationProject?: ProjectId;
};

const TERMS: ReadonlyArray<readonly [ProjectId, RegExp]> = [
  ["granelli-property", /\b(property|real estate|realtor|casa|propiedad|comprar|vender|listing)\b/i],
  ["nodo-applications", /\b(application|solicitud|screening|aplicaci[oó]n|documentaci[oó]n)\b/i],
  ["black-one", /\b(black one|b1|chofer|chauffeur|ride|transport|reserva de viaje)\b/i],
  ["nodo-facility", /\b(facility|maintenance|mantenimiento|work order|equipo t[eé]cnico)\b/i],
  ["open-research", /\b(research|investigaci[oó]n|clinical trial|estudio cl[ií]nico)\b/i],
  ["nodo-adultos-mayores", /\b(adultos mayores|senior services)\b/i],
  ["family-game", /\b(family game|arcade|juegos)\b/i],
];
export function detectLanguage(text: string): Language {
  return /\b(hola|quiero|necesito|consulta|gracias|solicitud|propiedad|reserva)\b/i.test(text) ? "es" : "en";
}
export function routeIncoming(event: Incoming, ctx: RoutingContext): RoutingResult {
  const language = event.language ?? detectLanguage(event.text);
  const base = {eventId:event.eventId, conversationId:event.conversationId, language};
  if (!event.eventId || !event.conversationId || !event.text.trim()) {
    return {...base,status:"human_review",reason:"invalid_event"};
  }
  if (ctx.seenEventIds.has(event.eventId)) {
    return {...base,status:"duplicate",reason:"already_seen"};
  }
  ctx.seenEventIds.add(event.eventId);
  const matched = TERMS.filter(([,pattern]) => pattern.test(event.text)).map(([id]) => id);
  const candidates = [...new Set(matched)];
  // An existing conversation is pinned to its project. Never silently transfer tenants.
  const pinned = ctx.existingConversationProject;
  if (pinned && ((event.projectHint && event.projectHint !== pinned) || (candidates.length && !candidates.includes(pinned)))) {
    return {...base,status:"human_review",reason:"cross_project_transfer_requires_approval"};
  }
  const project = pinned ?? (candidates.length === 1 ? candidates[0] : undefined);
  if (!project || (event.projectHint && event.projectHint !== project)) {
    return {...base,status:"clarification",reason:"ambiguous_or_unverified_project"};
  }
  if (!ctx.enabledProjects.has(project)) {
    return {...base,status:"human_review",reason:"project_not_enabled"};
  }
  if (project === "open-research" || project === "family-game") {
    return {...base,status:"human_review",reason:"enhanced_privacy_review_required"};
  }
  if (!ctx.agentPermissions.some(a => a.project === project && a.canReply)) {
    return {...base,status:"human_review",reason:"no_authorized_agent"};
  }
  return {...base,status:"routed",project,reason:"authorized_project_route"};
}

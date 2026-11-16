/** B1 LAB operational state machine. Pure, no patient data. */
import type { ServiceStatus } from "./dispatch.js";

export type ActorRole = "institution" | "professional" | "dispatcher";
export type ServiceAction =
  | "begin_search" | "offer" | "accept" | "depart" | "arrive"
  | "begin_service" | "complete" | "unable_to_complete"
  | "cancel" | "reassign" | "escalate";

const transitions: Readonly<Record<ServiceAction, {
  from: readonly ServiceStatus[];
  to: ServiceStatus;
  roles: readonly ActorRole[];
}>> = {
  begin_search: { from: ["requested"], to: "searching", roles: ["dispatcher"] },
  offer: { from: ["searching"], to: "offered", roles: ["dispatcher"] },
  accept: { from: ["offered"], to: "accepted", roles: ["professional"] },
  depart: { from: ["accepted"], to: "en_route", roles: ["professional"] },
  arrive: { from: ["en_route"], to: "arrived", roles: ["professional"] },
  begin_service: { from: ["arrived"], to: "in_service", roles: ["professional"] },
  complete: { from: ["in_service"], to: "completed", roles: ["professional"] },
  unable_to_complete: { from: ["arrived", "in_service"], to: "unable_to_complete", roles: ["professional"] },
  cancel: { from: ["requested", "searching", "offered", "accepted"], to: "cancelled", roles: ["institution", "dispatcher"] },
  reassign: { from: ["offered", "accepted", "en_route"], to: "searching", roles: ["dispatcher"] },
  escalate: { from: ["requested", "searching", "offered", "accepted", "en_route", "arrived", "in_service"], to: "escalated", roles: ["dispatcher"] },
};

export function transitionService(status: ServiceStatus, action: ServiceAction, role: ActorRole): ServiceStatus {
  const rule = transitions[action];
  if (!rule.roles.includes(role)) throw new Error("ROLE_NOT_ALLOWED");
  if (!rule.from.includes(status)) throw new Error("INVALID_SERVICE_TRANSITION");
  return rule.to;
}

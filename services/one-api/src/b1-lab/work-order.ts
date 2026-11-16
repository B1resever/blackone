import { LAB_SERVICES, type LabService } from "./dispatch-rules.js";

/** Marketplace work orders: no patient PHI in the public dispatch payload. */
export type WorkOrderDraft = {
  organizationId: string;
  specialty: LabService;
  coverageZone: string;
  scheduledAt: string;
  offeredCompensationCents: number;
  requesterReference: string;
};
export type WorkOrderValidation = {ok:true;value:WorkOrderDraft}|{ok:false;errors:string[]};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const zones=new Set(["miami-dade","broward","palm-beach"]);
const enabledServices=new Set<LabService>(["phlebotomy","specimen_courier"]);
export function validateWorkOrderDraft(raw:unknown,now:Date):WorkOrderValidation {
  const errors:string[]=[];
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false,errors:["invalid_payload"]};
  const x=raw as Record<string,unknown>;
  if(typeof x.organizationId!=="string"||!uuid.test(x.organizationId))errors.push("invalid_organization");
  if(typeof x.specialty!=="string"||!LAB_SERVICES.includes(x.specialty as LabService))errors.push("invalid_service");
  else if(!enabledServices.has(x.specialty as LabService))errors.push("service_not_enabled");
  if(typeof x.coverageZone!=="string"||!zones.has(x.coverageZone))errors.push("unsupported_zone");
  const scheduled=typeof x.scheduledAt==="string"?Date.parse(x.scheduledAt):NaN;
  if(!Number.isFinite(scheduled)||scheduled<=now.getTime()||scheduled>now.getTime()+90*86400000)errors.push("invalid_schedule");
  if(!Number.isSafeInteger(x.offeredCompensationCents)||Number(x.offeredCompensationCents)<0||Number(x.offeredCompensationCents)>10000000)errors.push("invalid_compensation");
  if(typeof x.requesterReference!=="string"||x.requesterReference.length<1||x.requesterReference.length>64||!/^[a-zA-Z0-9_-]+$/.test(x.requesterReference))errors.push("invalid_reference");
  if(errors.length)return {ok:false,errors};
  return {ok:true,value:{organizationId:x.organizationId as string,specialty:x.specialty as LabService,coverageZone:x.coverageZone as string,scheduledAt:x.scheduledAt as string,offeredCompensationCents:x.offeredCompensationCents as number,requesterReference:x.requesterReference as string}};
}
/** Deliberately excludes patient identifiers, clinical orders and precise addresses.
 * An authenticated, tenant-scoped API must check organization status and persist atomically.
 * Service enablement and supported zones must be backed by actual licensed coverage before launch.
 */

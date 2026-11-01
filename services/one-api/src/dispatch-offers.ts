import { createHash } from 'node:crypto';
import { z } from 'zod';
export const dispatchTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export function dispatchTokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
export const createDispatchOfferSchema = z.object({
  requestCode: z.string().trim().min(8).max(64),
  driverAmountMinor: z.number().int().positive().max(100_000_000),
  summary: z.string().trim().min(5).max(240),
  expiresInMinutes: z.number().int().min(1).max(120).default(30),
});

// $1 is authenticated driver ID; $2 is the invitation hash. Revalidate current
// evidence in SQL, rather than trusting a previously calculated compliance flag.
export const dispatchEligibleVehicleSql = `
  select v.id
  from one_driver_vehicles v
  join one_users u on u.id = v.driver_user_id
  join one_driver_profiles p on p.user_id = u.id
  join one_vehicle_classes c on c.id = v.vehicle_class_id
  where u.id = $1::uuid and u.role = 'driver' and u.status = 'active' and u.deleted_at is null
    and p.verification_status = 'approved' and p.compliance_status = 'approved'
    and p.available_for_assignment = true
    and p.home_market_id = r.market_id
    and p.intake_details->>'whatsappConsent' = 'true'
    and v.status = 'approved' and v.vehicle_class_id = r.vehicle_class_id
    and (c.max_passengers is null or r.passenger_count <= c.max_passengers)
    and (v.passenger_capacity is null or r.passenger_count <= v.passenger_capacity)
    and (select count(*) from (
      select distinct on (document_type) status, expires_on, file_url
      from one_driver_documents where driver_user_id = u.id
        and document_type in ('driver_license','insurance','vehicle_registration','background_check')
      order by document_type, created_at desc, id desc
    ) d where d.status = 'approved' and d.expires_on >= current_date
      and d.file_url ~ '^https://[^/@[:space:]]+([/?#]|$)') = 4
    and (select d.status = 'approved' and d.file_url ~ '^https://[^/@[:space:]]+([/?#]|$)'
      from one_driver_documents d where d.driver_user_id = u.id
        and d.document_type = 'other' and d.document_number = 'vehicle_photo'
      order by d.created_at desc, d.id desc limit 1) = true
  order by v.updated_at desc, v.id
  limit 1
`;

// All paths that assign a trip must conditionally update the same reservation
// row. PostgreSQL rechecks these predicates after a competing update wins.
export const claimDispatchOfferSql = `
  with claimed as (
    update one_reservations r
    set assigned_driver_user_id = $1::uuid,
        assigned_vehicle_id = (${dispatchEligibleVehicleSql}),
        status = 'assigned', updated_at = now()
    where r.driver_offer_token_hash = $2
      and r.driver_offer_expires_at > now()
      and r.status = 'confirmed' and r.payment_status = 'paid'
      and r.assigned_driver_user_id is null
      and exists (${dispatchEligibleVehicleSql})
    returning r.id, r.request_code, r.passenger_user_id
  ), recorded as (
    insert into one_trip_events (reservation_id, actor_user_id, event_type, payload)
    select id, $1::uuid, 'driver_assigned', jsonb_build_object('source','whatsapp_offer') from claimed
    returning reservation_id
  )
  select request_code, passenger_user_id from claimed
  where exists (select 1 from recorded where reservation_id = claimed.id)
`;

-- B1 VIP independent reservation/dispatch storage.
-- REVIEW BEFORE APPLYING. This migration is not executed by this commit.
CREATE TABLE IF NOT EXISTS b1_vip_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  seats integer NOT NULL CHECK (seats > 0),
  hourly_rate_cents bigint NOT NULL CHECK (hourly_rate_cents > 0),
  minimum_hours integer NOT NULL CHECK (minimum_hours > 0),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS b1_vip_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES b1_vip_vehicles(id),
  customer_id text NOT NULL,
  pickup_address text NOT NULL,
  pickup_at timestamptz NOT NULL,
  duration_hours integer NOT NULL CHECK (duration_hours > 0),
  passengers integer NOT NULL CHECK (passengers > 0),
  quoted_total_cents bigint NOT NULL CHECK (quoted_total_cents > 0),
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','quoted','dispatching','assigned','in_progress','completed','cancelled','unassigned')),
  assigned_driver_id text,
  assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((assigned_driver_id IS NULL AND assigned_at IS NULL) OR
         (assigned_driver_id IS NOT NULL AND assigned_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS b1_vip_dispatch_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES b1_vip_bookings(id),
  driver_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  eligible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, driver_id)
);

CREATE TABLE IF NOT EXISTS b1_vip_booking_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES b1_vip_bookings(id),
  event_type text NOT NULL,
  actor_id text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS b1_vip_bookings_status_idx ON b1_vip_bookings(status, pickup_at);
CREATE INDEX IF NOT EXISTS b1_vip_dispatch_offers_booking_idx ON b1_vip_dispatch_offers(booking_id, expires_at);

-- The server must authenticate the driver and derive driver_id from its session,
-- never trust an arbitrary driver_id supplied by a public client.
-- Run this UPDATE within a transaction. If zero rows returned, offer was lost,
-- expired, ineligible or booking was no longer available.
-- The single-row UPDATE serializes competing acceptances.
-- Example placeholders: $1=booking_id, $2=authenticated_driver_id, $3=offer_id.
--
-- UPDATE b1_vip_bookings AS b
-- SET status='assigned', assigned_driver_id=$2, assigned_at=now()
-- WHERE b.id=$1 AND b.status='dispatching' AND b.assigned_driver_id IS NULL
--   AND EXISTS (
--     SELECT 1 FROM b1_vip_dispatch_offers o
--     WHERE o.id=$3 AND o.booking_id=b.id AND o.driver_id=$2
--       AND o.eligible=true AND o.expires_at >= now()
--   )
-- RETURNING b.id, b.assigned_driver_id, b.assigned_at;
--
-- Insert an audit event and enqueue notification in the same transaction
-- after confirming exactly one returned row. Do not expose these tables directly.

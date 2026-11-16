-- B1 LAB isolated schema, migration draft; DO NOT apply to production without review.
-- No patient names, addresses, diagnoses or specimen details in these tables.
CREATE SCHEMA IF NOT EXISTS b1_lab;

CREATE TABLE IF NOT EXISTS b1_lab.organizations (
  id uuid PRIMARY KEY,
  legal_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS b1_lab.professionals (
  id uuid PRIMARY KEY,
  credential_status text NOT NULL DEFAULT 'pending'
    CHECK (credential_status IN ('pending','verified','expired','suspended')),
  available boolean NOT NULL DEFAULT false,
  max_concurrent_assignments integer NOT NULL DEFAULT 1 CHECK (max_concurrent_assignments BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS b1_lab.professional_authorizations (
  professional_id uuid NOT NULL REFERENCES b1_lab.professionals(id),
  organization_id uuid NOT NULL REFERENCES b1_lab.organizations(id),
  specialty text NOT NULL CHECK (specialty IN ('phlebotomy','specimen_courier','ekg','vitals','nursing')),
  verified_at timestamptz NOT NULL,
  expires_at timestamptz,
  PRIMARY KEY (professional_id, organization_id, specialty)
);

CREATE TABLE IF NOT EXISTS b1_lab.service_requests (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES b1_lab.organizations(id),
  specialty text NOT NULL CHECK (specialty IN ('phlebotomy','specimen_courier','ekg','vitals','nursing')),
  coverage_zone text NOT NULL,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','searching','offered','accepted','en_route','arrived','in_service','completed','unable_to_complete','cancelled','escalated')),
  assigned_professional_id uuid REFERENCES b1_lab.professionals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lab_requests_tenant_status_idx ON b1_lab.service_requests(organization_id,status);

CREATE TABLE IF NOT EXISTS b1_lab.dispatch_offers (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES b1_lab.service_requests(id),
  professional_id uuid NOT NULL REFERENCES b1_lab.professionals(id),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','accepted','rejected','expired','cancelled')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
-- An expired pending offer must be marked expired transactionally before issuing a replacement.
CREATE UNIQUE INDEX IF NOT EXISTS lab_one_pending_offer_per_request ON b1_lab.dispatch_offers(request_id) WHERE state = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS lab_one_accepted_offer_per_request ON b1_lab.dispatch_offers(request_id) WHERE state = 'accepted';

CREATE TABLE IF NOT EXISTS b1_lab.audit_events (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES b1_lab.organizations(id),
  request_id uuid REFERENCES b1_lab.service_requests(id),
  actor_id uuid,
  event_type text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS lab_audit_tenant_time_idx ON b1_lab.audit_events(organization_id, recorded_at DESC);

-- Security requirements for application integration:
-- 1. Enable RLS and define tenant-scoped policies before exposing these tables.
-- 2. Deny direct client access; use authorized server-side transactions.
-- 3. Store PHI in separately designed encrypted storage, never in audit metadata.
-- 4. Do not run this draft on live B1 database without a reviewed migration plan.

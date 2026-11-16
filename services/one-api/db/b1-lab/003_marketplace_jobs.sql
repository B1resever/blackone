-- B1 LAB marketplace migration proposal, additive and isolated.
-- NOT APPLIED. Requires legal review, dedicated database, RLS and authenticated server API.
-- No patient names, clinical records or precise home addresses.
BEGIN;
CREATE SCHEMA IF NOT EXISTS b1_lab;
CREATE TABLE IF NOT EXISTS b1_lab.marketplace_jobs (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES b1_lab.organizations(id),
  specialty text NOT NULL CHECK (specialty IN ('phlebotomy','specimen_courier')),
  coverage_zone text NOT NULL CHECK (coverage_zone IN ('miami-dade','broward','palm-beach')),
  scheduled_at timestamptz NOT NULL,
  offered_compensation_cents integer NOT NULL CHECK (offered_compensation_cents BETWEEN 0 AND 10000000),
  requester_reference varchar(64) NOT NULL CHECK (requester_reference ~ '^[a-zA-Z0-9_-]+$'),
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','offered','accepted','in_progress','completed','declined','expired','cancelled','disputed')),
  accepted_professional_id uuid REFERENCES b1_lab.professionals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (organization_id, requester_reference),
  CHECK ((status NOT IN ('accepted','in_progress','completed')) OR accepted_professional_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS b1_lab_marketplace_jobs_org_status_idx ON b1_lab.marketplace_jobs(organization_id,status,scheduled_at);
CREATE TABLE IF NOT EXISTS b1_lab.marketplace_job_offers (
  id uuid PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES b1_lab.marketplace_jobs(id),
  professional_id uuid NOT NULL REFERENCES b1_lab.professionals(id),
  status text NOT NULL DEFAULT 'offered' CHECK (status IN ('offered','accepted','declined','expired','cancelled')),
  expires_at timestamptz NOT NULL,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id,professional_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS b1_lab_one_accepted_offer_per_job_idx ON b1_lab.marketplace_job_offers(job_id) WHERE status='accepted';
-- Application must use SERIALIZABLE or explicit row locks when accepting offers;
-- only accept after credential and tenant authorization rechecks.
-- Completion must require requester acknowledgment or dispute procedure.
-- Do not grant direct client DB access. Establish tenant-scoped RLS policies
-- and database roles BEFORE exposing through any API.
COMMIT;

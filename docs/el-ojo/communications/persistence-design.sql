-- EL OJO schema proposal; NOT executed on production.
-- Requires an authenticated application layer and project-membership enforcement.
CREATE SCHEMA IF NOT EXISTS el_ojo;
CREATE TABLE IF NOT EXISTS el_ojo.conversations (
  id uuid PRIMARY KEY,
  project_id text NOT NULL CHECK (project_id IN (
    'granelli-property','nodo-applications','black-one','nodo-facility',
    'open-research','nodo-property-manager','nodo-adultos-mayores','family-game'
  )),
  channel text NOT NULL CHECK (channel = 'whatsapp'),
  status text NOT NULL CHECK (status IN ('new','assigned','human_review','resolved')),
  language text NOT NULL CHECK (language IN ('es','en')),
  assigned_agent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS conversations_project_activity
 ON el_ojo.conversations(project_id,last_activity_at DESC);
CREATE TABLE IF NOT EXISTS el_ojo.processed_webhook_events (
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(provider,provider_event_id)
);
-- No message bodies in the global inbox schema.
-- Production must implement scoped DB roles/RLS, encrypted message storage,
-- retention, consent tracking and transaction-safe event processing.

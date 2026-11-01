import { neon } from '@neondatabase/serverless';
import { getMapsServerKey } from './maps-config.js';

export async function probeDatabase(databaseUrl: string): Promise<boolean> {
  const sql = neon(databaseUrl, { fetchOptions: { signal: AbortSignal.timeout(5000) } });
  // Check the schema actually used by Passenger, Driver and Operations. Merely
  // having DATABASE_URL set does not mean the release is ready to accept trips.
  const rows = await sql`
    select
      (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'one_reservations' and column_name in ('driver_offer_token_hash','driver_offer_expires_at','driver_offer_amount_minor','driver_offer_summary')) = 4
      and to_regclass('public.one_driver_document_files') is not null
      and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'one_driver_applications' and column_name = 'intake_details')
      and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'one_driver_profiles' and column_name = 'intake_details')
      and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'one_driver_vehicles' and column_name = 'passenger_capacity')
      and to_regclass('public.one_markets') is not null
      and to_regclass('public.one_reservations') is not null
      and to_regclass('public.one_auth_sessions') is not null
      and to_regclass('public.one_customer_terms_acceptances') is not null
      and to_regclass('public.one_driver_documents') is not null
      and to_regclass('public.one_driver_fee_ledger') is not null
      and to_regclass('public.one_trip_messages') is not null
      and to_regclass('public.one_driver_locations') is not null
      and to_regclass('public.one_account_events') is not null
      and to_regclass('public.one_users') is not null
      and to_regclass('public.one_vehicle_classes') is not null
      and to_regclass('public.one_driver_profiles') is not null
      and to_regclass('public.one_driver_vehicles') is not null
      and to_regclass('public.one_market_rates') is not null
      and to_regclass('public.one_payments') is not null
      and to_regclass('public.one_driver_applications') is not null
      and to_regclass('public.one_push_tokens') is not null
      and to_regclass('public.one_trip_events') is not null
      and exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'one_reservations'
          and column_name = 'ride_code_verified_at'
      ) as ready
  `;
  return rows[0]?.ready === true;
}

export async function getReadiness(
  env: NodeJS.ProcessEnv = process.env,
  databaseProbe: (url: string) => Promise<boolean> = probeDatabase,
) {
  const integrations = {
    database: Boolean(env.DATABASE_URL?.trim()),
    googleMaps: Boolean(getMapsServerKey(env)),
    stripe: Boolean(env.STRIPE_SECRET_KEY?.trim()),
    stripeWebhook: Boolean(env.STRIPE_WEBHOOK_SECRET?.trim()),
    adminAuth: Boolean(env.ONE_ADMIN_API_TOKEN?.trim()),
    allowedOrigins: Boolean(env.ONE_ALLOWED_ORIGINS?.trim()),
    paymentSuccessUrl: Boolean(env.ONE_PAYMENT_SUCCESS_URL?.trim()),
    paymentCancelUrl: Boolean(env.ONE_PAYMENT_CANCEL_URL?.trim()),
  };
  let databaseSchema = false;
  if (integrations.database) {
    try {
      databaseSchema = await databaseProbe(env.DATABASE_URL!.trim());
    } catch {
      // Never return connection strings or provider error messages publicly.
      databaseSchema = false;
    }
  }
  return {
    service: 'ONE API',
    environment: env.VERCEL_ENV ?? env.NODE_ENV ?? 'unknown',
    ready: Object.values(integrations).every(Boolean) && databaseSchema,
    integrations,
    checks: { databaseSchema },
    timestamp: new Date().toISOString(),
  };
}

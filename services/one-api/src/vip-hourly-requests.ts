import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import rates from '../../../config/b1-vip-hourly-rates.json' with { type: 'json' };
import { milesBetween } from './client-pricing.js';
import { getMapsServerKey } from './maps-config.js';
import { type RouteMetrics } from './maps.js';
import { scheduledRideInstant } from './scheduled-rides.js';
import { VIP_FLEET } from './vip-approved-catalog.js';
import { quoteVipHourly, type VipHourlyQuote } from './vip-hourly.js';

const requestSchema = z.strictObject({
  preferredPaymentMethod: z.enum(['zelle', 'cash-app', 'venmo', 'apple-cash', 'paypal']).optional(),
  requestId: z.string().uuidv4().transform(value => value.toLowerCase()),
  vehicleId: z.string().max(64),
  pickupDate: z.string().trim().max(20),
  pickupTime: z.string().trim().max(20),
  pickup: z.string().trim().min(3).max(180),
  destination: z.string().trim().min(3).max(180),
  hours: z.number().int().min(rates.minimumHours).max(24),
  passengers: z.number().int().min(1).max(15),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().max(160).pipe(z.email()).transform(value => value.toLowerCase()),
  phone: z.string().trim().min(7).max(35).regex(/^[+0-9(). -]+$/)
    .refine(value => value.replace(/\D/g, '').length >= 7),
});

type RequestInput = z.infer<typeof requestSchema>;
type StoredRequest = { request_fingerprint: string; quote: VipHourlyQuote };
type RequestToStore = RequestInput & {
  fingerprint: string;
  pickupAt: string;
  quote: VipHourlyQuote;
  radiusMiles: number;
};

export interface VipHourlyRequestStore {
  find(requestId: string): Promise<StoredRequest | undefined>;
  useRouteBudget(maximumCalls: number): Promise<boolean>;
  save(request: RequestToStore): Promise<StoredRequest | undefined>;
}

export function vipHourlyRequestConfig(env: NodeJS.ProcessEnv) {
  const databaseUrl = env.DATABASE_URL?.trim();
  const limit = env.B1_VIP_HOURLY_MAPS_LIMIT_PER_HOUR?.trim() ?? '';
  const maximumCalls = /^\d+$/.test(limit) ? Number(limit) : 0;
  if (env.B1_VIP_HOURLY_REQUESTS_ENABLED !== 'true' || !databaseUrl || !getMapsServerKey(env)
    || maximumCalls < 1 || maximumCalls > 1000) {
    return null;
  }
  return { databaseUrl, maximumCalls };
}

export async function vipHourlyRequestSchemaAvailable(databaseUrl: string) {
  const sql = neon(databaseUrl);
  try {
    await sql`
      select (select preferred_payment_method from b1_vip_hourly_requests limit 0),
             (select used_calls from b1_vip_hourly_route_budget limit 0)
    `;
    return true;
  } catch {
    return false;
  }
}

type SqlQuery = (template: TemplateStringsArray, ...params: unknown[]) => Promise<Record<string, unknown>[]>;

export function createVipHourlyRequestStore(sql: SqlQuery): VipHourlyRequestStore {
  return {
    async find(requestId) {
      const rows = await sql`
        select request_fingerprint, quote from b1_vip_hourly_requests where request_id = ${requestId}::uuid
      `;
      return rows[0] as StoredRequest | undefined;
    },
    async useRouteBudget(maximumCalls) {
      const rows = await sql`
        insert into b1_vip_hourly_route_budget (id, bucket_hour, used_calls)
        values (true, floor(extract(epoch from statement_timestamp()) / 3600)::bigint, 1)
        on conflict (id) do update
          set bucket_hour = excluded.bucket_hour,
              used_calls = case when b1_vip_hourly_route_budget.bucket_hour = excluded.bucket_hour
                then b1_vip_hourly_route_budget.used_calls + 1 else 1 end
          where b1_vip_hourly_route_budget.bucket_hour < excluded.bucket_hour
             or (b1_vip_hourly_route_budget.bucket_hour = excluded.bucket_hour
                and b1_vip_hourly_route_budget.used_calls < ${maximumCalls})
        returning used_calls
      `;
      return rows.length === 1;
    },
    async save(request) {
      const rows = await sql`
        insert into b1_vip_hourly_requests (
          request_id, request_fingerprint, vehicle_key, pickup_at, pickup_address,
          destination_address, duration_hours, passengers, guest_full_name, guest_email,
          guest_phone, quote, radius_miles, preferred_payment_method
        ) values (
          ${request.requestId}::uuid, ${request.fingerprint}, ${request.vehicleId},
          ${request.pickupAt}::timestamptz, ${request.pickup}, ${request.destination}, ${request.hours},
          ${request.passengers}, ${request.fullName}, ${request.email}, ${request.phone},
          ${JSON.stringify(request.quote)}::jsonb, ${request.radiusMiles}, ${request.preferredPaymentMethod ?? null}
        )
        on conflict (request_id) do update set request_id = excluded.request_id
          where b1_vip_hourly_requests.request_fingerprint = excluded.request_fingerprint
        returning request_fingerprint, quote
      `;
      return rows[0] as StoredRequest | undefined;
    },
  };
}

type Coordinate = NonNullable<RouteMetrics['pickupLocation']>;
function validCoordinate(point: Coordinate | undefined): point is Coordinate {
  return !!point && Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90
    && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}

export async function processVipHourlyRequest(input: unknown, options: {
  store: VipHourlyRequestStore;
  route: (pickup: string, destination: string) => Promise<RouteMetrics>;
  maximumCalls: number;
  now: () => number;
}) {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { statusCode: 400, body: { error: 'invalid_request' } };
  const data = parsed.data;
  const fingerprint = createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const requested = (quote: VipHourlyQuote) => ({
    statusCode: 201,
    body: { requestId: data.requestId, status: 'requested', quote },
  });
  const conflict = { statusCode: 409, body: { error: 'request_id_conflict' } };
  const existing = await options.store.find(data.requestId);
  if (existing) return existing.request_fingerprint === fingerprint ? requested(existing.quote) : conflict;

  const vehicle = VIP_FLEET.find(entry => entry.id === data.vehicleId);
  if (!vehicle) return { statusCode: 400, body: { error: 'invalid_request' } };
  if (vehicle.passengerCapacity === null) {
    return { statusCode: 409, body: { error: 'vehicle_capacity_unverified' } };
  }
  if (data.passengers > vehicle.passengerCapacity) {
    return { statusCode: 400, body: { error: 'invalid_request' } };
  }
  const pickupInstant = scheduledRideInstant(data.pickupDate, data.pickupTime, 'south-florida');
  if (pickupInstant === null || pickupInstant <= options.now()) {
    return { statusCode: 422, body: { error: 'pickup_time_invalid' } };
  }
  if (!await options.store.useRouteBudget(options.maximumCalls)) {
    return { statusCode: 429, body: { error: 'vip_quote_limit' } };
  }

  const routeUnavailable = { statusCode: 503, body: { error: 'route_unavailable' } };
  let route;
  try {
    route = await options.route(data.pickup, data.destination);
  } catch {
    return routeUnavailable;
  }
  if (!Number.isFinite(route.distanceMeters) || route.distanceMeters < 0
    || !Number.isFinite(route.durationSeconds) || route.durationSeconds < 0
    || !validCoordinate(route.pickupLocation) || !validCoordinate(route.dropoffLocation)) {
    return routeUnavailable;
  }
  const radiusMiles = milesBetween(route.pickupLocation, route.dropoffLocation);
  if (radiusMiles > rates.maximumRadiusMiles) {
    return { statusCode: 422, body: { error: 'hourly_radius_exceeded' } };
  }

  const pickupAt = new Date(pickupInstant).toISOString();
  const quote = quoteVipHourly({
    id: vehicle.id,
    name: vehicle.displayName,
    active: true,
    currency: 'USD',
    hourlyRateCents: vehicle.hourlyPricing.additionalHourCents,
    minimumHours: rates.minimumHours,
    minimumPackageCents: vehicle.hourlyPricing.minimumPackageCents,
    gratuityBasisPoints: vehicle.hourlyPricing.gratuityBasisPoints,
    maximumPassengers: vehicle.passengerCapacity,
  }, {
    vehicleId: vehicle.id,
    pickupAt,
    pickupAddress: data.pickup,
    durationHours: data.hours,
    passengers: data.passengers,
  });

  const saved = await options.store.save({ ...data, fingerprint, pickupAt, quote, radiusMiles });
  return saved ? requested(saved.quote) : conflict;
}

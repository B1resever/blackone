import UltraDispatch, { type UltraConfirmed, type UltraDriver, type UltraFleetVehicle } from "@/app/admin/UltraDispatch";
import UltraFleet from "@/app/admin/UltraFleet";
import UltraRequests, { type UltraRequest } from "@/app/admin/UltraRequests";
import ProviderApplications from "@/app/admin/ProviderApplications";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

type DriverApplicationRow = {
  id: string;
  first_name: string;
  last_name: string;
  vehicle_make: string;
  vehicle_model: string;
  status: string;
  submitted_at: string;
};

type UltraRequestRow = UltraRequest;
type UltraConfirmedRow = UltraConfirmed;
type UltraDriverRow = UltraDriver;
type UltraFleetVehicleRow = UltraFleetVehicle;

type QueueRow = {
  public_code: string;
  ride_type: string;
  pickup_address: string;
  destination_address: string;
  pickup_at: string;
  trip_status: string;
  driver_name: string | null;
};

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortPlace(value: string) {
  return value.split(",")[0]?.trim() || value;
}

async function getOperationsData() {
  const pool = getDbPool();

  const [open, today, drivers, pending, queue, driverApplications, ultraRequests, ultraConfirmed, ultraDrivers, ultraFleet] = await Promise.all([
    pool.query(
      `select count(*)::int as count
       from reservations
       where trip_status not in ('completed','cancelled')`
    ),
    pool.query(
      `select count(*)::int as count
       from reservations
       where (pickup_at at time zone 'America/New_York')::date =
             (now() at time zone 'America/New_York')::date
         and trip_status <> 'cancelled'`
    ),
    pool.query(
      `select count(*)::int as count
       from drivers
       where status = 'approved' and online = true`
    ),
    pool.query(
      `select count(*)::int as count
       from reservations r
       left join trip_assignments a on a.reservation_id = r.id
       where r.trip_status in ('requested','quoted','confirmed')
         and a.id is null`
    ),
    pool.query<QueueRow>(
      `select
         r.public_code,
         r.ride_type,
         r.pickup_address,
         r.destination_address,
         r.pickup_at,
         r.trip_status,
         case
           when d.id is null then null
           else trim(concat(d.first_name, ' ', d.last_name))
         end as driver_name
       from reservations r
       left join trip_assignments a on a.reservation_id = r.id
       left join drivers d on d.id = a.driver_id
       where r.trip_status not in ('completed','cancelled')
       order by r.pickup_at asc
       limit 20`
    ),
    pool.query<DriverApplicationRow>(
      `select id, first_name, last_name, vehicle_make, vehicle_model, status, submitted_at
       from driver_applications
       where status in ('pending','needs_update')
       order by submitted_at asc
       limit 20`
    ).catch(() => ({ rows: [] as DriverApplicationRow[] })),
    pool.query<UltraRequestRow>(
      `select id, public_code, service_type, vehicle_class, pickup, destination,
              service_date::text, start_time::text, reserved_hours, passengers, luggage,
              customer_name, phone, email, status
       from ultra_reservation_requests
       where status in ('quote_requested','quoted')
       order by created_at desc
       limit 25`
    ).catch(() => ({ rows: [] as UltraRequestRow[] })),
    pool.query<UltraConfirmedRow>(
      `select r.id,r.public_code,r.service_type,r.vehicle_class,r.pickup,r.destination,
              r.service_date::text,r.start_time::text,r.customer_name,r.status
       from ultra_reservation_requests r
       left join ultra_assignments a on a.request_id=r.id
       where r.status='confirmed' and a.id is null
       order by r.service_date asc, r.start_time asc
       limit 25`
    ).catch(() => ({ rows: [] as UltraConfirmedRow[] })),
    pool.query<UltraDriverRow>(
      `select id, trim(concat(first_name,' ',last_name)) as name
       from drivers
       where status='approved'
       order by first_name,last_name`
    ).catch(() => ({ rows: [] as UltraDriverRow[] })),
    pool.query<UltraFleetVehicleRow>(
      `select id,make,model,year,color,plate,capacity,luggage_capacity,
              hourly_rate,minimum_hours,day_rate,included_miles,extra_mile_rate,
              waiting_hourly_rate,airport_base_rate,meet_greet_rate,gratuity_percent,cancellation_hours
       from ultra_fleet_vehicles
       where active=true
       order by year desc,make,model`
    ).catch(() => ({ rows: [] as UltraFleetVehicleRow[] }))
  ]);

  return {
    metrics: [
      ["Open reservations", String(open.rows[0]?.count ?? 0)],
      ["Trips today", String(today.rows[0]?.count ?? 0)],
      ["Drivers online", String(drivers.rows[0]?.count ?? 0)],
      ["Pending assignments", String(pending.rows[0]?.count ?? 0)]
    ],
    queue: queue.rows,
    driverApplications: driverApplications.rows,
    ultraRequests: ultraRequests.rows,
    ultraConfirmed: ultraConfirmed.rows,
    ultraDrivers: ultraDrivers.rows,
    ultraFleet: ultraFleet.rows
  };
}

export default async function AdminPage() {
  let data:
    | Awaited<ReturnType<typeof getOperationsData>>
    | null = null;
  let connectionError = "";

  try {
    data = await getOperationsData();
  } catch (error) {
    connectionError =
      error instanceof Error ? error.message : "Unable to connect to operations data.";
  }

  const metrics =
    data?.metrics ?? [
      ["Open reservations", "—"],
      ["Trips today", "—"],
      ["Drivers online", "—"],
      ["Pending assignments", "—"]
    ];

  return (
    <main className="portalPage adminBg">
      <header className="portalHeader">
        <a href="/">← B1</a>
        <span>B1 CONTROL CENTER · PREVIEW</span>
      </header>

      <section className="portalHero">
        <div>
          <div className="eyebrow dark">B1 COMMAND CENTER</div>
          <h1>Live reservations, dispatch and closeout.</h1>
          <p>Central operating view for B1 reservations, provider assignments and trip status.</p>
        </div>
        <a className="primary" href="/#book">New reservation</a>
      </section>

      <section className="dashboardGrid">
        {metrics.map(([label, value]) => (
          <article className="metric" key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
            <span>{connectionError ? "Connection unavailable" : "Live from B1 database"}</span>
          </article>
        ))}
      </section>

      {connectionError && (
        <section className="panel">
          <h2>Database connection</h2>
          <p>{connectionError}</p>
        </section>
      )}

      <section className="panel">
        <h2>Provider applications</h2>
        <ProviderApplications applications={data?.driverApplications ?? []} />
      </section>

      <section className="panel">
        <h2>Ultra Exclusive requests</h2>
        <UltraRequests requests={data?.ultraRequests ?? []} />
      </section>

      <section className="panel">
        <h2>Ultra Exclusive fleet</h2>
        <UltraFleet initialVehicles={data?.ultraFleet ?? []} />
      </section>

      <section className="panel">
        <h2>Ultra Exclusive dispatch</h2>
        <UltraDispatch reservations={data?.ultraConfirmed ?? []} drivers={data?.ultraDrivers ?? []} vehicles={data?.ultraFleet ?? []} />
      </section>

      <section className="panel">
        <h2>Dispatch queue</h2>

        {!connectionError && data?.queue.length === 0 && (
          <div className="queue">
            <span>No live reservations yet.</span>
            <b>Ready</b>
          </div>
        )}

        {data?.queue.map((trip) => (
          <div className="queue" key={trip.public_code}>
            <span>
              #{trip.public_code} · {shortPlace(trip.pickup_address)} → {shortPlace(trip.destination_address)}
            </span>
            <b>
              {trip.driver_name
                ? `${trip.driver_name} · ${titleCase(trip.trip_status)}`
                : trip.trip_status === "confirmed"
                  ? "Needs driver"
                  : titleCase(trip.trip_status)}
            </b>
          </div>
        ))}
      </section>
    </main>
  );
}

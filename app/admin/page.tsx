import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

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

  const [open, today, drivers, pending, queue] = await Promise.all([
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
    )
  ]);

  return {
    metrics: [
      ["Open reservations", String(open.rows[0]?.count ?? 0)],
      ["Trips today", String(today.rows[0]?.count ?? 0)],
      ["Drivers online", String(drivers.rows[0]?.count ?? 0)],
      ["Pending assignments", String(pending.rows[0]?.count ?? 0)]
    ],
    queue: queue.rows
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
        <a href="/">← B1 Reserve</a>
        <span>ONE OPERATIONS · PREVIEW</span>
      </header>

      <section className="portalHero">
        <div>
          <div className="eyebrow dark">B1 COMMAND CENTER</div>
          <h1>Reservations, dispatch and margins.</h1>
          <p>Live operating dashboard for B1 staff.</p>
        </div>
        <a className="primary" href="/#book">New reservation</a>
      </section>

      <section className="dashboardGrid">
        {metrics.map(([label, value]) => (
          <article className="metric" key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
            <span>{connectionError ? "Connection unavailable" : "Live from ONE database"}</span>
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

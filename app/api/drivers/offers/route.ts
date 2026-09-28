import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getDriverBySessionToken } from "@/lib/driverAuth";

export async function GET(request:NextRequest){
  const driver=await getDriverBySessionToken(request.cookies.get("b1_driver_session")?.value);
  if(!driver) return NextResponse.json({error:"Driver login required"},{status:401});

  const pool=getDbPool();
  await pool.query(`
    create table if not exists trip_offer_claims(
      reservation_id uuid primary key references reservations(id) on delete cascade,
      driver_id uuid not null references drivers(id) on delete cascade,
      vehicle_id uuid not null references vehicles(id) on delete restrict,
      status text not null default 'held' check(status in ('held','verified','expired','cancelled')),
      held_at timestamptz not null default now(),
      held_until timestamptz not null,
      verified_at timestamptz
    )
  `);

  await pool.query("update trip_offer_claims set status='expired' where status='held' and held_until<=now()");

  const offers=await pool.query(
    `select r.id,r.public_code,r.ride_type,r.vehicle_class,
            coalesce(nullif(trim(split_part(r.pickup_address,',',2)),''),trim(split_part(r.pickup_address,',',1))) as pickup_area,
            coalesce(nullif(trim(split_part(r.destination_address,',',2)),''),trim(split_part(r.destination_address,',',1))) as destination_area,
            r.pickup_at,r.passenger_count,r.distance_miles,r.duration_minutes,r.estimated_tolls,r.quoted_total,
            round(greatest(0,(r.quoted_total-r.estimated_tolls)/1.08)*0.62,2) as estimated_driver_pay
     from reservations r
     where r.payment_status='paid'
       and r.trip_status='confirmed'
       and exists(
         select 1 from vehicles v
         where v.driver_id=$1 and v.active=true and v.class=r.vehicle_class
       )
       and not exists(select 1 from trip_assignments a where a.reservation_id=r.id)
       and not exists(
         select 1 from trip_offer_claims c
         where c.reservation_id=r.id and c.status in ('held','verified')
       )
     order by r.pickup_at asc
     limit 25`,
    [driver.id]
  );

  const held=await pool.query(
    `select c.reservation_id as id,r.public_code,r.ride_type,r.vehicle_class,
            coalesce(nullif(trim(split_part(r.pickup_address,',',2)),''),trim(split_part(r.pickup_address,',',1))) as pickup_area,
            coalesce(nullif(trim(split_part(r.destination_address,',',2)),''),trim(split_part(r.destination_address,',',1))) as destination_area,
            r.pickup_at,r.passenger_count,r.distance_miles,r.duration_minutes,r.estimated_tolls,r.quoted_total,
            round(greatest(0,(r.quoted_total-r.estimated_tolls)/1.08)*0.62,2) as estimated_driver_pay,
            c.held_until,c.status
     from trip_offer_claims c
     join reservations r on r.id=c.reservation_id
     where c.driver_id=$1 and c.status='held' and c.held_until>now()
     order by c.held_at desc
     limit 1`,
    [driver.id]
  );

  return NextResponse.json({
    driver:{id:driver.id,name:[driver.first_name,driver.last_name].filter(Boolean).join(" ")},
    offers:offers.rows,
    heldOffer:held.rows[0] ?? null
  });
}

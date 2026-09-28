import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getDriverBySessionToken } from "@/lib/driverAuth";

const holdMinutes=Math.max(2,Math.min(15,Number(process.env.B1_TRIP_HOLD_MINUTES ?? 5)));

function normalizePhone(value:string){
  const digits=value.replace(/\D/g,"");
  if(digits.length===10) return "+1"+digits;
  if(digits.length===11 && digits.startsWith("1")) return "+"+digits;
  if(value.startsWith("+") && digits.length>=10 && digits.length<=15) return "+"+digits;
  throw new Error("Driver phone number is invalid");
}

export async function POST(request:NextRequest){
  const driver=await getDriverBySessionToken(request.cookies.get("b1_driver_session")?.value);
  if(!driver) return NextResponse.json({error:"Driver login required"},{status:401});

  try{
    const body=await request.json();
    const reservationId=String(body.reservationId ?? "");
    if(!reservationId) return NextResponse.json({error:"Trip is required"},{status:400});

    const pool=getDbPool();
    const client=await pool.connect();
    let publicCode="";
    try{
      await client.query("begin");
      await client.query(`
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

      const trip=await client.query(
        `select id,public_code,vehicle_class,trip_status,payment_status
         from reservations where id=$1 for update`,
        [reservationId]
      );
      if(!trip.rowCount) throw new Error("Trip not found");
      publicCode=trip.rows[0].public_code;
      if(trip.rows[0].trip_status!=="confirmed" || trip.rows[0].payment_status!=="paid") throw new Error("Trip is no longer available");

      const vehicle=await client.query(
        `select id from vehicles
         where driver_id=$1 and active=true and class=$2
         order by created_at desc limit 1`,
        [driver.id,trip.rows[0].vehicle_class]
      );
      if(!vehicle.rowCount) throw new Error("Your approved vehicle is not eligible for this trip");

      await client.query("update trip_offer_claims set status='expired' where reservation_id=$1 and status='held' and held_until<=now()",[reservationId]);

      const claim=await client.query("select driver_id,status from trip_offer_claims where reservation_id=$1 for update",[reservationId]);
      if(claim.rowCount && claim.rows[0].status==="verified") throw new Error("Trip has already been assigned");
      if(claim.rowCount && claim.rows[0].status==="held" && String(claim.rows[0].driver_id)!==String(driver.id)) throw new Error("Another provider is currently confirming this trip");

      await client.query(
        `insert into trip_offer_claims(reservation_id,driver_id,vehicle_id,status,held_at,held_until)
         values($1,$2,$3,'held',now(),now()+($4::text||' minutes')::interval)
         on conflict(reservation_id) do update
           set driver_id=excluded.driver_id,vehicle_id=excluded.vehicle_id,status='held',
               held_at=now(),held_until=excluded.held_until,verified_at=null`,
        [reservationId,driver.id,vehicle.rows[0].id,holdMinutes]
      );

      await client.query(
        `insert into reservation_events(reservation_id,event_type,details)
         values($1,'trip_hold_started',jsonb_build_object('driver_id',$2,'hold_minutes',$3))`,
        [reservationId,driver.id,holdMinutes]
      );
      await client.query("commit");
    }catch(error){
      await client.query("rollback");
      throw error;
    }finally{
      client.release();
    }

    const sid=process.env.TWILIO_ACCOUNT_SID;
    const token=process.env.TWILIO_AUTH_TOKEN;
    const service=process.env.TWILIO_VERIFY_SERVICE_SID;
    if(!sid || !token || !service) throw new Error("B1 trip verification is being configured");

    const phone=normalizePhone(String(driver.phone ?? ""));
    const verifyBody=new URLSearchParams({To:phone,Channel:"sms"});
    const response=await fetch(`https://verify.twilio.com/v2/Services/${service}/Verifications`,{
      method:"POST",
      headers:{
        Authorization:"Basic "+Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type":"application/x-www-form-urlencoded"
      },
      body:verifyBody,
      cache:"no-store"
    });
    if(!response.ok) throw new Error("Unable to send trip verification code");

    return NextResponse.json({ok:true,publicCode,holdMinutes});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to accept trip"},{status:400});
  }
}

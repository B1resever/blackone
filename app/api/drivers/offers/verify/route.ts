import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getDriverBySessionToken } from "@/lib/driverAuth";

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
    const code=String(body.code ?? "").trim();
    if(!reservationId || !/^\d{6}$/.test(code)) return NextResponse.json({error:"Enter the 6-digit trip verification code"},{status:400});

    const sid=process.env.TWILIO_ACCOUNT_SID;
    const token=process.env.TWILIO_AUTH_TOKEN;
    const service=process.env.TWILIO_VERIFY_SERVICE_SID;
    if(!sid || !token || !service) return NextResponse.json({error:"B1 trip verification is being configured"},{status:503});

    const phone=normalizePhone(String(driver.phone ?? ""));
    const verifyBody=new URLSearchParams({To:phone,Code:code});
    const response=await fetch(`https://verify.twilio.com/v2/Services/${service}/VerificationCheck`,{
      method:"POST",
      headers:{
        Authorization:"Basic "+Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type":"application/x-www-form-urlencoded"
      },
      body:verifyBody,
      cache:"no-store"
    });
    const result=await response.json();
    if(!response.ok || result.status!=="approved") return NextResponse.json({error:"The verification code is incorrect or expired"},{status:401});

    const pool=getDbPool();
    const client=await pool.connect();
    try{
      await client.query("begin");
      const claim=await client.query(
        `select c.vehicle_id,c.held_until,r.public_code,r.quoted_total,r.estimated_tolls
         from trip_offer_claims c
         join reservations r on r.id=c.reservation_id
         where c.reservation_id=$1 and c.driver_id=$2 and c.status='held'
         for update`,
        [reservationId,driver.id]
      );
      if(!claim.rowCount) throw new Error("Trip hold is no longer active");
      if(new Date(claim.rows[0].held_until).getTime()<=Date.now()){
        await client.query("update trip_offer_claims set status='expired' where reservation_id=$1",[reservationId]);
        throw new Error("Trip hold expired. Return to available offers.");
      }

      const driverPay=Math.round(Math.max(0,(Number(claim.rows[0].quoted_total)-Number(claim.rows[0].estimated_tolls))/1.08)*0.62*100)/100;

      await client.query(
        `insert into trip_assignments(reservation_id,driver_id,vehicle_id,driver_pay,assigned_at,accepted_at)
         values($1,$2,$3,$4,now(),now())
         on conflict(reservation_id) do nothing`,
        [reservationId,driver.id,claim.rows[0].vehicle_id,driverPay]
      );
      const assignment=await client.query("select driver_id from trip_assignments where reservation_id=$1",[reservationId]);
      if(!assignment.rowCount || String(assignment.rows[0].driver_id)!==String(driver.id)) throw new Error("Trip was assigned to another provider");

      await client.query(
        "update trip_offer_claims set status='verified',verified_at=now() where reservation_id=$1 and driver_id=$2",
        [reservationId,driver.id]
      );
      await client.query("update reservations set trip_status='assigned',updated_at=now() where id=$1",[reservationId]);
      await client.query(
        `insert into reservation_events(reservation_id,event_type,details)
         values($1,'accepted_verified',jsonb_build_object('driver_id',$2,'vehicle_id',$3,'verification','sms_otp'))`,
        [reservationId,driver.id,claim.rows[0].vehicle_id]
      );
      await client.query("commit");
      return NextResponse.json({ok:true,publicCode:claim.rows[0].public_code,status:"accepted_verified"});
    }catch(error){
      await client.query("rollback");
      throw error;
    }finally{
      client.release();
    }
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to verify trip"},{status:400});
  }
}

import { randomBytes } from "crypto";
import { getDbPool } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const dynamic="force-dynamic";

function publicCode(){
  return "B1R-"+randomBytes(3).toString("hex").toUpperCase();
}

export default async function SuccessPage({
  searchParams
}:{
  searchParams:Promise<{session_id?:string}>;
}){
  const params=await searchParams;
  let reservationCode="";
  let confirmed=false;
  let message="B1 is validating your payment and reservation.";

  if(params.session_id){
    try{
      const stripe=getStripe();
      const session=await stripe.checkout.sessions.retrieve(params.session_id);
      if(session.payment_status==="paid"){
        const m=session.metadata ?? {};
        const pool=getDbPool();

        await pool.query("alter table reservations add column if not exists vehicle_class text not null default 'comfort'");

        const existing=await pool.query(
          "select public_code from reservations where stripe_checkout_session_id=$1 limit 1",
          [session.id]
        );

        if(existing.rowCount){
          reservationCode=existing.rows[0].public_code;
          confirmed=true;
        }else{
          const email=session.customer_details?.email ?? session.customer_email ?? "";
          if(!email) throw new Error("Customer email missing from payment");

          const customer=await pool.query(
            `insert into customers(email)
             values($1)
             on conflict(email) do update set email=excluded.email
             returning id`,
            [email.toLowerCase()]
          );

          const pickupDate=String(m.pickupDate ?? "");
          const pickupTime=String(m.pickupTime ?? "");
          const pickupAt=new Date(pickupDate+"T"+pickupTime+":00-04:00");
          if(Number.isNaN(pickupAt.getTime())) throw new Error("Invalid pickup time");

          let inserted=false;
          for(let attempt=0;attempt<3 && !inserted;attempt++){
            reservationCode=publicCode();
            try{
              await pool.query(
                `insert into reservations
                 (public_code,customer_id,ride_type,vehicle_class,pickup_address,destination_address,
                  pickup_at,passenger_count,distance_miles,duration_minutes,estimated_tolls,
                  quoted_total,currency,payment_status,trip_status,stripe_checkout_session_id)
                 values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'USD','paid','confirmed',$13)`,
                [
                  reservationCode,
                  customer.rows[0].id,
                  m.rideType,
                  m.vehicleClass,
                  m.pickup,
                  m.destination,
                  pickupAt,
                  Number(m.passengers ?? 1),
                  Number(m.distanceMiles ?? 0),
                  Number(m.durationMinutes ?? 0),
                  Number(m.tolls ?? 0),
                  Number(m.quotedTotal ?? session.amount_total ?? 0)/(m.quotedTotal?1:100),
                  session.id
                ]
              );
              inserted=true;
            }catch(error){
              if(attempt===2) throw error;
            }
          }

          await pool.query(
            `insert into reservation_events(reservation_id,event_type,details)
             select id,'payment_confirmed',jsonb_build_object('stripe_session',$2,'vehicle_class',$3)
             from reservations where public_code=$1`,
            [reservationCode,session.id,m.vehicleClass]
          );
          confirmed=true;
        }
        message="Your B1 Ride reservation is confirmed and ready for provider dispatch.";
      }
    }catch{
      message="Payment returned successfully. B1 is validating the reservation status.";
    }
  }

  return (
    <main className="successPage">
      <div className="successCard">
        <div className="successCheck">✓</div>
        <div className="eyebrow dark">B1 RIDE</div>
        <h1>{confirmed?"Reservation confirmed.":"Payment received."}</h1>
        <p>{message}</p>
        {reservationCode && <small>Reservation: {reservationCode}</small>}
        <a className="primary" href="/">Return to B1</a>
      </div>
    </main>
  );
}

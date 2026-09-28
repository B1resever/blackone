import { getDbPool } from "@/lib/db";
import UltraQuotePayButton from "@/app/reservations/quote/[code]/UltraQuotePayButton";

export const dynamic = "force-dynamic";

function label(value:string){
  return value.replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase());
}

export default async function UltraQuotePage({params}:{params:Promise<{code:string}>}){
  const {code}=await params;
  const pool=getDbPool();
  const result=await pool.query(
    `select public_code,service_type,vehicle_class,pickup,destination,service_date::text,
            start_time::text,reserved_hours,passengers,luggage,customer_name,email,status,
            quote_base,quote_mileage,quote_tolls,quote_parking,quote_waiting,
            quote_gratuity,quote_extras,quote_total,quote_note
     from ultra_reservation_requests
     where public_code=$1
     limit 1`,
    [code]
  );

  if(!result.rowCount){
    return <main className="successPage"><div className="successCard"><h1>Quote not found.</h1><a className="primary" href="/">Return to B1</a></div></main>;
  }

  const q=result.rows[0];
  const quoted=q.status==="quoted" || q.status==="confirmed";

  return (
    <main className="ultraQuotePage">
      <header className="portalHeader reservationHeader"><a href="/">← B1</a><span>ULTRA EXCLUSIVE QUOTE</span></header>
      <section className="ultraQuoteHero">
        <div className="eyebrow">B1 · ULTRA EXCLUSIVE</div>
        <h1>{q.public_code}</h1>
        <p>Prepared for {q.customer_name}. Review the dedicated vehicle, service and pricing before payment.</p>
      </section>

      <section className="ultraQuoteCustomer">
        <div className="ultraQuoteFacts">
          <div><small>Service</small><strong>{label(q.service_type)}</strong></div>
          <div><small>Vehicle</small><strong>{label(q.vehicle_class)}</strong></div>
          <div><small>Date</small><strong>{q.service_date} · {q.start_time}</strong></div>
          <div><small>Passengers</small><strong>{q.passengers} · {q.luggage} luggage</strong></div>
          {q.reserved_hours && <div><small>Reserved time</small><strong>{q.reserved_hours} hours</strong></div>}
        </div>

        <div className="ultraRouteBox">
          <span>{q.pickup}</span><b>→</b><span>{q.destination}</span>
        </div>

        {quoted ? (
          <div className="ultraBreakdown">
            <h2>Reservation quote</h2>
            {Number(q.quote_base)>0 && <div><span>Reserved service</span><strong>{"$"+Number(q.quote_base).toFixed(2)}</strong></div>}
            {Number(q.quote_mileage)>0 && <div><span>Mileage</span><strong>{"$"+Number(q.quote_mileage).toFixed(2)}</strong></div>}
            {Number(q.quote_tolls)>0 && <div><span>Tolls</span><strong>{"$"+Number(q.quote_tolls).toFixed(2)}</strong></div>}
            {Number(q.quote_parking)>0 && <div><span>Parking / access</span><strong>{"$"+Number(q.quote_parking).toFixed(2)}</strong></div>}
            {Number(q.quote_waiting)>0 && <div><span>Waiting / overtime</span><strong>{"$"+Number(q.quote_waiting).toFixed(2)}</strong></div>}
            {Number(q.quote_gratuity)>0 && <div><span>Gratuity</span><strong>{"$"+Number(q.quote_gratuity).toFixed(2)}</strong></div>}
            {Number(q.quote_extras)>0 && <div><span>Approved extras</span><strong>{"$"+Number(q.quote_extras).toFixed(2)}</strong></div>}
            <div className="ultraBreakdownTotal"><span>Total</span><strong>{"$"+Number(q.quote_total).toFixed(2)}</strong></div>
            {q.quote_note && <p>{q.quote_note}</p>}
            {q.status==="confirmed" ? <div className="reservationNotice"><strong>Confirmed:</strong> payment has been received for this reservation.</div> : <UltraQuotePayButton code={q.public_code} />}
          </div>
        ) : (
          <div className="reservationNotice">B1 is preparing this Ultra Exclusive quote. Pricing will appear here when ready.</div>
        )}
      </section>
    </main>
  );
}

import { getDbPool } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const dynamic="force-dynamic";

export default async function UltraSuccess({searchParams}:{searchParams:Promise<{session_id?:string}>}){
  const {session_id}=await searchParams;
  let code="";
  let confirmed=false;

  if(session_id){
    try{
      const stripe=getStripe();
      const session=await stripe.checkout.sessions.retrieve(session_id);
      if(session.payment_status==="paid" && session.metadata?.product==="ultra_exclusive"){
        const pool=getDbPool();
        code=session.metadata.publicCode ?? "";
        await pool.query(
          "update ultra_reservation_requests set status='confirmed' where public_code=$1 and stripe_checkout_session_id=$2",
          [code,session.id]
        );
        confirmed=true;
      }
    }catch{}
  }

  return (
    <main className="successPage">
      <div className="successCard">
        <div className="successCheck">✓</div>
        <div className="eyebrow dark">B1 ULTRA EXCLUSIVE</div>
        <h1>{confirmed?"Reservation confirmed.":"Payment received."}</h1>
        <p>{confirmed?"Your Ultra Exclusive reservation is confirmed and moving to vehicle and chauffeur assignment.":"B1 is validating the payment and reservation status."}</p>
        {code && <small>Reservation: {code}</small>}
        <a className="primary" href={code?"/reservations/quote/"+code:"/"}>View reservation</a>
      </div>
    </main>
  );
}

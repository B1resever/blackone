"use client";

import { useEffect, useState } from "react";

type Offer={
  id:string;
  public_code:string;
  ride_type:string;
  vehicle_class:string;
  pickup_area:string;
  destination_area:string;
  pickup_at:string;
  passenger_count:number;
  distance_miles:number;
  duration_minutes:number;
  estimated_tolls:number;
  quoted_total:number;
  estimated_driver_pay:number;
  held_until?:string;
};

export default function DriverOffers(){
  const [offers,setOffers]=useState<Offer[]>([]);
  const [held,setHeld]=useState<Offer|null>(null);
  const [driverName,setDriverName]=useState("");
  const [code,setCode]=useState("");
  const [status,setStatus]=useState("");
  const [loading,setLoading]=useState(false);

  async function load(){
    try{
      const r=await fetch("/api/drivers/offers",{cache:"no-store"});
      const d=await r.json();
      if(r.status===401){ window.location.href="/driver/login"; return; }
      if(!r.ok) throw new Error(d.error ?? "Unable to load trip offers");
      setOffers(d.offers ?? []);
      setHeld(d.heldOffer ?? null);
      setDriverName(d.driver?.name ?? "");
    }catch(error){
      setStatus(error instanceof Error?error.message:"Unable to load trip offers");
    }
  }

  useEffect(()=>{ load(); },[]);

  async function accept(offer:Offer){
    setLoading(true); setStatus("");
    try{
      const r=await fetch("/api/drivers/offers/accept",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({reservationId:offer.id})
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error ?? "Unable to hold trip");
      setStatus("Trip held for you. Enter the 6-digit verification code sent to your phone.");
      await load();
    }catch(error){
      setStatus(error instanceof Error?error.message:"Unable to accept trip");
    }finally{
      setLoading(false);
    }
  }

  async function verify(){
    if(!held) return;
    setLoading(true); setStatus("");
    try{
      const r=await fetch("/api/drivers/offers/verify",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({reservationId:held.id,code})
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error ?? "Unable to verify trip");
      setCode("");
      setHeld(null);
      setStatus("Accepted & Verified. This trip is now assigned to you.");
      await load();
    }catch(error){
      setStatus(error instanceof Error?error.message:"Unable to verify trip");
    }finally{
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="driverOfferHead">
        <div><h2>Available B1 Ride offers</h2>{driverName && <p>Signed in as {driverName}</p>}</div>
        <button type="button" onClick={load}>Refresh</button>
      </div>

      {held && (
        <div className="heldOffer">
          <small>TRIP HELD FOR VERIFICATION</small>
          <strong>{held.public_code} · {held.pickup_area} → {held.destination_area}</strong>
          <span>{held.vehicle_class.toUpperCase()} · Estimated payout {"$"+Number(held.estimated_driver_pay).toFixed(2)}</span>
          <div className="heldOtp">
            <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" maxLength={6} placeholder="6-digit code" />
            <button type="button" disabled={loading || code.length!==6} onClick={verify}>{loading?"Verifying...":"Verify trip"}</button>
          </div>
        </div>
      )}

      {!held && offers.length===0 && <div className="queue"><span>No eligible paid trips are available right now.</span><b>Waiting</b></div>}

      {!held && <div className="driverOffersGrid">
        {offers.map(offer=>(
          <article className="driverOfferCard" key={offer.id}>
            <div className="driverOfferTop"><small>{offer.public_code}</small><b>{offer.vehicle_class.toUpperCase()}</b></div>
            <h3>{offer.pickup_area} → {offer.destination_area}</h3>
            <div className="driverOfferFacts">
              <span>{new Date(offer.pickup_at).toLocaleString()}</span>
              <span>{offer.passenger_count} passenger{offer.passenger_count===1?"":"s"}</span>
              <span>{Number(offer.distance_miles).toFixed(1)} mi · {offer.duration_minutes} min</span>
            </div>
            <div className="driverOfferPay"><span>Estimated payout</span><strong>{"$"+Number(offer.estimated_driver_pay).toFixed(2)}</strong></div>
            <button type="button" disabled={loading} onClick={()=>accept(offer)}>{loading?"Processing...":"Accept Trip"}</button>
          </article>
        ))}
      </div>}

      {status && <p className="formStatus">{status}</p>}
    </section>
  );
}

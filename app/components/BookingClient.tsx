"use client";

import { useState } from "react";

type RideType = "point_to_point" | "airport" | "hourly" | "event";
type RouteResult = { distanceMiles: number; durationMinutes: number; tolls: number };
type Quote = { baseFare:number; distanceFare:number; timeFare:number; tolls:number; serviceFee:number; customerTotal:number };

const serviceOptions = [
  { value: "point_to_point", label: "Point to Point" },
  { value: "airport", label: "Airport Transfer" },
  { value: "hourly", label: "Hourly Chauffeur" },
  { value: "event", label: "Event / VIP" }
] as const;

export default function BookingClient() {
  const [pickup,setPickup]=useState("");
  const [destination,setDestination]=useState("");
  const [pickupDate,setPickupDate]=useState("");
  const [pickupTime,setPickupTime]=useState("");
  const [passengers,setPassengers]=useState("2");
  const [customerEmail,setCustomerEmail]=useState("");
  const [rideType,setRideType]=useState<RideType>("point_to_point");
  const [route,setRoute]=useState<RouteResult|null>(null);
  const [quote,setQuote]=useState<Quote|null>(null);
  const [status,setStatus]=useState("");
  const [loading,setLoading]=useState(false);

  async function calculate(){
    setLoading(true); setStatus(""); setQuote(null);
    try {
      const rr=await fetch("/api/route",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({origin:pickup,destination})});
      const rd=await rr.json();
      if(!rr.ok) throw new Error(rd.error ?? "Route calculation failed");
      const routeResult:RouteResult=rd; setRoute(routeResult);
      const qr=await fetch("/api/quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rideType,distanceMiles:routeResult.distanceMiles,durationMinutes:routeResult.durationMinutes,tolls:routeResult.tolls})});
      const qd=await qr.json();
      if(!qr.ok) throw new Error(qd.error ?? "Quote calculation failed");
      setQuote(qd.quote); setStatus("Live trip estimate calculated.");
    } catch(error) { setStatus(error instanceof Error ? error.message : "Unable to calculate this trip."); }
    finally { setLoading(false); }
  }

  async function checkout(){
    if(!route || !quote) return;
    setLoading(true); setStatus("Opening secure payment...");
    try {
      const r=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rideType,distanceMiles:route.distanceMiles,durationMinutes:route.durationMinutes,tolls:route.tolls,pickup,destination,pickupDate,pickupTime,passengers,customerEmail})});
      const d=await r.json();
      if(!r.ok || !d.url) throw new Error(d.error ?? "Checkout is not available yet");
      window.location.href=d.url;
    } catch(error) { setStatus(error instanceof Error ? error.message : "Unable to open checkout."); setLoading(false); }
  }

  const ready=pickup.trim().length>2 && destination.trim().length>2 && !!pickupDate && !!pickupTime && customerEmail.includes("@");

  return (
    <form className="bookingCard" onSubmit={(e)=>e.preventDefault()}>
      <label>Pickup<input value={pickup} onChange={(e)=>setPickup(e.target.value)} placeholder="Airport, hotel, FBO or address" /></label>
      <label>Destination<input value={destination} onChange={(e)=>setDestination(e.target.value)} placeholder="Where are you going?" /></label>
      <div className="row">
        <label>Date<input value={pickupDate} onChange={(e)=>setPickupDate(e.target.value)} type="date" /></label>
        <label>Time<input value={pickupTime} onChange={(e)=>setPickupTime(e.target.value)} type="time" /></label>
      </div>
      <div className="row">
        <label>Passengers<select value={passengers} onChange={(e)=>setPassengers(e.target.value)}><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6+</option></select></label>
        <label>Service<select value={rideType} onChange={(e)=>setRideType(e.target.value as RideType)}>{serviceOptions.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div>
      <label>Email<input value={customerEmail} onChange={(e)=>setCustomerEmail(e.target.value)} type="email" placeholder="you@example.com" /></label>
      <button type="button" onClick={calculate} disabled={!ready || loading}>{loading ? "Calculating..." : "Calculate live trip estimate"}</button>
      {route && quote && (
        <div className="quoteBox">
          <div><span>Distance</span><strong>{route.distanceMiles.toFixed(1)} mi</strong></div>
          <div><span>Drive time</span><strong>{route.durationMinutes} min</strong></div>
          <div><span>Estimated tolls</span><strong>${quote.tolls.toFixed(2)}</strong></div>
          <div><span>Service fee</span><strong>${quote.serviceFee.toFixed(2)}</strong></div>
          <div className="quoteTotal"><span>Estimated total</span><strong>${quote.customerTotal.toFixed(2)}</strong></div>
          <button type="button" className="payButton" onClick={checkout} disabled={loading}>Continue to secure payment</button>
        </div>
      )}
      {status && <p className="formStatus">{status}</p>}
      <small>Pricing is calculated server-side. Final operational rules can still adjust vehicle class, waiting time, events and special requests.</small>
    </form>
  );
}

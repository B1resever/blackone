"use client";

import { FormEvent, useState } from "react";

type ServiceMode = "one_way" | "airport_fbo" | "hourly" | "full_day" | "event_vip" | "custom";
type Vehicle = "s_class" | "escalade_esv" | "luxury_sprinter" | "signature";

const services = [
  ["one_way","One Way"],
  ["airport_fbo","Airport / FBO"],
  ["hourly","Hourly"],
  ["full_day","Full Day"],
  ["event_vip","Event / VIP"],
  ["custom","Custom / Long Distance"]
] as const;

const vehicles = [
  ["s_class","Mercedes-Benz S-Class","Ultra-luxury sedan"],
  ["escalade_esv","Cadillac Escalade ESV","Super-luxury SUV"],
  ["luxury_sprinter","Luxury Sprinter","Executive group vehicle"],
  ["signature","Signature / By Request","Specific approved vehicle"]
] as const;

export default function UltraExclusiveBooking(){
  const [service,setService]=useState<ServiceMode>("one_way");
  const [vehicle,setVehicle]=useState<Vehicle>("escalade_esv");
  const [loading,setLoading]=useState(false);
  const [status,setStatus]=useState("");

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setLoading(true); setStatus("");
    try{
      const data=Object.fromEntries(new FormData(e.currentTarget).entries());
      const response=await fetch("/api/reservations/ultra",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...data,service,vehicle})
      });
      const result=await response.json();
      if(!response.ok) throw new Error(result.error ?? "Unable to submit reservation request");
      setStatus(`Request received · ${result.publicCode}. B1 will prepare the Ultra Exclusive quote.`);
      e.currentTarget.reset();
    }catch(error){
      setStatus(error instanceof Error ? error.message : "Unable to submit reservation request");
    }finally{
      setLoading(false);
    }
  }

  return (
    <form className="ultraBooking" onSubmit={submit}>
      <div className="ultraTabs">
        {services.map(([value,label])=><button key={value} type="button" className={service===value?"active":""} onClick={()=>setService(value)}>{label}</button>)}
      </div>

      <div className="ultraVehicleGrid">
        {vehicles.map(([value,name,copy])=>(
          <button key={value} type="button" className={vehicle===value?"ultraVehicle active":"ultraVehicle"} onClick={()=>setVehicle(value)}>
            <strong>{name}</strong><span>{copy}</span>
          </button>
        ))}
      </div>

      <div className="providerGrid">
        <label>Pickup<input required name="pickup" placeholder="Address, airport, FBO, hotel or venue" /></label>
        <label>Destination<input required name="destination" placeholder="Destination or itinerary endpoint" /></label>
        <label>Date<input required name="date" type="date" /></label>
        <label>Start time<input required name="time" type="time" /></label>

        {(service==="hourly" || service==="full_day") && <label>Reserved hours<input required name="reservedHours" type="number" min="2" max="24" defaultValue={service==="full_day"?8:3} /></label>}
        {service==="airport_fbo" && <label>Flight / tail number<input name="flightNumber" placeholder="Flight or tail number" /></label>}
        {service==="event_vip" && <label>Event / venue<input name="eventName" placeholder="Event or venue" /></label>}

        <label>Passengers<input required name="passengers" type="number" min="1" max="14" defaultValue="2" /></label>
        <label>Luggage pieces<input required name="luggage" type="number" min="0" max="20" defaultValue="2" /></label>
        <label>Full name<input required name="name" /></label>
        <label>Mobile<input required name="phone" type="tel" /></label>
        <label>Email<input required name="email" type="email" /></label>
      </div>

      <label className="ultraNotes">Itinerary / special requests<textarea name="notes" maxLength={1200} placeholder="Stops, Meet & Greet, child seat, security, preferred vehicle, hospitality or other requirements..." /></label>

      <div className="ultraPricingPreview">
        <strong>Quote structure</strong>
        <span>Reserved time/day + applicable mileage + tolls/parking/access + waiting/overtime + disclosed gratuity/tip + approved extras.</span>
      </div>

      <label className="agreementCheck">
        <input required type="checkbox" name="acknowledge" />
        <span>I understand Ultra Exclusive uses dedicated vehicles, separate pricing and reservation-specific cancellation rules shown before final confirmation.</span>
      </label>

      <button className="primaryAction ultraSubmit" type="submit" disabled={loading}>{loading?"Submitting...":"Request Ultra Exclusive quote"}</button>
      {status && <p className="providerStatus success">{status}</p>}
    </form>
  );
}

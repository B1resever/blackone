"use client";

import { FormEvent, useState } from "react";
import type { UltraFleetVehicle } from "@/app/admin/UltraDispatch";

function money(value:number|null|undefined){
  return value==null ? "—" : "$"+Number(value).toFixed(2);
}

export default function UltraFleet({initialVehicles}:{initialVehicles:UltraFleetVehicle[]}){
  const [vehicles,setVehicles]=useState(initialVehicles);
  const [open,setOpen]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  async function add(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setBusy(true); setMessage("");
    try{
      const form=new FormData(e.currentTarget);
      const payload={
        make:String(form.get("make")||""),
        model:String(form.get("model")||""),
        year:Number(form.get("year")||0),
        color:String(form.get("color")||""),
        plate:String(form.get("plate")||""),
        capacity:Number(form.get("capacity")||0),
        luggageCapacity:Number(form.get("luggageCapacity")||0)
      };
      const r=await fetch("/api/admin/ultra/fleet",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error ?? "Unable to add vehicle");
      setVehicles(current=>[...current,d.vehicle]);
      e.currentTarget.reset();
      setMessage("Ultra Exclusive vehicle added.");
    }catch(error){
      setMessage(error instanceof Error?error.message:"Unable to add vehicle");
    }finally{
      setBusy(false);
    }
  }

  async function saveRate(e:FormEvent<HTMLFormElement>,vehicle:UltraFleetVehicle){
    e.preventDefault();
    setBusy(true); setMessage("");
    try{
      const form=new FormData(e.currentTarget);
      const payload={
        vehicleId:vehicle.id,
        luggageCapacity:Number(form.get("luggageCapacity")||0),
        hourlyRate:Number(form.get("hourlyRate")||0),
        minimumHours:Number(form.get("minimumHours")||0),
        dayRate:Number(form.get("dayRate")||0),
        includedMiles:Number(form.get("includedMiles")||0),
        extraMileRate:Number(form.get("extraMileRate")||0),
        waitingHourlyRate:Number(form.get("waitingHourlyRate")||0),
        airportBaseRate:Number(form.get("airportBaseRate")||0),
        meetGreetRate:Number(form.get("meetGreetRate")||0),
        gratuityPercent:Number(form.get("gratuityPercent")||0),
        cancellationHours:Number(form.get("cancellationHours")||0)
      };
      const r=await fetch("/api/admin/ultra/fleet/rates",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error ?? "Unable to save rate card");
      setVehicles(current=>current.map(item=>item.id===vehicle.id?{...item,...d.vehicle}:item));
      setOpen(null);
      setMessage(vehicle.year+" "+vehicle.make+" "+vehicle.model+" rate card saved.");
    }catch(error){
      setMessage(error instanceof Error?error.message:"Unable to save rate card");
    }finally{
      setBusy(false);
    }
  }

  return (
    <div className="ultraFleetWrap">
      <div className="ultraFleetList">
        {vehicles.length===0 && <div className="queue"><span>No dedicated Ultra Exclusive vehicles yet.</span><b>Add first vehicle</b></div>}
        {vehicles.map(v=>(
          <article className="ultraRateCard" key={v.id}>
            <div className="ultraRateSummary">
              <div>
                <small>ULTRA EXCLUSIVE VEHICLE</small>
                <strong>{v.year} {v.make} {v.model}</strong>
                <span>{v.color} · {v.capacity} pax · {v.luggage_capacity ?? 0} luggage · {v.plate}</span>
              </div>
              <div className="ultraRateQuick">
                <span><small>Hourly</small><b>{money(v.hourly_rate)}</b></span>
                <span><small>Day</small><b>{money(v.day_rate)}</b></span>
                <span><small>Airport</small><b>{money(v.airport_base_rate)}</b></span>
                <button type="button" onClick={()=>setOpen(open===v.id?null:v.id)}>{open===v.id?"Close":"Rate Card"}</button>
              </div>
            </div>

            {open===v.id && (
              <form className="ultraRateForm" onSubmit={(e)=>saveRate(e,v)}>
                <label>Luggage capacity<input name="luggageCapacity" type="number" min="0" max="30" defaultValue={v.luggage_capacity ?? 0} /></label>
                <label>Hourly rate<input name="hourlyRate" type="number" min="0" step="0.01" defaultValue={v.hourly_rate ?? 0} /></label>
                <label>Minimum hours<input name="minimumHours" type="number" min="0" max="24" defaultValue={v.minimum_hours ?? 0} /></label>
                <label>Full day rate<input name="dayRate" type="number" min="0" step="0.01" defaultValue={v.day_rate ?? 0} /></label>
                <label>Included miles<input name="includedMiles" type="number" min="0" defaultValue={v.included_miles ?? 0} /></label>
                <label>Extra mile<input name="extraMileRate" type="number" min="0" step="0.01" defaultValue={v.extra_mile_rate ?? 0} /></label>
                <label>Waiting / hour<input name="waitingHourlyRate" type="number" min="0" step="0.01" defaultValue={v.waiting_hourly_rate ?? 0} /></label>
                <label>Airport transfer base<input name="airportBaseRate" type="number" min="0" step="0.01" defaultValue={v.airport_base_rate ?? 0} /></label>
                <label>Meet & Greet<input name="meetGreetRate" type="number" min="0" step="0.01" defaultValue={v.meet_greet_rate ?? 0} /></label>
                <label>Gratuity %<input name="gratuityPercent" type="number" min="0" max="100" step="0.1" defaultValue={v.gratuity_percent ?? 0} /></label>
                <label>Cancellation window / hours<input name="cancellationHours" type="number" min="0" max="720" defaultValue={v.cancellation_hours ?? 0} /></label>
                <div className="ultraRateNote">Tolls, parking and venue/access fees remain actual or reservation-specific charges.</div>
                <button disabled={busy} type="submit">{busy?"Saving...":"Save Rate Card"}</button>
              </form>
            )}
          </article>
        ))}
      </div>

      <form className="ultraFleetForm" onSubmit={add}>
        <input required name="make" placeholder="Make" />
        <input required name="model" placeholder="Model" />
        <input required name="year" type="number" min="2022" max="2030" placeholder="Year" />
        <input required name="color" placeholder="Color" />
        <input required name="plate" placeholder="Plate" />
        <input required name="capacity" type="number" min="1" max="14" placeholder="Passengers" />
        <input required name="luggageCapacity" type="number" min="0" max="30" placeholder="Luggage" />
        <button disabled={busy} type="submit">{busy?"Adding...":"Add Ultra vehicle"}</button>
      </form>
      {message && <p className="formStatus">{message}</p>}
    </div>
  );
}

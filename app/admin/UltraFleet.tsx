"use client";

import { FormEvent, useState } from "react";
import type { UltraFleetVehicle } from "@/app/admin/UltraDispatch";

export default function UltraFleet({initialVehicles}:{initialVehicles:UltraFleetVehicle[]}){
  const [vehicles,setVehicles]=useState(initialVehicles);
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
        capacity:Number(form.get("capacity")||0)
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

  return (
    <div className="ultraFleetWrap">
      <div className="ultraFleetList">
        {vehicles.length===0 && <div className="queue"><span>No dedicated Ultra Exclusive vehicles yet.</span><b>Add first vehicle</b></div>}
        {vehicles.map(v=><div className="queue" key={v.id}><span>{v.year} {v.make} {v.model} · {v.color} · {v.capacity} pax</span><b>{v.plate}</b></div>)}
      </div>
      <form className="ultraFleetForm" onSubmit={add}>
        <input required name="make" placeholder="Make" />
        <input required name="model" placeholder="Model" />
        <input required name="year" type="number" min="2022" max="2030" placeholder="Year" />
        <input required name="color" placeholder="Color" />
        <input required name="plate" placeholder="Plate" />
        <input required name="capacity" type="number" min="1" max="14" placeholder="Capacity" />
        <button disabled={busy} type="submit">{busy?"Adding...":"Add Ultra vehicle"}</button>
      </form>
      {message && <p className="formStatus">{message}</p>}
    </div>
  );
}

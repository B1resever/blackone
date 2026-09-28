"use client";

import { FormEvent, useState } from "react";

export type UltraConfirmed = {
  id:string;
  public_code:string;
  service_type:string;
  vehicle_class:string;
  pickup:string;
  destination:string;
  service_date:string;
  start_time:string;
  customer_name:string;
  status:string;
};

export type UltraDriver = {
  id:string;
  name:string;
};

export type UltraFleetVehicle = {
  id:string;
  make:string;
  model:string;
  year:number;
  color:string;
  plate:string;
  capacity:number;
};

export default function UltraDispatch({
  reservations,
  drivers,
  vehicles
}:{
  reservations:UltraConfirmed[];
  drivers:UltraDriver[];
  vehicles:UltraFleetVehicle[];
}){
  const [items,setItems]=useState(reservations);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  async function assign(e:FormEvent<HTMLFormElement>,reservation:UltraConfirmed){
    e.preventDefault();
    setBusy(true); setMessage("");
    try{
      const form=new FormData(e.currentTarget);
      const r=await fetch("/api/admin/ultra/assign",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          requestId:reservation.id,
          driverId:String(form.get("driverId")||""),
          vehicleId:String(form.get("vehicleId")||"")
        })
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error ?? "Unable to assign Ultra Exclusive reservation");
      setItems(current=>current.filter(item=>item.id!==reservation.id));
      setMessage(reservation.public_code+" assigned to chauffeur and vehicle.");
    }catch(error){
      setMessage(error instanceof Error?error.message:"Unable to assign reservation");
    }finally{
      setBusy(false);
    }
  }

  if(items.length===0){
    return <div className="queue"><span>No confirmed Ultra Exclusive reservations waiting for assignment.</span><b>Ready</b></div>;
  }

  return (
    <div className="ultraDispatchList">
      {items.map(reservation=>(
        <form className="ultraDispatchCard" key={reservation.id} onSubmit={(e)=>assign(e,reservation)}>
          <div>
            <small>{reservation.public_code}</small>
            <strong>{reservation.customer_name}</strong>
            <span>{reservation.pickup} → {reservation.destination}</span>
            <span>{reservation.service_date} · {reservation.start_time}</span>
          </div>
          <div className="ultraDispatchSelectors">
            <select required name="driverId" defaultValue="">
              <option value="" disabled>Select chauffeur</option>
              {drivers.map(driver=><option key={driver.id} value={driver.id}>{driver.name}</option>)}
            </select>
            <select required name="vehicleId" defaultValue="">
              <option value="" disabled>Select Ultra vehicle</option>
              {vehicles.map(vehicle=><option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.plate}</option>)}
            </select>
            <button disabled={busy || drivers.length===0 || vehicles.length===0} type="submit">Assign</button>
          </div>
        </form>
      ))}
      {message && <p className="formStatus">{message}</p>}
    </div>
  );
}

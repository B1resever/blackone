"use client";

import { FormEvent, useState } from "react";

export type UltraRequest = {
  id:string;
  public_code:string;
  service_type:string;
  vehicle_class:string;
  pickup:string;
  destination:string;
  service_date:string;
  start_time:string;
  reserved_hours:number|null;
  passengers:number;
  luggage:number;
  customer_name:string;
  phone:string;
  email:string;
  status:string;
};

function title(value:string){
  return value.replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase());
}

export default function UltraRequests({requests}:{requests:UltraRequest[]}) {
  const [items,setItems]=useState(requests);
  const [open,setOpen]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  async function quote(e:FormEvent<HTMLFormElement>,request:UltraRequest){
    e.preventDefault();
    setBusy(true); setMessage("");
    try{
      const form=new FormData(e.currentTarget);
      const payload={
        requestId:request.id,
        base:Number(form.get("base")||0),
        mileage:Number(form.get("mileage")||0),
        tolls:Number(form.get("tolls")||0),
        parking:Number(form.get("parking")||0),
        waiting:Number(form.get("waiting")||0),
        gratuity:Number(form.get("gratuity")||0),
        extras:Number(form.get("extras")||0),
        note:String(form.get("note")||"")
      };
      const r=await fetch("/api/admin/ultra/quote",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error ?? "Unable to save quote");
      setItems(current=>current.map(item=>item.id===request.id?{...item,status:"quoted"}:item));
      setOpen(null);
      setMessage(request.public_code+" quoted at $"+Number(d.total).toFixed(2)+".");
    }catch(error){
      setMessage(error instanceof Error?error.message:"Unable to save quote");
    }finally{
      setBusy(false);
    }
  }

  if(items.length===0) return <div className="queue"><span>No Ultra Exclusive requests.</span><b>Ready</b></div>;

  return (
    <div className="ultraAdminList">
      {items.map(request=>(
        <article className="ultraAdminCard" key={request.id}>
          <div className="ultraAdminSummary">
            <div>
              <small>{request.public_code} · {title(request.service_type)}</small>
              <strong>{request.customer_name}</strong>
              <span>{title(request.vehicle_class)} · {request.passengers} pax · {request.luggage} luggage</span>
              <span>{request.pickup} → {request.destination}</span>
              <span>{request.service_date} · {request.start_time}{request.reserved_hours?" · "+request.reserved_hours+" hrs":""}</span>
            </div>
            <div className="ultraAdminActions">
              <b>{title(request.status)}</b>
              <button type="button" onClick={()=>setOpen(open===request.id?null:request.id)}>{open===request.id?"Close":"Build quote"}</button>
            </div>
          </div>

          {open===request.id && (
            <form className="ultraQuoteForm" onSubmit={(e)=>quote(e,request)}>
              <div className="ultraQuoteGrid">
                <label>Reserved service / base<input required name="base" type="number" min="0" step="0.01" /></label>
                <label>Mileage<input name="mileage" type="number" min="0" step="0.01" defaultValue="0" /></label>
                <label>Tolls<input name="tolls" type="number" min="0" step="0.01" defaultValue="0" /></label>
                <label>Parking / access<input name="parking" type="number" min="0" step="0.01" defaultValue="0" /></label>
                <label>Waiting / overtime<input name="waiting" type="number" min="0" step="0.01" defaultValue="0" /></label>
                <label>Gratuity / tip<input name="gratuity" type="number" min="0" step="0.01" defaultValue="0" /></label>
                <label>Approved extras<input name="extras" type="number" min="0" step="0.01" defaultValue="0" /></label>
              </div>
              <label className="ultraQuoteNote">Quote note<textarea name="note" maxLength={800} placeholder="Vehicle, included hours/miles, waiting allowance, Meet & Greet, special conditions..." /></label>
              <button disabled={busy} type="submit">{busy?"Saving...":"Save B1 quote"}</button>
            </form>
          )}
        </article>
      ))}
      {message && <p className="formStatus">{message}</p>}
    </div>
  );
}

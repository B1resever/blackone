"use client";

import { useState } from "react";

type ProviderApplication = {
  id:string;
  first_name:string;
  last_name:string;
  vehicle_make:string;
  vehicle_model:string;
  status:string;
};

export default function ProviderApplications({applications}:{applications:ProviderApplication[]}) {
  const [items,setItems]=useState(applications);
  const [busy,setBusy]=useState<string|null>(null);
  const [message,setMessage]=useState("");

  async function review(applicationId:string, action:"approve"|"needs_update"|"reject") {
    let note="";
    if(action!=="approve"){
      note=window.prompt(action==="needs_update" ? "What must the provider update?" : "Reason for rejection:")?.trim() ?? "";
      if(!note) return;
    }

    setBusy(applicationId);
    setMessage("");
    try{
      const r=await fetch("/api/admin/providers/review",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({applicationId,action,note})
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error ?? "Review failed");
      setItems(current=>current.filter(item=>item.id!==applicationId));
      setMessage(action==="approve" ? "Provider approved and activated in B1." : "Provider application updated.");
    }catch(error){
      setMessage(error instanceof Error ? error.message : "Unable to review provider.");
    }finally{
      setBusy(null);
    }
  }

  return (
    <>
      {items.length===0 && <div className="queue"><span>No pending provider applications.</span><b>Ready</b></div>}
      {items.map(driver=>(
        <div className="providerReview" key={driver.id}>
          <div>
            <strong>{driver.first_name} {driver.last_name}</strong>
            <span>{driver.vehicle_make} {driver.vehicle_model} · {driver.status.replaceAll("_"," ")}</span>
          </div>
          <div className="providerActions">
            <button disabled={busy===driver.id} onClick={()=>review(driver.id,"approve")}>Approve</button>
            <button disabled={busy===driver.id} onClick={()=>review(driver.id,"needs_update")}>Needs update</button>
            <button disabled={busy===driver.id} onClick={()=>review(driver.id,"reject")}>Reject</button>
          </div>
        </div>
      ))}
      {message && <p className="formStatus">{message}</p>}
    </>
  );
}

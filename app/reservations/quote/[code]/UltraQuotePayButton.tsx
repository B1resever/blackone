"use client";

import { useState } from "react";

export default function UltraQuotePayButton({code}:{code:string}){
  const [loading,setLoading]=useState(false);
  const [accepted,setAccepted]=useState(false);
  const [status,setStatus]=useState("");

  async function pay(){
    if(!accepted){ setStatus("Please accept the reservation conditions before payment."); return; }
    setLoading(true); setStatus("");
    try{
      const r=await fetch("/api/reservations/ultra/checkout",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({code})
      });
      const d=await r.json();
      if(!r.ok || !d.url) throw new Error(d.error ?? "Unable to open secure payment");
      window.location.href=d.url;
    }catch(error){
      setStatus(error instanceof Error?error.message:"Unable to open secure payment");
      setLoading(false);
    }
  }

  return (
    <div className="ultraPayBox">
      <label className="agreementCheck">
        <input type="checkbox" checked={accepted} onChange={(e)=>setAccepted(e.target.checked)} />
        <span>By continuing to payment, I accept the B1 Ultra Exclusive reservation details and the cancellation, waiting, overtime and additional-charge conditions applicable to this quote.</span>
      </label>
      <button className="primary" type="button" onClick={pay} disabled={loading}>{loading?"Opening secure payment...":"Accept quote & pay securely"}</button>
      {status && <p className="formStatus">{status}</p>}
    </div>
  );
}

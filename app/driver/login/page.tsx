"use client";

import { FormEvent, useState } from "react";

export default function DriverLoginPage(){
  const [phone,setPhone]=useState("");
  const [code,setCode]=useState("");
  const [stage,setStage]=useState<"phone"|"code">("phone");
  const [loading,setLoading]=useState(false);
  const [status,setStatus]=useState("");

  async function requestCode(e:FormEvent){
    e.preventDefault(); setLoading(true); setStatus("");
    try{
      const r=await fetch("/api/drivers/auth/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error ?? "Unable to send code");
      setPhone(d.phone);
      setStage("code");
    }catch(error){setStatus(error instanceof Error?error.message:"Unable to send code");}
    finally{setLoading(false);}
  }

  async function verify(e:FormEvent){
    e.preventDefault(); setLoading(true); setStatus("");
    try{
      const r=await fetch("/api/drivers/auth/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,code})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error ?? "Unable to verify code");
      window.location.href="/driver";
    }catch(error){setStatus(error instanceof Error?error.message:"Unable to verify code");}
    finally{setLoading(false);}
  }

  return <main className="providerLogin">
    <section className="providerLoginCard">
      <div className="b1LoginMark">B1</div>
      <div className="eyebrow dark">B1 DRIVER ACCESS</div>
      {stage==="phone" ? <>
        <h1>Welcome.</h1>
        <p>Enter the mobile number connected to your approved B1 provider profile.</p>
        <form onSubmit={requestCode}>
          <label>Mobile number<input value={phone} onChange={e=>setPhone(e.target.value)} required type="tel" placeholder="+1 305 000 0000" /></label>
          <button disabled={loading}>{loading?"Sending...":"Continue with phone number"}</button>
        </form>
        <div className="loginFoot">Not registered yet? <a href="/driver/register">Register as a provider</a></div>
      </> : <>
        <h1>Verification</h1>
        <p>Enter the 6-digit code sent to <strong>{phone}</strong>.</p>
        <form onSubmit={verify}>
          <label>Verification code<input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} required inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="otpInput" /></label>
          <button disabled={loading || code.length!==6}>{loading?"Verifying...":"Verify & continue"}</button>
        </form>
        <button className="loginBack" type="button" onClick={()=>{setStage("phone");setCode("");setStatus("");}}>← Change phone number</button>
      </>}
      {status && <p className="providerStatus">{status}</p>}
    </section>
  </main>;
}

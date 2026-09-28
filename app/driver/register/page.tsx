"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

const steps = [
  ["1","Your details"],
  ["2","License"],
  ["3","Vehicle"],
  ["4","Insurance"],
  ["5","Agreement"]
] as const;

export default function DriverRegisterPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [status,setStatus]=useState("");
  const [submitted,setSubmitted]=useState(false);

  const progress=useMemo(()=>Math.round((step/steps.length)*100),[step]);

  function next(){
    const form=formRef.current;
    if(!form) return;
    const section=form.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const fields=Array.from(section?.querySelectorAll<HTMLInputElement|HTMLSelectElement>("input,select") ?? []);
    for(const field of fields){
      if(!field.checkValidity()){ field.reportValidity(); return; }
    }
    setStatus("");
    setStep((value)=>Math.min(steps.length,value+1));
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function back(){
    setStatus("");
    setStep((value)=>Math.max(1,value-1));
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setLoading(true); setStatus(""); setSubmitted(false);
    try{
      const form=new FormData(e.currentTarget);
      const response=await fetch("/api/drivers/register",{method:"POST",body:form});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error ?? "Unable to submit application");
      setSubmitted(true);
      setStatus("Application received. B1 status: Pending Review.");
      setStep(5);
    }catch(error){
      setStatus(error instanceof Error ? error.message : "Unable to submit application.");
    }finally{
      setLoading(false);
    }
  }

  return (
    <main className="providerOnboarding">
      <header className="portalHeader providerHeader">
        <a href="/driver">← B1 Driver</a><span>PROVIDER REGISTRATION</span>
      </header>

      <section className="providerIntro">
        <div className="eyebrow">B1 · INDEPENDENT TRANSPORTATION PROVIDER</div>
        <h1>Build your B1 provider profile.</h1>
        <p>Complete each step once. B1 reviews the provider, license, vehicle and insurance before trip eligibility is activated.</p>
      </section>

      <div className="stepShell">
        <div className="stepTrack">
          {steps.map(([n,label],index)=><div className={"stepItem "+(step>=index+1?"active":"")} key={n}><span>{n}</span><small>{label}</small></div>)}
        </div>
        <div className="progressLine"><i style={{width:`${progress}%`}} /></div>
      </div>

      <form ref={formRef} className="providerForm" onSubmit={submit}>
        <section className={step===1?"providerStep active":"providerStep"} data-step="1">
          <div className="stepTitle"><span>01</span><div><h2>Your details</h2><p>Identity and contact information used for B1 operations.</p></div></div>
          <div className="providerGrid">
            <label>Profile photo<input required name="providerPhoto" type="file" accept="image/*" capture="user" /></label>
            <label>Mobile / WhatsApp<input required name="phone" type="tel" inputMode="tel" placeholder="+1 305 000 0000" /></label>
            <label>First name<input required name="firstName" autoComplete="given-name" /></label>
            <label>Last name<input required name="lastName" autoComplete="family-name" /></label>
            <label>Email<input required name="email" type="email" autoComplete="email" /></label>
            <label>Street address<input required name="address" autoComplete="street-address" /></label>
            <label>City<input required name="city" /></label>
            <label>State<select required name="state" defaultValue="FL"><option value="FL">Florida</option></select></label>
            <label>ZIP code<input required name="zip" inputMode="numeric" maxLength={10} /></label>
          </div>
          <div className="privacyNotice"><strong>Privacy:</strong> B1 will not collect a Social Security number in this form. Tax and payout information will be handled later through a dedicated secure provider flow.</div>
        </section>

        <section className={step===2?"providerStep active":"providerStep"} data-step="2">
          <div className="stepTitle"><span>02</span><div><h2>Driver license</h2><p>Upload clear images of both sides of the current license.</p></div></div>
          <div className="documentGrid">
            <label className="uploadCard">License front<input required name="licenseFront" type="file" accept="image/*" capture="environment" /><b>Take photo or upload</b><small>JPG, PNG or WEBP · max 5 MB</small></label>
            <label className="uploadCard">License back<input required name="licenseBack" type="file" accept="image/*" capture="environment" /><b>Take photo or upload</b><small>JPG, PNG or WEBP · max 5 MB</small></label>
          </div>
          <div className="providerGrid">
            <label>License number<input required name="licenseNumber" /></label>
            <label>License state<input required name="licenseState" defaultValue="FL" /></label>
            <label>Expiration date<input required name="licenseExpires" type="date" /></label>
          </div>
        </section>

        <section className={step===3?"providerStep active":"providerStep"} data-step="3">
          <div className="stepTitle"><span>03</span><div><h2>Vehicle details</h2><p>Vehicle registration and operating information.</p></div></div>
          <div className="documentGrid">
            <label className="uploadCard">Vehicle registration<input required name="registrationFile" type="file" accept="image/*,.pdf" capture="environment" /><b>Take photo or upload</b><small>Image or PDF · max 5 MB</small></label>
          </div>
          <div className="providerGrid">
            <label>Make<input required name="make" /></label>
            <label>Model<input required name="model" /></label>
            <label>Year<input required name="year" type="number" min="2000" max="2031" /></label>
            <label>Color<input required name="color" /></label>
            <label>VIN<input required name="vin" minLength={11} maxLength={17} /></label>
            <label>License plate<input required name="plate" /></label>
            <label>Registration state<input required name="registrationState" defaultValue="FL" /></label>
            <label>Registration expiration<input required name="registrationExpires" type="date" /></label>
            <label>B1 vehicle class<select required name="vehicleClass" defaultValue="comfort"><option value="comfort">Comfort · Luxury vehicle</option><option value="xl">XL · 7 seats + luggage space</option><option value="black">Black · SUV only · 2022–2026</option></select></label>
            <label>Vehicle type<select required name="vehicleType" defaultValue="suv"><option value="sedan">Sedan</option><option value="suv">SUV</option><option value="luxury_sedan">Luxury Sedan</option><option value="luxury_suv">Luxury SUV</option><option value="van">Van / Sprinter</option></select></label>
            <label>Passenger capacity<input required name="capacity" type="number" min="1" max="20" /></label>
          </div>
        </section>

        <section className={step===4?"providerStep active":"providerStep"} data-step="4">
          <div className="stepTitle"><span>04</span><div><h2>Insurance</h2><p>Upload the active insurance document for the vehicle used on B1 trips.</p></div></div>
          <div className="documentGrid">
            <label className="uploadCard">Insurance document<input required name="insuranceFile" type="file" accept="image/*,.pdf" capture="environment" /><b>Take photo or upload</b><small>Image or PDF · max 5 MB</small></label>
          </div>
          <div className="providerGrid">
            <label>Insurance company<input required name="insuranceCompany" /></label>
            <label>Policy number<input required name="insurancePolicy" /></label>
            <label>Policy expiration<input required name="insuranceExpires" type="date" /></label>
          </div>
          <div className="privacyNotice">B1 review does not replace any insurance, licensing or regulatory obligation applicable to the independent transportation provider.</div>
        </section>

        <section className={step===5?"providerStep active":"providerStep"} data-step="5">
          <div className="stepTitle"><span>05</span><div><h2>B1 provider agreement</h2><p>Confirm the operating rules before submitting the profile for review.</p></div></div>
          <div className="agreementBox providerAgreement">
            <label className="agreementCheck"><input required name="ackAccuracy" type="checkbox" /><span>I confirm the information and documents submitted are accurate and current.</span></label>
            <label className="agreementCheck"><input required name="ackIndependent" type="checkbox" /><span>I understand I am applying as an independent transportation provider and each trip is accepted individually.</span></label>
            <label className="agreementCheck"><input required name="ackTripCode" type="checkbox" /><span>I understand a B1 trip becomes my confirmed responsibility only after I accept it and complete the required verification step.</span></label>
            <label className="agreementCheck"><input required name="ackLocation" type="checkbox" /><span>I understand location sharing is required only after a trip is accepted and verified and while that trip remains operationally active.</span></label>
            <label className="agreementCheck"><input required name="ackNoDirect" type="checkbox" /><span>I understand passenger contact and future reservations obtained through B1 must remain within the B1 communication and reservation workflow.</span></label>
          </div>
          <div className="reviewNotice"><strong>Next:</strong> after submission, B1 reviews the profile. Approval is required before trip offers can be received.</div>
        </section>

        <div className="providerActions">
          {step>1 && !submitted && <button type="button" className="secondaryAction" onClick={back}>Back</button>}
          {step<steps.length && <button type="button" className="primaryAction" onClick={next}>Next</button>}
          {step===steps.length && !submitted && <button type="submit" className="primaryAction" disabled={loading}>{loading?"Submitting...":"Submit for B1 review"}</button>}
        </div>
        {status && <p className={"providerStatus "+(submitted?"success":"")}>{status}</p>}
      </form>
    </main>
  );
}

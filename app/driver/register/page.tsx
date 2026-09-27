"use client";

import { FormEvent, useState } from "react";

export default function DriverRegisterPage() {
  const [submitted,setSubmitted]=useState(false);

  function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="portalPage">
      <header className="portalHeader"><a href="/driver">← B1 Driver</a><span>PROVIDER ONBOARDING · PREVIEW</span></header>
      <section className="portalHero">
        <div>
          <div className="eyebrow dark">B1 INDEPENDENT TRANSPORTATION PROVIDER</div>
          <h1>Register once. Receive eligible B1 trip opportunities.</h1>
          <p>Provider approval is required before receiving trip offers. B1 does not require location access until a specific trip has been accepted and verified.</p>
        </div>
      </section>

      <form className="onboardingForm" onSubmit={submit}>
        <section className="panel onboardingSection">
          <div className="eyebrow dark">01 · PROVIDER</div>
          <h2>Personal information</h2>
          <div className="onboardingGrid">
            <label>First name<input required name="firstName" /></label>
            <label>Last name<input required name="lastName" /></label>
            <label>Mobile / WhatsApp<input required name="phone" type="tel" /></label>
            <label>Email<input required name="email" type="email" /></label>
          </div>
        </section>

        <section className="panel onboardingSection">
          <div className="eyebrow dark">02 · DRIVER CREDENTIALS</div>
          <h2>License and eligibility</h2>
          <div className="onboardingGrid">
            <label>Driver license number<input required name="licenseNumber" /></label>
            <label>License state<input required name="licenseState" defaultValue="FL" /></label>
            <label>License expiration<input required name="licenseExpires" type="date" /></label>
            <label>Provider photo<input required name="providerPhoto" type="file" accept="image/*" /></label>
          </div>
        </section>

        <section className="panel onboardingSection">
          <div className="eyebrow dark">03 · VEHICLE</div>
          <h2>Vehicle information</h2>
          <div className="onboardingGrid">
            <label>Make<input required name="make" /></label>
            <label>Model<input required name="model" /></label>
            <label>Year<input required name="year" type="number" min="2000" max="2030" /></label>
            <label>Color<input required name="color" /></label>
            <label>License plate<input required name="plate" /></label>
            <label>Passenger capacity<input required name="capacity" type="number" min="1" max="20" /></label>
          </div>
        </section>

        <section className="panel onboardingSection">
          <div className="eyebrow dark">04 · DOCUMENTS</div>
          <h2>Registration and insurance</h2>
          <div className="onboardingGrid">
            <label>Vehicle registration<input required name="registrationFile" type="file" accept="image/*,.pdf" /></label>
            <label>Registration expiration<input required name="registrationExpires" type="date" /></label>
            <label>Insurance document<input required name="insuranceFile" type="file" accept="image/*,.pdf" /></label>
            <label>Insurance expiration<input required name="insuranceExpires" type="date" /></label>
          </div>
        </section>

        <section className="panel onboardingSection">
          <div className="eyebrow dark">05 · B1 AGREEMENT</div>
          <h2>Independent provider acknowledgment</h2>
          <div className="agreementBox">
            <label className="agreementCheck"><input required type="checkbox" /> <span>I confirm the information submitted is accurate and understand that approval is required before I can receive B1 trip opportunities.</span></label>
            <label className="agreementCheck"><input required type="checkbox" /> <span>I understand each B1 trip is accepted individually and that verified acceptance creates my responsibility to perform that specific transportation service under the applicable provider terms.</span></label>
            <label className="agreementCheck"><input required type="checkbox" /> <span>I understand location sharing is required only after I accept and verify a trip and while that trip is operationally active.</span></label>
          </div>
        </section>

        <section className="panel onboardingSubmit">
          <div>
            <h2>Submit for B1 review</h2>
            <p>Approved providers will become eligible to receive B1 trip opportunities through the configured communication channel.</p>
          </div>
          <button className="primary" type="submit">Submit application</button>
          {submitted && <p className="formStatus">Onboarding interface validated. Secure document storage and database activation are the next backend step.</p>}
        </section>
      </form>
    </main>
  );
}

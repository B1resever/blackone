const stages = [
  ["01", "Trip Offer", "Review pickup area, destination, time, vehicle requirement and estimated payout."],
  ["02", "Accept", "Accept the specific trip and confirm responsibility with the B1 verification code."],
  ["03", "Location", "Location sharing becomes required only after the trip is Accepted & Verified."],
  ["04", "Trip", "En Route → Arrived → Passenger Onboard → Completed."],
  ["05", "Closeout", "Extras, incidents and final payout are resolved before the trip is Closed."]
];

export default function DriverPage() {
  return (
    <main className="portalPage">
      <header className="portalHeader"><a href="/">← B1</a><span>B1 DRIVER · PREVIEW</span></header>
      <section className="portalHero">
        <div>
          <div className="eyebrow dark">INDEPENDENT TRANSPORTATION PROVIDER</div>
          <h1>Offers, verified acceptance and trip execution.</h1>
          <p>B1 provides the connection and operating workflow. Each accepted trip is confirmed individually by the independent transportation provider.</p>
        </div>
      </section>
      <section className="dashboardGrid">
        <article className="metric"><small>Provider status</small><strong>Pending setup</strong><span>Trips are available only to approved providers.</span></article>
        <article className="metric"><small>Trip offers</small><strong>WhatsApp</strong><span>B1 sends trip opportunities through the communication channel.</span></article>
        <article className="metric"><small>Acceptance</small><strong>Code verified</strong><span>A trip is assigned only after B1 verification.</span></article>
        <article className="metric"><small>Location</small><strong>Trip only</strong><span>Required after acceptance and during the active service.</span></article>
      </section>
      <section className="panel">
        <h2>B1 Driver Flow</h2>
        {stages.map(([n,title,copy]) => (
          <div className="queue" key={n}>
            <span><strong>{n} · {title}</strong><br />{copy}</span>
            <b>Defined</b>
          </div>
        ))}
      </section>
      <section className="panel">
        <h2>Cancellation rule</h2>
        <p>A provider cancellation after verified acceptance requires a reason, is recorded in the provider profile and immediately returns the trip to dispatch for re-offer.</p>
      </section>
    </main>
  );
}

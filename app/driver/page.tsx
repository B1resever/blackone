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
        </div><div className="heroActions"><a className="primary" href="/driver/login">Driver login</a><a className="secondary" href="/driver/register">Register as a provider</a></div>
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
        <h2>B1 system fee</h2>
        <p>The provider system fee is $25 per month. The provider can pay the $25 upfront or choose automatic trip contributions.</p>
        <div className="queue"><span><strong>Pay upfront</strong><br />One $25 payment covers the current service month.</span><b>$25 / month</b></div>
        <div className="queue"><span><strong>Pay from trips</strong><br />B1 applies 5% of completed trip earnings toward the $25 monthly fee. Once the current month is covered, contributions begin building the next month's $25 credit.</span><b>5% / trip</b></div>
        <p>When both the current month and the next-month credit are fully funded, no additional system-fee withholding is taken until a new month opens.</p>
      </section>
      <section className="panel">
        <h2>Cancellation rule</h2>
        <p>A provider cancellation after verified acceptance requires a reason, is recorded in the provider profile and immediately returns the trip to dispatch for re-offer.</p>
      </section>
    </main>
  );
}

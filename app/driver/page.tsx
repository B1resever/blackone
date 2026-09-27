const tasks = [
  ["Next trip", "MIA → Miami Beach", "Pickup 8:40 PM"],
  ["Vehicle", "Cadillac Escalade ESV", "Unit B1-01"],
  ["Trip status", "Assigned", "Awaiting driver confirmation"]
];

export default function DriverPage() {
  return (
    <main className="portalPage">
      <header className="portalHeader"><a href="/">← B1 Reserve</a><span>DRIVER PORTAL · PREVIEW</span></header>
      <section className="portalHero">
        <div><div className="eyebrow dark">CHAUFFEUR OPERATIONS</div><h1>Your trips, route and payout in one place.</h1><p>Secure driver authentication and live dispatch will be connected in the next backend phase.</p></div>
        <button>Go online</button>
      </section>
      <section className="dashboardGrid">
        {tasks.map(([a,b,c]) => <article className="metric" key={a}><small>{a}</small><strong>{b}</strong><span>{c}</span></article>)}
      </section>
      <section className="panel"><h2>Driver workflow</h2><p>Accept trip → Navigate to pickup → Arrived → Passenger onboard → Complete trip → Earnings recorded.</p></section>
    </main>
  );
}

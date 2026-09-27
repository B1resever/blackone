const metrics = [
  ["Open reservations", "12"],
  ["Trips today", "8"],
  ["Drivers online", "5"],
  ["Pending assignments", "3"]
];

export default function AdminPage() {
  return (
    <main className="portalPage adminBg">
      <header className="portalHeader"><a href="/">← B1 Reserve</a><span>ONE OPERATIONS · PREVIEW</span></header>
      <section className="portalHero">
        <div><div className="eyebrow dark">B1 COMMAND CENTER</div><h1>Reservations, dispatch and margins.</h1><p>This becomes the private operating dashboard for B1 staff.</p></div>
        <button>New reservation</button>
      </section>
      <section className="dashboardGrid">
        {metrics.map(([a,b]) => <article className="metric" key={a}><small>{a}</small><strong>{b}</strong><span>Live data connection pending</span></article>)}
      </section>
      <section className="panel"><h2>Dispatch queue</h2><div className="queue"><span>#B1-1048 · MIA → Brickell</span><b>Needs driver</b></div><div className="queue"><span>#B1-1049 · Palm Beach → FLL</span><b>Quoted</b></div><div className="queue"><span>#B1-1050 · Hourly · Miami Beach</span><b>Confirmed</b></div></section>
    </main>
  );
}

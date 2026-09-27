import BookingClient from "@/app/components/BookingClient";

const services = [
  ["Point to Point","Direct private transportation with live route pricing."],
  ["Airport & FBO","Commercial airport, private aviation and terminal coordination."],
  ["Hourly Chauffeur","Keep your chauffeur and vehicle available between stops."],
  ["Corporate & VIP","Executive travel, hospitality, events and recurring accounts."]
];

const flow = [
  ["01","Plan","Enter pickup, destination, date, time and passengers."],
  ["02","Price","Distance, traffic-aware time and available toll estimates are calculated."],
  ["03","Pay","Confirm the reservation through secure Stripe Checkout."],
  ["04","Dispatch","B1 assigns the confirmed trip to an approved chauffeur."]
];

export default function Home(){
  return <main>
    <header className="nav"><a className="brand" href="#top"><span>B1</span> RESERVE</a><nav className="links"><a href="#book">Reserve</a><a href="#services">Services</a><a href="/driver">Drivers</a><a href="/admin">Operations</a></nav><a className="navCta" href="#book">Reserve now</a></header>
    <section id="top" className="hero"><div className="eyebrow">BLACK ONE · PRIVATE MOBILITY</div><h1>One platform for premium transportation.</h1><p>Plan the route, receive a live estimate, pay securely and move the confirmed reservation directly into B1 operations and chauffeur dispatch.</p><div className="heroActions"><a className="primary" href="#book">Plan a ride</a><a className="secondary" href="#how">How it works</a></div><div className="coverage">Miami · Brickell · Miami Beach · Fort Lauderdale · Palm Beach · Airports & FBOs</div></section>
    <section id="book" className="bookingShell"><div><div className="eyebrow">LIVE RESERVATION ENGINE</div><h2>From. To. Price. Reserve.</h2><p className="muted">ONE now has the route, quote and secure-payment architecture required to turn a request into a real paid reservation.</p></div><BookingClient /></section>
    <section id="services" className="section"><div className="eyebrow dark">SERVICES</div><h2>Built for clients and operations.</h2><div className="grid">{services.map(([title,copy])=><article className="card" key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section id="how" className="section darkSection"><div className="eyebrow">ONE WORKFLOW</div><h2>A reservation becomes an assigned trip.</h2><div className="flow">{flow.map(([n,title,copy])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section className="section split"><div><div className="eyebrow dark">OPERATIONS</div><h2>Two sides. One system.</h2></div><div className="portalGrid"><a className="portal" href="/driver"><strong>Driver Portal</strong><span>Trips · status · navigation · earnings · documents</span></a><a className="portal" href="/admin"><strong>B1 Operations</strong><span>Bookings · dispatch · pricing · clients · drivers</span></a></div></section>
    <footer>© 2026 B1 Reserve / BLACK ONE · Private Luxury Mobility</footer>
  </main>;
}

const vehicleClasses = [
  {
    name: "Comfort",
    subtitle: "Luxury vehicle",
    details: ["B1-approved luxury vehicles", "Premium interior and presentation", "Best for executive and private travel"]
  },
  {
    name: "XL",
    subtitle: "7 seats + luggage",
    details: ["Seven passenger seats", "Dedicated luggage capacity", "Best for families, groups and airport travel"]
  },
  {
    name: "SUV",
    subtitle: "Super luxury SUV · 2022–2026",
    details: ["Cadillac Escalade / equivalent super-luxury SUV", "Model years 2022–2026", "Premium group, airport and VIP transportation"]
  }
];

const reservationTypes = [
  {
    name: "Point to Point",
    details: ["Fixed pickup and destination", "Price calculated before confirmation", "Short complimentary pickup wait window", "Additional stops or extended waiting may change the final amount"]
  },
  {
    name: "Airport & FBO",
    details: ["Flight information requested when applicable", "Flight-aware pickup coordination", "Extended complimentary waiting window for arriving flights", "Meet & Greet may be offered as an additional service"]
  },
  {
    name: "Hourly",
    details: ["Vehicle and provider remain reserved for the booked period", "Minimum booking time may apply", "Stops within the reserved time are handled as part of the hourly service", "Extensions are billed according to the active hourly rate"]
  },
  {
    name: "Event / VIP",
    details: ["Event-specific pickup and traffic planning", "Minimum time or special pricing may apply", "Waiting, staging, parking and access requirements can affect the reservation", "Final terms are shown before payment"]
  }
];

const generalRules = [
  ["Pricing", "B1 shows the reservation price before payment. Distance, estimated time, vehicle class, tolls, airport/event conditions and applicable extras may affect the total."],
  ["Waiting time", "Complimentary waiting time depends on the reservation type. Additional waiting is billable after the included period."],
  ["Stops & changes", "Additional stops, destination changes or extended service may produce an updated trip amount."],
  ["Cancellation", "The applicable cancellation charge depends on how close the cancellation is to pickup and whether a provider has already accepted and verified the trip."],
  ["No-show", "A no-show may be charged according to the reservation terms shown before confirmation."],
  ["Luggage", "Passenger count and luggage must match the selected vehicle class. B1 may require a larger vehicle when luggage volume exceeds safe capacity."],
  ["Cleaning / damage", "Extraordinary cleaning or documented damage may result in an additional charge after B1 review."],
  ["Provider assignment", "B1 connects the reservation with an eligible independent transportation provider. A specific provider is not confirmed until the assignment is accepted and verified."]
];

export default function ReservationsPage(){
  return (
    <main className="reservationsPage">
      <header className="portalHeader reservationHeader">
        <a href="/">← B1</a>
        <span>RESERVATIONS</span>
      </header>

      <section className="reservationHero">
        <div className="eyebrow">B1 · RESERVATION STANDARD</div>
        <h1>Know the service before you reserve.</h1>
        <p>Vehicle class, service conditions, waiting rules, luggage requirements and cancellation terms are organized in one place before the customer confirms a B1 reservation.</p>
        <a className="primary" href="/#book">Start a reservation</a>
      </section>

      <section className="reservationSection">
        <div className="eyebrow dark">VEHICLE CLASSES</div>
        <h2>Choose the vehicle level that fits the trip.</h2>
        <div className="reservationCards">
          {vehicleClasses.map((vehicle)=>(
            <article className="reservationCard" key={vehicle.name}>
              <span className="reservationTag">{vehicle.subtitle}</span>
              <h3>{vehicle.name}</h3>
              <ul>{vehicle.details.map((item)=><li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="reservationSection reservationDark">
        <div className="eyebrow">RESERVATION TYPES</div>
        <h2>Different trips use different operating rules.</h2>
        <div className="reservationCards four">
          {reservationTypes.map((service)=>(
            <article className="reservationCard darkCard" key={service.name}>
              <h3>{service.name}</h3>
              <ul>{service.details.map((item)=><li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="reservationSection">
        <div className="eyebrow dark">GENERAL CONDITIONS</div>
        <h2>What applies to a B1 reservation.</h2>
        <div className="rulesList">
          {generalRules.map(([title,copy])=>(
            <div className="ruleRow" key={title}>
              <strong>{title}</strong>
              <p>{copy}</p>
            </div>
          ))}
        </div>
        <div className="reservationNotice">
          <strong>Important:</strong> exact prices, complimentary waiting periods, cancellation windows and additional service charges may vary by reservation type and will be presented before final confirmation.
        </div>
      </section>
    </main>
  );
}

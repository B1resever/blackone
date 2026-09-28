const pricingComponents = [
  ["Hourly", "Vehicle + chauffeur reserved by the hour. A minimum number of hours can apply depending on the vehicle and service."],
  ["Full Day", "Dedicated vehicle and chauffeur for a defined daily service window. Overtime is billed separately."],
  ["Mileage", "Mileage can apply to long-distance, out-of-area or custom itineraries in addition to the reserved service block."],
  ["Tolls & Parking", "Actual tolls, parking, airport, venue and access charges are added when applicable."],
  ["Waiting", "Complimentary waiting is defined by reservation type. Additional waiting is billed at the vehicle's waiting rate."],
  ["Gratuity", "Gratuity is shown separately and transparently. It can be optional or included only when the booking terms expressly disclose it before payment."]
];

const serviceTypes = [
  ["Airport / FBO", "Premium airport or private aviation coordination, flight-aware pickup, luggage planning and chauffeur waiting rules."],
  ["Hourly Chauffeur", "Dedicated ultra-luxury vehicle and chauffeur kept available for multiple stops during the reserved period."],
  ["Full Day", "Vehicle and chauffeur reserved for an extended service day with itinerary coordination and overtime rules."],
  ["Point to Point", "Prearranged ultra-luxury transfer with a specific vehicle, pickup, destination and confirmed price."],
  ["Event / VIP", "High-touch transportation for events, hospitality, executive movement and controlled arrival/departure timing."],
  ["Custom / Long Distance", "Individually quoted itinerary using time, mileage, route, overnight needs and destination requirements."]
];

const rules = [
  ["Dedicated fleet only", "This reservation product is restricted to B1-approved ultra-luxury vehicles. Standard B1 Comfort, XL and regular transportation vehicles do not qualify for this service."],
  ["Specific vehicle", "The reservation is tied to an eligible vehicle class or specifically confirmed vehicle. Substitutions require B1 approval and must remain within the same or a higher approved luxury level."],
  ["Chauffeur standard", "The service is chauffeur-based, prearranged and high-touch. Presentation, punctuality, luggage assistance and professional conduct form part of the operating standard."],
  ["Pricing model", "This product does not use the same pricing engine as regular B1 transportation. The quote can combine hourly, daily, mileage, tolls, parking, waiting and other disclosed service components."],
  ["Waiting", "Waiting time is tracked separately after the complimentary period included with the reservation type."],
  ["Changes", "Extra stops, route changes, extended service time or itinerary changes can update the final reservation amount."],
  ["Cancellation", "Cancellation rules are stricter for dedicated ultra-luxury inventory because the vehicle and chauffeur are blocked for the reservation. The exact cancellation window and charge are shown before confirmation."],
  ["No-show", "A no-show can be charged up to the applicable reservation amount based on the terms accepted at booking."],
  ["Damage / cleaning", "Extraordinary cleaning or documented damage is reviewed by B1 and may result in an additional charge."],
  ["Tips / gratuity", "Gratuity is never hidden. If a reservation includes a service gratuity, the percentage or amount is disclosed before payment; otherwise the customer can choose an optional tip."]
];

export default function ReservationsPage(){
  return (
    <main className="reservationsPage">
      <header className="portalHeader reservationHeader">
        <a href="/">← B1</a>
        <span>ULTRA EXCLUSIVE RESERVATIONS</span>
      </header>

      <section className="reservationHero">
        <div className="eyebrow">B1 · ULTRA EXCLUSIVE</div>
        <h1>A dedicated luxury service with its own fleet, pricing and rules.</h1>
        <p>This is not the regular B1 ride product. Ultra Exclusive reservations use only specifically approved luxury vehicles and a chauffeur-service pricing model built around time, day, mileage and operating costs.</p>
        <a className="primary" href="/#book">Request a reservation</a>
      </section>

      <section className="reservationSection">
        <div className="eyebrow dark">ELIGIBLE VEHICLES</div>
        <h2>Only the dedicated B1 ultra-luxury fleet qualifies.</h2>
        <div className="reservationNotice">
          Standard Comfort, XL and other regular B1 vehicles are excluded from this product. The exact approved makes, models, model years and configurations will be maintained as a separate B1 fleet list.
        </div>
      </section>

      <section className="reservationSection reservationDark">
        <div className="eyebrow">SERVICE TYPES</div>
        <h2>Different reservations. Different operating structure.</h2>
        <div className="reservationCards">
          {serviceTypes.map(([title,copy])=>(
            <article className="reservationCard darkCard" key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="reservationSection">
        <div className="eyebrow dark">PRICE STRUCTURE</div>
        <h2>The customer sees every component before confirmation.</h2>
        <div className="reservationCards">
          {pricingComponents.map(([title,copy])=>(
            <article className="reservationCard" key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="reservationSection">
        <div className="eyebrow dark">ULTRA EXCLUSIVE CONDITIONS</div>
        <h2>Rules designed for dedicated vehicle and chauffeur reservations.</h2>
        <div className="rulesList">
          {rules.map(([title,copy])=>(
            <div className="ruleRow" key={title}>
              <strong>{title}</strong>
              <p>{copy}</p>
            </div>
          ))}
        </div>
        <div className="reservationNotice">
          <strong>Pricing formula:</strong> reserved time or day rate + applicable mileage + tolls/parking/access fees + waiting/extension charges + disclosed gratuity or optional tip + approved extras.
        </div>
      </section>
    </main>
  );
}

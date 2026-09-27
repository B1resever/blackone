export default async function SuccessPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="successPage">
      <div className="successCard">
        <div className="successCheck">✓</div>
        <div className="eyebrow dark">PAYMENT RECEIVED</div>
        <h1>Your B1 reservation is moving to confirmation.</h1>
        <p>Payment returned successfully from Stripe. The next backend phase will persist the reservation and notify dispatch.</p>
        {params.session_id && <small>Stripe session: {params.session_id}</small>}
        <a className="primary" href="/">Return to B1 Reserve</a>
      </div>
    </main>
  );
}

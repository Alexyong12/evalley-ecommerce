export const metadata = { title: 'FAQ · Evalley' };

const FAQS = [
  ['How long does delivery take?', 'Phnom Penh orders arrive within 24 hours; provinces within 2-3 days.'],
  ['Which payment methods do you accept?', 'KHQR, Vattanac Bank, Visa/Master Card and Cash on Delivery.'],
  ['Can I return an item?', 'Yes - unused items can be returned within 7 days of delivery.'],
  ['How do I cancel an order?', 'Open My Account → Orders, select the order and press Cancel order while it is still pending.'],
  ['Is there a delivery fee?', 'A flat $2.00 delivery fee applies; orders over $50 ship free during promotions.'],
];

export default function FaqPage() {
  return (
    <div className="container" style={{ marginTop: 24, maxWidth: 760 }}>
      <h1>FAQ</h1>
      {FAQS.map(([q, a]) => (
        <div key={q} className="card" style={{ marginBottom: 12 }}>
          <strong>{q}</strong>
          <p className="muted" style={{ margin: '6px 0 0' }}>{a}</p>
        </div>
      ))}
    </div>
  );
}

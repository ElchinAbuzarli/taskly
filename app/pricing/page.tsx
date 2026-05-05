import { getPublicPricing } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const plans = await getPublicPricing();

  return (
    <main className="container">
      <h1>Plan / Feature Matrix</h1>
      <p>Each feature is independent data and can be managed per plan.</p>

      <table className="table">
        <thead>
          <tr>
            <th>Plan</th>
            <th>Feature Code</th>
            <th>Capability Key</th>
            <th>Feature Name</th>
            <th>Included</th>
            <th>Order</th>
          </tr>
        </thead>
        <tbody>
          {plans.flatMap((plan) =>
            plan.features.map((feature) => (
              <tr key={`${plan.id}-${feature.code}`}>
                <td>{plan.name}</td>
                <td className="code">{feature.code}</td>
                <td className="code">{feature.key || '-'}</td>
                <td>{feature.name}</td>
                <td>{feature.included ? 'Yes' : 'No'}</td>
                <td>{feature.order}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </main>
  );
}

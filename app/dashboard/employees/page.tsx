import { requireCapabilityPage } from '@/lib/dashboard-auth';

export default async function EmployeesPage() {
  await requireCapabilityPage('employee_profiles');

  return (
    <div className="admin-card">
      <h2 style={{ marginTop: 0 }}>Employee Profiles</h2>
      <p>This page is unlocked by capability key: employee_profiles</p>
    </div>
  );
}

import { redirect } from 'next/navigation';

export default function ReportsPage() {
  // The main reports list is on the dashboard.
  // This page can be used for more advanced filtering in the future,
  // but for now, it redirects to the dashboard.
  redirect('/dashboard');
}

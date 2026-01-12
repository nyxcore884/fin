'use server';

import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  // All data fetching is now handled on the client-side in DashboardClient
  // to resolve server-side authentication issues.
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl">Dashboard</h1>
          <p className="text-muted-foreground">
            A high-level overview of your latest financial report.
          </p>
        </div>
      </div>
      
      <DashboardClient />

    </div>
  );
}

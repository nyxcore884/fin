import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  // In a real app, you would fetch initial data here from Firestore
  // and pass it down to the client component.

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, here's your financial overview.</p>
      </div>
      <DashboardClient />
    </div>
  );
}

"use client";

import { MOCK_STATS, MOCK_REPORTS, MOCK_ANOMALIES } from "@/lib/data";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { CostByHolderChart } from "@/components/dashboard/cost-by-holder-chart";
import { ReportsTable } from "@/components/dashboard/reports-table";
import { AnomaliesList } from "@/components/dashboard/anomalies-list";

export function DashboardClient() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Stat Cards */}
      {MOCK_STATS.map((stat) => (
        <div key={stat.name} className="lg:col-span-3">
          <StatCard {...stat} />
        </div>
      ))}

      {/* Charts */}
      <div className="lg:col-span-7">
        <CostByHolderChart />
      </div>
      <div className="lg:col-span-5">
        <RevenueChart />
      </div>

      {/* Anomalies List */}
      <div className="lg:col-span-5">
        <AnomaliesList anomalies={MOCK_ANOMALIES} />
      </div>

      {/* Reports Table */}
      <div className="lg:col-span-7">
        <ReportsTable reports={MOCK_REPORTS} />
      </div>
    </div>
  );
}

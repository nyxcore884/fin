"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { MOCK_REVENUE_DATA, MOCK_REVENUE_CHART_CONFIG } from "@/lib/data"

export function RevenueChart() {
  return (
    <Card className="h-full bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline">Revenue Breakdown</CardTitle>
        <CardDescription>Retail vs. Wholesale</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={MOCK_REVENUE_CHART_CONFIG}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={MOCK_REVENUE_DATA}
              dataKey="amount"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}
              stroke="hsl(var(--background))"
            >
               {MOCK_REVENUE_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
             <ChartLegend
              content={<ChartLegendContent nameKey="type" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

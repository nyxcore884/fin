import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

type StatCardProps = {
  name: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
};

export function StatCard({ name, value, change, changeType }: StatCardProps) {
  return (
    <Card className="h-full bg-card/80 backdrop-blur-sm transition-all hover:border-primary/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-headline">{value}</div>
        {change && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <span
              className={cn('flex items-center', {
                'text-green-400': changeType === 'positive',
                'text-red-400': changeType === 'negative',
              })}
            >
              {changeType === 'positive' && <ArrowUp className="h-4 w-4" />}
              {changeType === 'negative' && <ArrowDown className="h-4 w-4" />}
              {change}
            </span>
            vs last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}

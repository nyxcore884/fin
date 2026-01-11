import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnomalySuggestionDialog } from "./anomaly-suggestion-dialog";

type AnomaliesListProps = {
  anomalies: {
    id: string;
    metric: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    date: string;
  }[];
};

export function AnomaliesList({ anomalies }: AnomaliesListProps) {
  return (
    <Card className="h-full bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <AlertTriangle className="text-destructive" />
          <span>Anomaly Detection</span>
        </CardTitle>
        <CardDescription>AI-powered insights into your data.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {anomalies.map((anomaly) => (
            <div key={anomaly.id} className="flex items-start gap-4 rounded-lg border border-transparent p-2 transition-colors hover:bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{anomaly.metric}</h4>
                  <Badge
                    variant="destructive"
                    className={cn({
                      'bg-destructive/80': anomaly.severity === 'high',
                      'bg-yellow-500/80 text-black': anomaly.severity === 'medium',
                      'bg-blue-500/80': anomaly.severity === 'low',
                    })}
                  >
                    {anomaly.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{anomaly.description}</p>
              </div>
               <AnomalySuggestionDialog anomaly={anomaly} />
            </div>
          ))}
           {anomalies.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Sparkles className="mx-auto h-8 w-8 mb-2"/>
              <p>No anomalies detected. Everything looks normal!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

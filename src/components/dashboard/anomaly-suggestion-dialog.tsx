"use client"

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader, Zap } from 'lucide-react';
import { MOCK_SUGGESTIONS } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

type Anomaly = {
    id: string;
    metric: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    date: string;
}

type AnomalySuggestionDialogProps = {
  anomaly: Anomaly;
};

export function AnomalySuggestionDialog({ anomaly }: AnomalySuggestionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof MOCK_SUGGESTIONS | null>(null);

  async function handleGetSuggestions() {
    setIsLoading(true);
    // In a real app, this would be a server action calling the GenAI flow
    // e.g., await provideAnomalySuggestions({ anomalyDescription: anomaly.description, ... })
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setSuggestions(MOCK_SUGGESTIONS);
    setIsLoading(false);
  }

  function onOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setSuggestions(null);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" onClick={handleGetSuggestions}>
          <Zap className="mr-2 h-4 w-4 text-accent" />
          AI Insight
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2 text-2xl">
             <Lightbulb className="text-accent"/>
            AI Analysis: {anomaly.metric}
          </DialogTitle>
          <DialogDescription>
            {anomaly.description}
          </DialogDescription>
        </DialogHeader>
        {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
                <Loader className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating insights...</p>
            </div>
        )}
        {suggestions && !isLoading && (
            <div className="grid gap-6 py-4 text-sm">
                <div>
                    <h3 className="font-semibold text-lg mb-2">Potential Reasons</h3>
                    <p className="text-muted-foreground">{suggestions.reasons}</p>
                </div>
                <Separator />
                 <div>
                    <h3 className="font-semibold text-lg mb-2">Suggestions</h3>
                    <p className="text-muted-foreground">{suggestions.suggestions}</p>
                </div>
                 <Separator />
                 <div>
                    <h3 className="font-semibold text-lg mb-2">Recommended Actions</h3>
                    <p className="text-muted-foreground">{suggestions.actions}</p>
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

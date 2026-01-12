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
import { Separator } from '@/components/ui/separator';
import { provideAnomalySuggestions } from '@/ai/flows/provide-anomaly-suggestions';
import { useToast } from '@/hooks/use-toast';

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

type Suggestions = {
  reasons: string;
  suggestions: string;
  actions: string;
}

export function AnomalySuggestionDialog({ anomaly }: AnomalySuggestionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const { toast } = useToast();

  async function handleGetSuggestions() {
    if (suggestions) return; // Don't re-fetch if already loaded

    setIsLoading(true);
    try {
      // In a real app, this would be a server action calling the GenAI flow
      const result = await provideAnomalySuggestions({
        // The user ID is handled securely on the backend by the flow
        userId: 'anonymous_user', // Placeholder, not used by this specific flow logic
        message: `Provide potential reasons, suggestions, and recommended actions for this financial anomaly: "${anomaly.description}"`
      });
      
      // We need to parse the response to fit our UI structure.
      // This is a simplification. A more robust solution would be a structured output from the LLM.
      const responseText = result.response;
      const reasonsMatch = responseText.match(/reasons:(.*?)suggestions:/is);
      const suggestionsMatch = responseText.match(/suggestions:(.*?)actions:/is);
      const actionsMatch = responseText.match(/actions:(.*)/is);

      setSuggestions({
          reasons: reasonsMatch ? reasonsMatch[1].trim() : "No potential reasons provided.",
          suggestions: suggestionsMatch ? suggestionsMatch[1].trim() : "No suggestions provided.",
          actions: actionsMatch ? actionsMatch[1].trim() : "No recommended actions provided.",
      });

    } catch(error) {
       toast({
        variant: 'destructive',
        title: 'AI Insight Failed',
        description: 'Could not generate AI-powered insights for this anomaly.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function onOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      // Reset state when closing, but after a delay to allow for animation
      setTimeout(() => {
        setSuggestions(null);
        setIsLoading(false);
      }, 300);
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
            <div className="grid gap-6 py-4 text-sm max-h-[60vh] overflow-y-auto">
                <div>
                    <h3 className="font-semibold text-lg mb-2">Potential Reasons</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{suggestions.reasons}</p>
                </div>
                <Separator />
                 <div>
                    <h3 className="font-semibold text-lg mb-2">Suggestions</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{suggestions.suggestions}</p>
                </div>
                 <Separator />
                 <div>
                    <h3 className="font-semibold text-lg mb-2">Recommended Actions</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{suggestions.actions}</p>
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

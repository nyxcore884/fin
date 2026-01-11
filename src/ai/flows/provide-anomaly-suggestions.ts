'use server';

/**
 * @fileOverview Provides AI-driven suggestions for detected anomalies.
 *
 * - provideAnomalySuggestions - A function that provides anomaly suggestions.
 * - ProvideAnomalySuggestionsInput - The input type for the provideAnomalySuggestions function.
 * - ProvideAnomalySuggestionsOutput - The return type for the provideAnomalySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideAnomalySuggestionsInputSchema = z.object({
  anomalyDescription: z
    .string()
    .describe('Description of the detected anomaly.'),
  financialDataSummary: z
    .string()
    .describe('Summary of the relevant financial data.'),
  context: z.string().optional().describe('Additional context about the anomaly.'),
});
export type ProvideAnomalySuggestionsInput = z.infer<
  typeof ProvideAnomalySuggestionsInputSchema
>;

const ProvideAnomalySuggestionsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('AI-driven suggestions for understanding and addressing the anomaly.'),
  reasons: z
    .string()
    .describe('Potential reasons for the detected anomaly.'),
  actions: z.string().describe('Possible actions to address the anomaly.'),
});
export type ProvideAnomalySuggestionsOutput = z.infer<
  typeof ProvideAnomalySuggestionsOutputSchema
>;

export async function provideAnomalySuggestions(
  input: ProvideAnomalySuggestionsInput
): Promise<ProvideAnomalySuggestionsOutput> {
  return provideAnomalySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideAnomalySuggestionsPrompt',
  input: {schema: ProvideAnomalySuggestionsInputSchema},
  output: {schema: ProvideAnomalySuggestionsOutputSchema},
  prompt: `You are an AI assistant specialized in providing insights and suggestions for financial anomalies.

  Based on the description of the anomaly, the summary of financial data, and any additional context, provide the following:

  1.  Suggestions: AI-driven suggestions for understanding and addressing the issue.
  2.  Reasons: Potential reasons that could have led to the anomaly.
  3.  Actions: Possible actions to take in order to address the anomaly.

  Anomaly Description: {{{anomalyDescription}}}
  Financial Data Summary: {{{financialDataSummary}}}
  Context: {{{context}}}
  `,
});

const provideAnomalySuggestionsFlow = ai.defineFlow(
  {
    name: 'provideAnomalySuggestionsFlow',
    inputSchema: ProvideAnomalySuggestionsInputSchema,
    outputSchema: ProvideAnomalySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

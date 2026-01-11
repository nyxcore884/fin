'use server';

/**
 * @fileOverview This file defines a Genkit flow for detecting anomalies in income statement data.
 *
 * It uses external financial data to assess the data and detect anomalies.
 * It includes the DetectAnomaliesInput, DetectAnomaliesOutput types and the detectAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAnomaliesInputSchema = z.object({
  incomeStatementData: z.string().describe('Income statement data in JSON format.'),
});

export type DetectAnomaliesInput = z.infer<typeof DetectAnomaliesInputSchema>;

const AnomalySchema = z.object({
  metric: z.string().describe('The name of the financial metric with the anomaly.'),
  description: z.string().describe('A description of the anomaly.'),
  severity: z.enum(['high', 'medium', 'low']).describe('The severity of the anomaly.'),
});

const DetectAnomaliesOutputSchema = z.object({
  anomalies: z.array(AnomalySchema).describe('An array of detected anomalies.'),
});

export type DetectAnomaliesOutput = z.infer<typeof DetectAnomaliesOutputSchema>;

export async function detectAnomalies(input: DetectAnomaliesInput): Promise<DetectAnomaliesOutput> {
  return detectAnomaliesFlow(input);
}

const getFinancialBenchmark = ai.defineTool({
  name: 'getFinancialBenchmark',
  description: 'Returns the benchmark data for a given financial metric using Polygon API.',
  inputSchema: z.object({
    metric: z.string().describe('The financial metric to get the benchmark for.'),
    ticker: z.string().describe('The ticker symbol of the company.'),
  }),
  outputSchema: z.number().describe('The benchmark value for the financial metric.'),
}, async (input) => {
  // TODO: Implement the actual call to Polygon API here, handling API keys via Cloud Secrets Manager.
  // Placeholder return value for now.
  console.log('Getting financial benchmark for metric:', input.metric, 'and ticker:', input.ticker);
  return 1.0; // Replace with actual benchmark data.
});

const detectAnomaliesPrompt = ai.definePrompt({
  name: 'detectAnomaliesPrompt',
  tools: [getFinancialBenchmark],
  input: {schema: DetectAnomaliesInputSchema},
  output: {schema: DetectAnomaliesOutputSchema},
  prompt: `You are an expert financial analyst. Your task is to analyze the provided income statement data and identify any anomalies (e.g., high variances in costs) by comparing it to external financial data.

  Use the getFinancialBenchmark tool to get the current benchmark for financial metrics.

  Income Statement Data: {{{incomeStatementData}}}

  Output the detected anomalies in the following JSON format:
  {
    "anomalies": [
      {
        "metric": "",
        "description": "",
        "severity": "high" | "medium" | "low"
      }
    ]
  }`,
});

const detectAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectAnomaliesFlow',
    inputSchema: DetectAnomaliesInputSchema,
    outputSchema: DetectAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await detectAnomaliesPrompt(input);
    return output!;
  }
);

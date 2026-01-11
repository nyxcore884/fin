import { ai } from '@/ai/genkit';
import { classifyRevenue } from '../flows/classify-revenue';
import { detectAnomalies } from '../flows/detect-anomalies';

export interface AIAnalysis {
  retailRevenue: number;
  wholesaleRevenue: number;
  anomalies: any[]; // Array of anomaly objects from the flow
}

export const analyzeWithAI = async (data: any): Promise<AIAnalysis> => {
  let retailRevenue = 0;
  let wholesaleRevenue = 0;
  
  // 1. Classify Revenue
  // In a real scenario, you'd provide better keywords or a more robust system.
  const keywordsRetail = 'Online, POS, Direct Sale';
  const keywordsWholesale = 'Bulk, Distributor, Reseller';

  for (const entry of data.rawDataForAI) {
      // Basic logic to identify revenue entries (e.g., positive amount, not in cost map)
      const amount = parseFloat(entry.Amount_Reporting_Curr || '0');
      if (amount > 0) { 
        try {
            const classificationResult = await classifyRevenue({
                revenueEntry: entry['Text'] || JSON.stringify(entry),
                keywordsRetail,
                keywordsWholesale,
            });

            if (classificationResult.classification === 'retail') {
                retailRevenue += amount;
            } else {
                wholesaleRevenue += amount;
            }
        } catch (e) {
            console.error("Revenue classification failed for an entry, adding to retail by default.", e);
            retailRevenue += amount;
        }
      }
  }

  // 2. Detect Anomalies
  let anomalies: any[] = [];
  try {
      const anomalyResult = await detectAnomalies({
          incomeStatementData: JSON.stringify({
              totalCosts: data.totalCosts,
              costsByHolder: data.costsByHolder,
              costsByRegion: data.costsByRegion,
              transactionCount: data.transactionCount,
              retailRevenue: retailRevenue,
              wholesaleRevenue: wholesaleRevenue
          })
      });
      anomalies = anomalyResult.anomalies;
  } catch(e) {
      console.error("Anomaly detection failed.", e);
      anomalies = [{ metric: 'AI System', description: 'Anomaly detection failed to run.', severity: 'high' }];
  }


  return {
    retailRevenue,
    wholesaleRevenue,
    anomalies
  };
};

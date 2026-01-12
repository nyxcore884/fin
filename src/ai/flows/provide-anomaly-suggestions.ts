'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing suggestions and analysis for detected anomalies.
 *
 * It uses a user's financial data from Firestore to provide context-aware responses.
 * It includes the AnomalySuggestionInput, AnomalySuggestionOutput types and the provideAnomalySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
    try {
      admin.initializeApp();
    } catch (e) {
      console.error('Firebase admin initialization error', e);
    }
}

const AnomalySuggestionInputSchema = z.object({
  message: z.string().describe("The user's query about their financial data, or a specific anomaly description."),
  userId: z.string().describe("The authenticated user's ID."),
  sessionId: z.string().optional().describe('The specific session ID to query data from.'),
});
export type AnomalySuggestionInput = z.infer<typeof AnomalySuggestionInputSchema>;

const AnomalySuggestionOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user\'s query.'),
});
export type AnomalySuggestionOutput = z.infer<typeof AnomalySuggestionOutputSchema>;


export async function provideAnomalySuggestions(input: AnomalySuggestionInput): Promise<AnomalySuggestionOutput> {
  return provideAnomalySuggestionsFlow(input);
}


const provideAnomalySuggestionsFlow = ai.defineFlow(
  {
    name: 'provideAnomalySuggestionsFlow',
    inputSchema: AnomalySuggestionInputSchema,
    outputSchema: AnomalySuggestionOutputSchema,
  },
  async ({ message, userId, sessionId }) => {
    let userData = '';
    
    try {
      if (sessionId) {
        // Get specific session data
        const resultDoc = await admin.firestore()
          .collection("budget_results")
          .where("sessionId", "==", sessionId)
          .where("userId", "==", userId)
          .limit(1)
          .get();
        
        if (!resultDoc.empty) {
          const resultData = resultDoc.docs[0].data();
           userData = JSON.stringify({
            totalCosts: resultData.verifiedMetrics?.totalCosts,
            retailRevenue: resultData.verifiedMetrics?.retailRevenue,
            wholesaleRevenue: resultData.verifiedMetrics?.wholesaleRevenue,
            costsByHolder: resultData.verifiedMetrics?.costsByHolder,
            costsByRegion: resultData.verifiedMetrics?.costsByRegion,
            anomalies: resultData.aiAnalysis?.anomalies,
            insights: resultData.aiAnalysis?.insights
          }, null, 2);
        }
      } else {
        // Get all user data (last 5 reports)
        const userDocs = await admin.firestore()
          .collection("budget_results")
          .where("userId", "==", userId)
          .orderBy("timestamp", "desc")
          .limit(5)
          .get();
        
        const sessions = userDocs.docs.map(doc => {
            const data = doc.data();
            return {
                sessionId: data.sessionId,
                timestamp: data.timestamp.toDate(),
                totalCosts: data.verifiedMetrics?.totalCosts,
                retailRevenue: data.verifiedMetrics?.retailRevenue,
                wholesaleRevenue: data.verifiedMetrics?.wholesaleRevenue,
            }
        });
        if (sessions.length > 0) {
            userData = JSON.stringify(sessions, null, 2);
        }
      }
    } catch (error) {
        console.error("Firestore query failed:", error);
        userData = "Could not retrieve financial data from the database.";
    }

    const prompt = `
      You are a senior financial analyst AI assistant for a gas distribution company.
      The user is asking for more information about a financial issue or anomaly.
      The user's query is: "${message}"

      Here is the user's financial data context for the relevant reporting period (if available):
      ${userData || "No financial data available for this user."}

      Please provide a comprehensive, helpful response. Your response should be structured in three parts:
      1.  **Potential Reasons:** Based on the data and the user's query, list the most likely underlying causes for this issue.
      2.  **Suggestions:** Offer concrete suggestions for what the user should investigate further.
      3.  **Recommended Actions:** Propose specific, actionable steps the user or their team can take to address, mitigate, or resolve the issue.

      - Be precise and data-driven, referencing specific numbers from their data when relevant.
      - Explain complex financial concepts in simple terms.
      - Format your response clearly with markdown, using bold headings for each of the three sections.
    `;

    const result = await ai.generate({ prompt });
    
    return {
      response: result.text,
    };
  }
);

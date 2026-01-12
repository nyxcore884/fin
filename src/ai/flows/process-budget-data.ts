'use server';

import * as admin from 'firebase-admin';
import { processUploadedFiles } from '../processors/dataProcessor';
import { analyzeWithAI } from '../processors/aiProcessor';
import { verifyFirebaseConfig } from '../processors/verifyConfig';

try {
  verifyFirebaseConfig();
  console.log('✅ Configuration verified successfully');
} catch (error: any) {
  console.error('❌ Configuration error:', error.message);
}


if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * Initiates a backup process for a given session.
 * In a real-world scenario, this would also trigger a Cloud Storage transfer.
 */
export const initiateBackup = async (sessionId: string, userId: string) => {
  const backupData = {
    sessionId,
    userId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    status: 'completed', // In a real scenario, this might be 'pending' then updated.
    storagePath: `gs://${process.env.GCLOUD_STORAGE_BUCKET}/backups/${sessionId}`
  };

  // Store backup metadata in Firestore
  await admin.firestore().collection('backups').add(backupData);
  
  console.log(`Backup metadata logged for session ${sessionId}`);
};

/**
 * This is the main data processing flow, now triggered by a direct API call.
 * It fetches the session data, processes files, runs AI analysis, and saves the results.
 * @param sessionId The ID of the upload_sessions document to process.
 */
export const processBudgetData = async (sessionId: string) => {
    if (!sessionId) {
        console.log('No session ID provided.');
        throw new Error('Session ID is required for processing.');
    }

    const sessionRef = admin.firestore().collection('upload_sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
        console.error(`Session ${sessionId} not found.`);
        throw new Error(`Session ${sessionId} not found.`);
    }

    const sessionData = sessionDoc.data();

    // Check if the session is in the correct state to be processed.
    if (sessionData?.status !== 'ready_for_processing') {
        console.log(`Session ${sessionId} is not ready for processing. Current status: ${sessionData?.status}`);
        return; // Or throw an error if this is unexpected
    }

    const { userId, files } = sessionData;
    console.log(`Processing session ${sessionId} for user ${userId}`);

    try {
        await sessionRef.update({
            status: 'processing',
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const processedData = await processUploadedFiles(
            userId,
            sessionId,
            files
        );
        
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            throw new Error("GEMINI_API_KEY environment variable not set for function.");
        }
        const aiResult = await analyzeWithAI(processedData, geminiApiKey);

        const resultsRef = admin.firestore().collection('budget_results').doc();
        
        await resultsRef.set({
            userId,
            sessionId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            verifiedMetrics: {
                ...processedData,
                retailRevenue: aiResult.revenueClassification.retail,
                wholesaleRevenue: aiResult.revenueClassification.wholesale,
            },
            aiAnalysis: {
                anomalies: aiResult.anomalies,
                insights: aiResult.insights,
                recommendations: aiResult.recommendations,
            },
            processingTime: new Date().toISOString(),
            fileTypes: Object.keys(files || {})
        });
        
        await sessionRef.update({
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            resultId: resultsRef.id,
        });

        await initiateBackup(sessionId, userId);

        console.log(
            `Successfully processed session ${sessionId} for user ${userId}`
        );
    } catch (error: any) {
        console.error('Processing failed:', error);
        await sessionRef.update({
            status: 'error',
            errorMessage: error.message,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Re-throw the error so the API route can report the failure.
        throw error;
    }
}

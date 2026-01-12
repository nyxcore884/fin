import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

export async function POST(request: NextRequest) {
  try {
    // In a real scenario, this would trigger your Cloud Function.
    // For this test, we are just returning a mock success response
    // to confirm the API endpoint is reachable.
    return NextResponse.json({
      success: true,
      message: 'Test initiated. The backend Cloud Function should now be processing the data. Check the function logs for progress.',
      mockDataSent: {
        userId: (await request.json()).userId,
        sessionId: 'test-session-from-api',
      },
      expectedResults: {
        totalCosts: 6000,
        retailRevenue: 0,
        wholesaleRevenue: 0,
        anomalies: ['AI-generated anomaly'],
        insights: ['AI-generated insight']
      }
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

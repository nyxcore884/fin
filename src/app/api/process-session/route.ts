import { NextRequest, NextResponse } from 'next/server';
import { processBudgetData } from '@/ai/flows/process-budget-data';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required.' },
        { status: 400 }
      );
    }

    // Do not await this. We want to send the response back to the client immediately
    // and let the processing run in the background.
    processBudgetData(sessionId).catch(error => {
        // Log any unhandled errors during background processing
        console.error(`[Background Processing Error] for session ${sessionId}:`, error);
    });

    return NextResponse.json({
      success: true,
      message: `Processing initiated for session ${sessionId}.`,
    });

  } catch (error: any) {
    console.error("API Error in /api/process-session:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

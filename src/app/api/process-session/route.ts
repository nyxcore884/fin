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
    
    // Asynchronously start the processing, but don't wait for it to finish.
    // The client will get an immediate response.
    processBudgetData(sessionId).catch(error => {
        // This will log any unhandled errors during the background processing
        // to the Next.js server logs.
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

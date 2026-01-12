import { NextRequest, NextResponse } from 'next/server';

// This function now calls the Python backend HTTP endpoint directly.
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required.' },
        { status: 400 }
      );
    }
    
    const region = process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_REGION || 'us-central1';
    const projectId = process.env.GCP_PROJECT;

    if (!projectId) {
      throw new Error('GCP_PROJECT environment variable is not set.');
    }

    // The URL of the deployed Python HTTP function.
    const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/process_financial_data_http`;

    // "Fire-and-forget" fetch request. We don't await the response here
    // because the Python function is a long-running process. The client
    // will get an immediate response, and the function will run in the background.
    fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: If your Cloud Function is configured to require authentication,
        // you would add an 'Authorization: Bearer <ID_TOKEN>' header here.
        // For now, it's assumed to be publicly invokable.
      },
      body: JSON.stringify({ sessionId }),
    }).catch(error => {
        // We log the error but don't re-throw it to the client,
        // as the main purpose is just to trigger the function.
        console.error(`[API Route] Error triggering Python function for session ${sessionId}:`, error);
    });

    return NextResponse.json({
      success: true,
      message: `Processing initiated via Python backend for session ${sessionId}.`,
    });

  } catch (error: any) {
    console.error("API Error in /api/process-session:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// This file is illustrative. In a real app, you would use Genkit flows.
// We are simulating a direct API call for simplicity.

'use server';

import { ai } from '@/ai/genkit';

export async function sendMessageToGemini(message: string): Promise<string> {
  try {
    const { text } = await ai.generate({
      prompt: message,
    });
    return text;
  } catch (error) {
    console.error('Error calling Gemini API via Genkit:', error);
    throw new Error('Failed to get response from AI');
  }
}

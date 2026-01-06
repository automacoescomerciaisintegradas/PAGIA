import { runAI } from '../ai/runner.js';

export async function runGemini(prompt: string): Promise<string> {
    // Legacy wrapper that defaults to configured provider or Gemini
    return runAI(prompt);
}

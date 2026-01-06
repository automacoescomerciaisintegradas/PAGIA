import 'dotenv/config';
import { generateGemini } from './providers/gemini.js';
import { generateZhipu } from './providers/zhipu.js';

export async function runAI(prompt: string, options: { provider?: string, model?: string } = {}): Promise<string> {
    const provider = options.provider || process.env.AI_PROVIDER || 'gemini';

    if (provider === 'zhipu' || provider === 'glm') {
        const apiKey = process.env.ZAIA_GLM_4_PLUS_API_KEY;
        const model = options.model || process.env.GLM_MODEL || 'GLM-4-Plus';

        if (!apiKey) throw new Error("ZAIA_GLM_4_PLUS_API_KEY not set");
        return generateZhipu(prompt, apiKey, model);
    }

    // Default to Gemini
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const model = options.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    return generateGemini(prompt, apiKey, model);
}

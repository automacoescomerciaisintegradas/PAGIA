import express from 'express';
import { runAI } from '../../ai/runner.js';

const router = express.Router();

router.post('/chat/completions', async (req, res) => {
    try {
        const { messages, model, temperature } = req.body;

        // Authorization check
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: { message: "Unauthorized", code: 401 } });
            return;
        }

        // Convert OpenAI messages format to string prompt for underlying LLM
        // Simple conversion: Concatenate role and content
        let prompt = "";
        if (Array.isArray(messages)) {
            prompt = messages.map((m: any) => `${m.role}: ${m.content}`).join('\n');
        } else {
            res.status(400).json({ error: { message: "Invalid messages format", code: 400 } });
            return;
        }

        // Determine provider based on model name
        // Heuristic: if model name contains 'glm', assume Zhipu
        let provider = process.env.AI_PROVIDER; // Default
        if (model && (model.toLowerCase().includes('glm') || model.toLowerCase().includes('zhipu'))) {
            provider = 'glm';
        }

        const responseText = await runAI(prompt, { model, provider });

        const completionId = `chatcmpl-${Date.now()}`;

        res.json({
            id: completionId,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: model || "gemini-adapter",
            choices: [
                {
                    index: 0,
                    message: {
                        role: "assistant",
                        content: responseText
                    },
                    finish_reason: "stop"
                }
            ],
            usage: {
                prompt_tokens: -1, // Not calculated
                completion_tokens: -1,
                total_tokens: -1
            }
        });

    } catch (error: any) {
        console.error("API Error:", error);
        res.status(500).json({ error: { message: error.message || "Internal Server Error", code: 500 } });
    }
});

export default router;

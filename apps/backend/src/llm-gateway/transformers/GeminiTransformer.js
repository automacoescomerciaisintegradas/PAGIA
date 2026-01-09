import { BaseTransformer } from './BaseTransformer.js';
import { v4 as uuidv4 } from 'uuid';
export class GeminiTransformer extends BaseTransformer {
    providerName = 'gemini';
    defaultEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
    // Note: Endpoint usually requires appending :generateContent or streamGenerateContent
    transformRequestOut(request) {
        const contents = request.messages
            .filter(m => m.role !== 'system') // Gemini puts system instructions in generationConfig usually or separate field
            .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user', // Gemini uses 'model' instead of 'assistant'
            parts: [{ text: m.content }]
        }));
        const systemMessage = request.messages.find(m => m.role === 'system');
        const body = {
            contents,
            generationConfig: {
                temperature: request.temperature,
                topP: request.top_p,
                maxOutputTokens: request.max_tokens,
            }
        };
        if (systemMessage) {
            body.systemInstruction = {
                parts: [{ text: systemMessage.content }]
            };
        }
        return body;
    }
    transformResponseIn(response) {
        const candidate = response.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text || '';
        return {
            id: uuidv4(),
            model: 'gemini', // Response doesn't always contain model name
            created: Date.now(),
            choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: text
                    },
                    finish_reason: candidate?.finishReason || 'STOP'
                }],
            usage: {
                prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
                completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
                total_tokens: response.usageMetadata?.totalTokenCount || 0
            }
        };
    }
    transformRequestIn(request) {
        // Gemini request to Unified
        const messages = (request.contents || []).map((c) => ({
            role: c.role === 'model' ? 'assistant' : 'user',
            content: c.parts?.[0]?.text || ''
        }));
        if (request.systemInstruction) {
            messages.unshift({
                role: 'system',
                content: request.systemInstruction.parts?.[0]?.text || ''
            });
        }
        return {
            messages,
            model: 'gemini-pro', // Default guess
            provider: 'gemini',
            temperature: request.generationConfig?.temperature,
            max_tokens: request.generationConfig?.maxOutputTokens,
        };
    }
    transformResponseOut(response) {
        return {
            candidates: [{
                    content: {
                        role: 'model',
                        parts: [{ text: response.choices[0].message.content }]
                    },
                    finishReason: response.choices[0].finish_reason,
                    index: 0
                }]
        };
    }
    transformStreamChunk(chunk) {
        // chunk is usually the whole response object for that chunk in Gemini REST
        const candidate = chunk.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text || '';
        if (!text && !candidate?.finishReason)
            return null;
        return {
            id: uuidv4(),
            model: 'gemini',
            choices: [{
                    index: 0,
                    delta: { content: text },
                    finish_reason: candidate?.finishReason || null
                }]
        };
    }
}
//# sourceMappingURL=GeminiTransformer.js.map
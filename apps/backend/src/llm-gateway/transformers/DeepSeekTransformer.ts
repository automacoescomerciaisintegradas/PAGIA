
import { BaseTransformer } from './BaseTransformer.js';
import { UnifiedChatRequest, UnifiedChatResponse, UnifiedChunk, UnifiedMessage } from '../types.js';

export class DeepSeekTransformer extends BaseTransformer {
    readonly providerName = 'deepseek';
    readonly defaultEndpoint = 'https://api.deepseek.com/chat/completions';

    transformRequestOut(request: UnifiedChatRequest): any {
        // DeepSeek is OpenAI compatible
        return {
            model: request.model,
            messages: request.messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            stream: request.stream,
            temperature: request.temperature,
            max_tokens: request.max_tokens,
            top_p: request.top_p
        };
    }

    transformResponseIn(response: any): UnifiedChatResponse {
        return {
            id: response.id,
            model: response.model,
            created: response.created,
            choices: response.choices.map((c: any) => ({
                index: c.index,
                message: {
                    role: c.message.role,
                    content: c.message.content // DeepSeek might have reasoning_content here too
                },
                finish_reason: c.finish_reason
            })),
            usage: response.usage
        };
    }

    transformRequestIn(request: any): UnifiedChatRequest {
        return {
            messages: request.messages,
            model: request.model,
            stream: request.stream,
            provider: 'deepseek',
            temperature: request.temperature,
            max_tokens: request.max_tokens
        };
    }

    transformResponseOut(response: UnifiedChatResponse): any {
        return response; // Pass through mostly
    }

    transformStreamChunk(chunk: any): UnifiedChunk | null {
        // DeepSeek stream is OpenAI compatible
        // But we might want to handle reasoning_content if present in delta

        const choice = chunk.choices?.[0];
        if (!choice) return null;

        const delta = choice.delta || {};
        // If there is reasoning content, we might want to expose it or merge it. 
        // For unified standard chat, usually we merge or append, but let's keep it simple.

        return {
            id: chunk.id,
            model: chunk.model,
            choices: [{
                index: choice.index,
                delta: {
                    role: delta.role,
                    content: delta.content || delta.reasoning_content || '' // fallback to reasoning if content empty?
                },
                finish_reason: choice.finish_reason
            }]
        };
    }
}

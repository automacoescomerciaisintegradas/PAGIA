
import { BaseTransformer } from './BaseTransformer.js';
import { UnifiedChatRequest, UnifiedChatResponse, UnifiedChunk } from '../types.js';

export class LocalTransformer extends BaseTransformer {
    readonly providerName = 'local';
    // Default to localhost, but this often overridden
    readonly defaultEndpoint = 'http://127.0.0.1:8080/v1/chat/completions';

    transformRequestOut(request: UnifiedChatRequest): any {
        return {
            model: request.model, // Local server usually ignores this or uses loaded model
            messages: request.messages,
            stream: request.stream,
            temperature: request.temperature,
            max_tokens: request.max_tokens,
            top_p: request.top_p
        };
    }

    transformResponseIn(response: any): UnifiedChatResponse {
        // Standard OpenAI format from llama-server
        return {
            id: response.id,
            model: response.model,
            created: response.created,
            choices: response.choices.map((c: any) => ({
                index: c.index,
                message: {
                    role: c.message.role,
                    content: c.message.content
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
            provider: 'local',
            temperature: request.temperature
        };
    }

    transformResponseOut(response: UnifiedChatResponse): any {
        return response;
    }

    transformStreamChunk(chunk: any): UnifiedChunk | null {
        if (!chunk.choices?.[0]) return null;
        return {
            id: chunk.id,
            model: chunk.model,
            choices: [{
                index: chunk.choices[0].index,
                delta: chunk.choices[0].delta,
                finish_reason: chunk.choices[0].finish_reason
            }]
        };
    }
}

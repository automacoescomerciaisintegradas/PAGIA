import { BaseTransformer } from './BaseTransformer.js';
export class LocalTransformer extends BaseTransformer {
    providerName = 'local';
    // Default to localhost, but this often overridden
    defaultEndpoint = 'http://127.0.0.1:8080/v1/chat/completions';
    transformRequestOut(request) {
        return {
            model: request.model, // Local server usually ignores this or uses loaded model
            messages: request.messages,
            stream: request.stream,
            temperature: request.temperature,
            max_tokens: request.max_tokens,
            top_p: request.top_p
        };
    }
    transformResponseIn(response) {
        // Standard OpenAI format from llama-server
        return {
            id: response.id,
            model: response.model,
            created: response.created,
            choices: response.choices.map((c) => ({
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
    transformRequestIn(request) {
        return {
            messages: request.messages,
            model: request.model,
            stream: request.stream,
            provider: 'local',
            temperature: request.temperature
        };
    }
    transformResponseOut(response) {
        return response;
    }
    transformStreamChunk(chunk) {
        if (!chunk.choices?.[0])
            return null;
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
//# sourceMappingURL=LocalTransformer.js.map
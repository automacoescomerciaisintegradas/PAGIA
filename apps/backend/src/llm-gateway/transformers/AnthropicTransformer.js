import { BaseTransformer } from './BaseTransformer.js';
import { v4 as uuidv4 } from 'uuid';
export class AnthropicTransformer extends BaseTransformer {
    providerName = 'anthropic';
    defaultEndpoint = 'https://api.anthropic.com/v1/messages';
    transformRequestOut(request) {
        const systemMessage = request.messages.find(m => m.role === 'system');
        const otherMessages = request.messages.filter(m => m.role !== 'system');
        const anthropicBody = {
            model: request.model,
            messages: otherMessages.map(m => ({
                role: m.role,
                content: m.content
            })),
            max_tokens: request.max_tokens ?? 1024,
            stream: request.stream
        };
        if (systemMessage) {
            anthropicBody.system = systemMessage.content;
        }
        if (request.temperature !== undefined)
            anthropicBody.temperature = request.temperature;
        if (request.top_p !== undefined)
            anthropicBody.top_p = request.top_p;
        return anthropicBody;
    }
    transformResponseIn(response) {
        // Anthropic response format
        // { id, type: 'message', role: 'assistant', content: [{ type: 'text', text: '...' }], ... }
        let content = '';
        if (response.content && Array.isArray(response.content)) {
            content = response.content.map((c) => c.text).join('');
        }
        return {
            id: response.id,
            model: response.model,
            created: Date.now(), // Anthropic doesn't send created timestamp usually
            choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: content
                    },
                    finish_reason: response.stop_reason
                }],
            usage: {
                prompt_tokens: response.usage?.input_tokens || 0,
                completion_tokens: response.usage?.output_tokens || 0,
                total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
            }
        };
    }
    transformRequestIn(request) {
        // Assuming request is in strict Anthropic format
        const messages = request.messages.map((m) => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : m.content[0]?.text
        }));
        if (request.system) {
            messages.unshift({ role: 'system', content: request.system });
        }
        return {
            messages,
            model: request.model,
            stream: request.stream,
            provider: 'anthropic',
            max_tokens: request.max_tokens,
            temperature: request.temperature
        };
    }
    transformResponseOut(response) {
        // Convert back to Anthropic format
        return {
            id: response.id,
            type: 'message',
            role: 'assistant',
            content: [{
                    type: 'text',
                    text: response.choices[0].message.content
                }],
            model: response.model,
            stop_reason: response.choices[0].finish_reason,
            usage: {
                input_tokens: response.usage?.prompt_tokens,
                output_tokens: response.usage?.completion_tokens
            }
        };
    }
    transformStreamChunk(chunk) {
        // Anthropic stream events: message_start, content_block_start, content_block_delta, content_block_stop, message_delta, message_stop
        if (chunk.type === 'message_start') {
            return {
                id: chunk.message.id,
                model: chunk.message.model,
                choices: [{
                        index: 0,
                        delta: { role: 'assistant', content: '' },
                        finish_reason: null
                    }]
            };
        }
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
            return {
                id: uuidv4(), // Chunk ID isn't persistent in same way
                model: '',
                choices: [{
                        index: 0,
                        delta: { content: chunk.delta.text },
                        finish_reason: null
                    }]
            };
        }
        if (chunk.type === 'message_delta') {
            if (chunk.delta?.stop_reason) {
                return {
                    id: uuidv4(),
                    model: '',
                    choices: [{
                            index: 0,
                            delta: {},
                            finish_reason: chunk.delta.stop_reason
                        }]
                };
            }
        }
        return null;
    }
}
//# sourceMappingURL=AnthropicTransformer.js.map
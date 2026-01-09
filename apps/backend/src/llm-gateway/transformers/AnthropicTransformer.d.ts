import { BaseTransformer } from './BaseTransformer.js';
import { UnifiedChatRequest, UnifiedChatResponse, UnifiedChunk } from '../types.js';
export declare class AnthropicTransformer extends BaseTransformer {
    readonly providerName = "anthropic";
    readonly defaultEndpoint = "https://api.anthropic.com/v1/messages";
    transformRequestOut(request: UnifiedChatRequest): any;
    transformResponseIn(response: any): UnifiedChatResponse;
    transformRequestIn(request: any): UnifiedChatRequest;
    transformResponseOut(response: UnifiedChatResponse): any;
    transformStreamChunk(chunk: any): UnifiedChunk | null;
}
//# sourceMappingURL=AnthropicTransformer.d.ts.map
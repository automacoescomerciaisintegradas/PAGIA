import { BaseTransformer } from './BaseTransformer.js';
import { UnifiedChatRequest, UnifiedChatResponse, UnifiedChunk } from '../types.js';
export declare class DeepSeekTransformer extends BaseTransformer {
    readonly providerName = "deepseek";
    readonly defaultEndpoint = "https://api.deepseek.com/chat/completions";
    transformRequestOut(request: UnifiedChatRequest): any;
    transformResponseIn(response: any): UnifiedChatResponse;
    transformRequestIn(request: any): UnifiedChatRequest;
    transformResponseOut(response: UnifiedChatResponse): any;
    transformStreamChunk(chunk: any): UnifiedChunk | null;
}
//# sourceMappingURL=DeepSeekTransformer.d.ts.map
import { BaseTransformer } from './BaseTransformer.js';
import { UnifiedChatRequest, UnifiedChatResponse, UnifiedChunk } from '../types.js';
export declare class GeminiTransformer extends BaseTransformer {
    readonly providerName = "gemini";
    readonly defaultEndpoint = "https://generativelanguage.googleapis.com/v1beta/models";
    transformRequestOut(request: UnifiedChatRequest): any;
    transformResponseIn(response: any): UnifiedChatResponse;
    transformRequestIn(request: any): UnifiedChatRequest;
    transformResponseOut(response: UnifiedChatResponse): any;
    transformStreamChunk(chunk: any): UnifiedChunk | null;
}
//# sourceMappingURL=GeminiTransformer.d.ts.map
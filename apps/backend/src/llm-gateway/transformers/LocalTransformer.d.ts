import { BaseTransformer } from './BaseTransformer.js';
import { UnifiedChatRequest, UnifiedChatResponse, UnifiedChunk } from '../types.js';
export declare class LocalTransformer extends BaseTransformer {
    readonly providerName = "local";
    readonly defaultEndpoint = "http://127.0.0.1:8080/v1/chat/completions";
    transformRequestOut(request: UnifiedChatRequest): any;
    transformResponseIn(response: any): UnifiedChatResponse;
    transformRequestIn(request: any): UnifiedChatRequest;
    transformResponseOut(response: UnifiedChatResponse): any;
    transformStreamChunk(chunk: any): UnifiedChunk | null;
}
//# sourceMappingURL=LocalTransformer.d.ts.map
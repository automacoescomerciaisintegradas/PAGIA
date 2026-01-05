
import { UnifiedChatRequest, UnifiedChatResponse, UnifiedChunk } from '../types.js';

export abstract class BaseTransformer {
    abstract readonly providerName: string;
    abstract readonly defaultEndpoint: string;

    /**
     * Converts the unified request to the provider-specific format.
     */
    abstract transformRequestOut(request: UnifiedChatRequest): any;

    /**
     * Converts the provider's response to the unified format.
     */
    abstract transformResponseIn(response: any): UnifiedChatResponse;

    /**
     * Optional: Converts a provider request (if acting as a proxy receiving provider requests) to unified.
     * Useful if we want to mimic a specific provider's API.
     */
    abstract transformRequestIn(request: any): UnifiedChatRequest;

    /**
    * Optional: Converts a unified response to a provider-specific response.
    */
    abstract transformResponseOut(response: UnifiedChatResponse): any;


    /**
     * Handles streaming data chunks.
     * Returns a UnifiedChunk or null if the chunk should be ignored (e.g. keep-alive).
     */
    abstract transformStreamChunk(chunk: any): UnifiedChunk | null;
}

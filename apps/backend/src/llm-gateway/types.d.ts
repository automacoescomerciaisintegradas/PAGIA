export interface UnifiedMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: any[];
    name?: string;
}
export interface UnifiedChatRequest {
    messages: UnifiedMessage[];
    model: string;
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    tools?: any[];
    provider: string;
    provider_options?: Record<string, any>;
}
export interface UnifiedChatResponse {
    id: string;
    model: string;
    created: number;
    choices: {
        index: number;
        message: UnifiedMessage;
        finish_reason: string;
    }[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export interface UnifiedChunk {
    id: string;
    model: string;
    choices: {
        index: number;
        delta: Partial<UnifiedMessage>;
        finish_reason: string | null;
    }[];
}
//# sourceMappingURL=types.d.ts.map
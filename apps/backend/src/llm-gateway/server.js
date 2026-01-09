import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { AnthropicTransformer } from './transformers/AnthropicTransformer.js';
import { GeminiTransformer } from './transformers/GeminiTransformer.js';
import { DeepSeekTransformer } from './transformers/DeepSeekTransformer.js';
import { LocalTransformer } from './transformers/LocalTransformer.js';
export class LLMGatewayServer {
    app;
    transformers;
    constructor() {
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());
        this.transformers = new Map();
        this.registerTransformers();
        this.setupRoutes();
    }
    registerTransformers() {
        this.transformers.set('anthropic', new AnthropicTransformer());
        this.transformers.set('gemini', new GeminiTransformer());
        this.transformers.set('deepseek', new DeepSeekTransformer());
        this.transformers.set('local', new LocalTransformer());
    }
    setupRoutes() {
        this.app.post('/v1/chat/completions', async (req, res) => {
            await this.handleChatCompletion(req, res);
        });
        // DX: Help user if they try to access via browser
        this.app.get('/v1/chat/completions', (req, res) => {
            res.status(405).json({
                error: 'Method Not Allowed',
                message: 'This endpoint only accepts POST requests with a JSON body.',
                example: 'curl -X POST http://localhost:3000/v1/chat/completions -H "Content-Type: application/json" -d \'{"messages": [{"role": "user", "content": "Hello"}]}\''
            });
        });
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', providers: Array.from(this.transformers.keys()) });
        });
    }
    async handleChatCompletion(req, res) {
        try {
            const rawRequest = req.body;
            // Determine provider. Priority: 1. Body 'provider' 2. Derive from model?
            // For now, require 'provider' in body or header 'x-provider'
            const providerName = rawRequest.provider || req.headers['x-provider'] || 'local';
            const transformer = this.transformers.get(providerName);
            if (!transformer) {
                res.status(400).json({ error: `Unknown provider: ${providerName}` });
                return;
            }
            // Create Unified Request
            // If the input is already 'unified' (which we expect for this gateway), we use it directly.
            // But if it's acting as a proxy expecting standard OpenAI format, we might need to assume input is standard or unified.
            // The prompt says "transformRequestIn: Converts the provider's format... to unified". 
            // BUT also "transformRequestOut: Unified -> Provider".
            // So the Gateway receives UNIFIED or provides an endpoint that accepts UNIFIED. 
            // Input: UnifiedChatRequest.
            const unifiedRequest = {
                ...rawRequest,
                provider: providerName
            };
            // Transform request for the destination provider
            const providerRequest = transformer.transformRequestOut(unifiedRequest);
            // Determine endpoint URL
            let url = transformer.defaultEndpoint;
            // Special handling for Local provider custom path
            if (providerName === 'local' && unifiedRequest.provider_options?.baseUrl) {
                url = unifiedRequest.provider_options.baseUrl;
            }
            // Or if user provided explicit endpoint in request
            if (rawRequest.endpoint) {
                url = rawRequest.endpoint;
            }
            // Prepare headers
            const headers = {
                'Content-Type': 'application/json'
            };
            // Allow passing API keys via headers
            if (req.headers['authorization'])
                headers['Authorization'] = req.headers['authorization'];
            if (req.headers['x-api-key'])
                headers['x-api-key'] = req.headers['x-api-key'];
            if (req.headers['x-goog-api-key'])
                headers['x-goog-api-key'] = req.headers['x-goog-api-key']; // Gemini
            // Anthropic requires specific headers
            if (providerName === 'anthropic') {
                headers['x-anthropic-version'] = '2023-06-01';
                if (!headers['x-api-key'] && req.headers['authorization']) {
                    // Sometimes passed as Bearer, Anthropic usually directly x-api-key
                }
            }
            if (unifiedRequest.stream) {
                // Streaming handling
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                const upstreamResponse = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(providerRequest)
                });
                if (!upstreamResponse.ok) {
                    const errorText = await upstreamResponse.text();
                    res.write(`data: ${JSON.stringify({ error: errorText })}\n\n`);
                    res.end();
                    return;
                }
                if (!upstreamResponse.body) {
                    res.end();
                    return;
                }
                // Node-fetch body is a stream
                upstreamResponse.body.on('data', (chunkBuffer) => {
                    const chunkStr = chunkBuffer.toString();
                    // Providers send data like "data: {...}" or raw JSON or multiple lines.
                    // We need to parse this properly. A simple split by "data:" might suffice for SSE.
                    const lines = chunkStr.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed === 'data: [DONE]')
                            continue;
                        // Naive parsing for now, assuming standard SSE format "data: <json>"
                        if (trimmed.startsWith('data: ')) {
                            try {
                                const jsonStr = trimmed.substring(6);
                                const providerChunk = JSON.parse(jsonStr);
                                const unifiedChunk = transformer.transformStreamChunk(providerChunk);
                                if (unifiedChunk) {
                                    res.write(`data: ${JSON.stringify(unifiedChunk)}\n\n`);
                                }
                            }
                            catch (e) {
                                // console.error('Error parsing chunk', e);
                            }
                        }
                        else {
                            // Some providers might just send JSON stream without 'data: ' prefix (e.g. some local setups?)
                            // Attempt direct parse
                            try {
                                const providerChunk = JSON.parse(trimmed);
                                const unifiedChunk = transformer.transformStreamChunk(providerChunk);
                                if (unifiedChunk) {
                                    res.write(`data: ${JSON.stringify(unifiedChunk)}\n\n`);
                                }
                            }
                            catch (e) { }
                        }
                    }
                });
                upstreamResponse.body.on('end', () => {
                    res.write('data: [DONE]\n\n');
                    res.end();
                });
                upstreamResponse.body.on('error', (err) => {
                    console.error('Stream error', err);
                    res.end();
                });
            }
            else {
                // Non-streaming
                const upstreamResponse = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(providerRequest)
                });
                const data = await upstreamResponse.json();
                if (!upstreamResponse.ok) {
                    res.status(upstreamResponse.status).json(data);
                    return;
                }
                const unifiedResponse = transformer.transformResponseIn(data);
                res.json(unifiedResponse);
            }
        }
        catch (error) {
            console.error('Gateway Error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    start(port = 3000) {
        this.app.listen(port, () => {
            console.log(`PAGIA LLM Gateway running on port ${port}`);
            console.log(`Unified Endpoint: http://localhost:${port}/v1/chat/completions`);
            console.log(`Supported Providers: ${Array.from(this.transformers.keys()).join(', ')}`);
        });
    }
}
//# sourceMappingURL=server.js.map
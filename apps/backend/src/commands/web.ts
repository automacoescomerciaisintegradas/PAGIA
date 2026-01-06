/**
 * PAGIA - Web Interface Command
 * Servidor web para interface gráfica do PAGIA
 * 
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */

import { Command } from 'commander';
import express, { Request, Response } from 'express';
import chalk from 'chalk';
import { createInterface } from 'readline';
import { join, basename } from 'path';
import { existsSync, readFileSync } from 'fs';
import { exec } from 'child_process';
import { logger } from '../utils/logger.js';
import { getRouterManager } from '../core/router-manager.js';
import { getCredentialsManager } from '../core/credentials.js';
import { getGlobalConfig } from '../core/global-config.js';
import { createAIService, type AIMessage } from '../core/ai-service.js';
import { generateVibeProject } from '../utils/vibe-generator.js';

const DEFAULT_PORT = 3456;

// Chat state per session
interface ChatSession {
    messages: AIMessage[];
    context: Map<string, string>;
    createdAt: Date;
}

const sessions = new Map<string, ChatSession>();

export const webCommand = new Command('web')
    .description('Iniciar interface web do PAGIA')
    .option('-p, --port <port>', 'Porta do servidor', String(DEFAULT_PORT))
    .option('-o, --open', 'Abrir navegador automaticamente', false)
    .action(async (options) => {
        await startWebServer(options);
    });

async function startWebServer(options: { port: string; open: boolean }): Promise<void> {
    const port = parseInt(options.port) || DEFAULT_PORT;
    const app = express();

    // Initialize systems
    const router = getRouterManager();
    const globalConfig = getGlobalConfig();

    await router.initialize();
    await globalConfig.initialize();

    // Middleware
    app.use(express.json());
    app.use(express.static(join(process.cwd(), 'public')));

    // CORS for development
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        next();
    });

    // ==================== API ROUTES ====================

    // Get status
    app.get('/api/status', async (req, res) => {
        const config = router.getConfig();
        res.json({
            version: '1.0.0',
            providers: config.providers.length,
            defaultProvider: config.router.default.provider,
            defaultModel: config.router.default.model,
            workingDir: process.cwd(),
        });
    });

    // Get router config
    app.get('/api/router', async (req, res) => {
        const config = router.getConfig();
        res.json({
            providers: config.providers.map(p => ({
                name: p.name,
                models: p.models,
                enabled: p.enabled !== false,
            })),
            router: config.router,
            settings: config.settings,
        });
    });

    // Chat endpoint
    app.post('/api/chat', async (req, res) => {
        const { message, sessionId = 'default', provider, model } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get or create session
        let session = sessions.get(sessionId);
        if (!session) {
            session = {
                messages: [{
                    role: 'system',
                    content: getSystemPrompt(),
                }],
                context: new Map(),
                createdAt: new Date(),
            };
            sessions.set(sessionId, session);
        }

        // Add user message
        session.messages.push({ role: 'user', content: message });

        try {
            // Get provider config
            const config = router.getConfig();
            const providerName = provider || config.router.default.provider;
            const modelName = model || config.router.default.model;

            const providerConfig = config.providers.find(p => p.name === providerName);
            if (!providerConfig) {
                throw new Error(`Provider not found: ${providerName}`);
            }

            // Create AI service
            const aiService = createAIService({
                type: providerName as any,
                apiKey: providerConfig.api_key,
                model: modelName,
            });

            // Get response
            const response = await aiService.chat(session.messages);

            // Add assistant response
            session.messages.push({ role: 'assistant', content: response.content });

            res.json({
                content: response.content,
                provider: response.provider,
                model: response.model,
                tokensUsed: response.tokensUsed,
            });

        } catch (error: any) {
            // Remove failed message
            session.messages.pop();

            res.status(500).json({
                error: error.message || 'Failed to communicate with AI',
            });
        }
    });

    // Vibe Generator endpoint
    app.post('/api/vibe/init', async (req, res) => {
        const { projectName, vibe } = req.body;

        if (!projectName) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        try {
            const result = await generateVibeProject({
                projectName,
                vibe
            });
            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                error: error.message || 'Failed to generate Vibe project',
            });
        }
    });

    // Clear chat session
    app.post('/api/chat/clear', (req, res) => {
        const { sessionId = 'default' } = req.body;
        sessions.delete(sessionId);
        res.json({ success: true });
    });

    // Get router config (includes default provider)
    app.get('/api/router', async (req, res) => {
        const config = router.getConfig();
        res.json(config);
    });

    // Get available providers
    app.get('/api/providers', async (req, res) => {
        const config = router.getConfig();
        res.json(config.providers.map(p => ({
            name: p.name,
            models: p.models,
            enabled: p.enabled !== false,
        })));
    });

    // ==================== WEB UI ====================

    // Serve the main UI
    app.get('/ui', (req, res) => {
        res.sendFile(join(process.cwd(), 'public', 'index.html'));
    });

    app.get('/', (req, res) => {
        res.redirect('/ui');
    });

    // Start server
    app.listen(port, () => {
        console.log('');
        console.log(chalk.bold.cyan('  🌐 PAGIA Web Interface'));
        console.log(chalk.gray('  ─'.repeat(30)));
        console.log('');
        console.log(`  ${chalk.green('●')} Servidor rodando em: ${chalk.cyan(`http://127.0.0.1:${port}/ui`)}`);
        console.log('');
        console.log(chalk.gray('  Pressione Ctrl+C para encerrar.'));
        console.log('');

        // Open browser if requested
        if (options.open) {
            const url = `http://127.0.0.1:${port}/ui`;
            const cmd = process.platform === 'win32' ? 'start' :
                process.platform === 'darwin' ? 'open' : 'xdg-open';
            exec(`${cmd} ${url}`);
        }
    });
}

function getSystemPrompt(): string {
    const projectName = basename(process.cwd());

    return `Você é o PAGIA, um assistente de IA especializado em desenvolvimento de software e gestão de projetos.

## Contexto
- Projeto: ${projectName}
- Diretório: ${process.cwd()}
- Data: ${new Date().toLocaleDateString('pt-BR')}

## Instruções
1. Seja claro, conciso e profissional.
2. Quando solicitado a criar código, forneça código completo e funcional.
3. Explique suas decisões quando relevante.
4. Use markdown para formatar respostas.
5. Se não souber algo, admita honestamente.

Responda em português brasileiro.`;
}


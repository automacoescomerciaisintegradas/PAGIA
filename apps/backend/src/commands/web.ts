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
import { createAIService } from '../core/ai-service.js';
import type { AIMessage } from '../core/ai-service.js';

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

    // Clear chat session
    app.post('/api/chat/clear', (req, res) => {
        const { sessionId = 'default' } = req.body;
        sessions.delete(sessionId);
        res.json({ success: true });
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
        res.send(getWebUI());
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

function getWebUI(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PAGIA - Plano de Ação de Gestão e Implementação com IA</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.1/marked.min.js"></script>
    <style>
        :root {
            --bg-primary: #0f0f14;
            --bg-secondary: #16161d;
            --bg-tertiary: #1e1e28;
            --bg-card: #1a1a24;
            --text-primary: #ffffff;
            --text-secondary: #9ca3af;
            --text-muted: #6b7280;
            --accent: #22d3ee;
            --accent-secondary: #06b6d4;
            --accent-gradient: linear-gradient(135deg, #22d3ee 0%, #0891b2 100%);
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --border: #2d2d3a;
            --shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        /* Header */
        .header {
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            padding: 0.75rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .logo-icon {
            width: 42px;
            height: 42px;
            background: var(--accent-gradient);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 1.3rem;
            color: #0f0f14;
            box-shadow: 0 4px 15px rgba(34, 211, 238, 0.3);
        }
        
        .logo-text {
            font-size: 1.6rem;
            font-weight: 800;
            background: var(--accent-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.5px;
        }
        
        .logo-subtitle {
            font-size: 0.7rem;
            color: var(--text-muted);
            margin-top: -4px;
        }
        
        .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .provider-select {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 0.5rem 1rem;
            color: var(--text-primary);
            font-size: 0.85rem;
            cursor: pointer;
            outline: none;
        }
        
        .provider-select:focus {
            border-color: var(--accent);
        }
        
        .github-link {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 0.5rem 1rem;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 0.85rem;
            transition: all 0.2s;
        }
        
        .github-link:hover {
            border-color: var(--accent);
            color: var(--text-primary);
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8rem;
            color: var(--text-secondary);
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--success);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* Main Layout */
        .main-container {
            flex: 1;
            display: grid;
            grid-template-columns: 280px 1fr;
            overflow: hidden;
        }
        
        /* Sidebar */
        .sidebar {
            background: var(--bg-secondary);
            border-right: 1px solid var(--border);
            padding: 1.5rem;
            overflow-y: auto;
        }
        
        .sidebar-section {
            margin-bottom: 2rem;
        }
        
        .sidebar-title {
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.75rem;
        }
        
        .sidebar-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            border-radius: 8px;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
        }
        
        .sidebar-item:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
        
        .sidebar-item.active {
            background: rgba(34, 211, 238, 0.1);
            color: var(--accent);
        }
        
        .sidebar-item-icon {
            font-size: 1.1rem;
        }
        
        /* Info Card */
        .info-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        .info-card-title {
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--accent);
        }
        
        .info-card-content {
            font-size: 0.8rem;
            color: var(--text-secondary);
            line-height: 1.5;
        }
        
        .info-card code {
            background: var(--bg-tertiary);
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            font-family: 'Fira Code', monospace;
            font-size: 0.75rem;
        }
        
        /* Chat Area */
        .chat-area {
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        /* Welcome Section */
        .welcome {
            text-align: center;
            padding: 3rem 2rem;
            max-width: 700px;
            margin: 0 auto;
        }
        
        .welcome-icon {
            width: 80px;
            height: 80px;
            background: var(--accent-gradient);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            margin: 0 auto 1.5rem;
            box-shadow: 0 10px 40px rgba(34, 211, 238, 0.25);
        }
        
        .welcome h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
            background: linear-gradient(90deg, #fff 0%, var(--accent) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .welcome p {
            color: var(--text-secondary);
            font-size: 1rem;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        
        .welcome-features {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .feature-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.25rem;
            text-align: left;
            transition: all 0.2s;
        }
        
        .feature-card:hover {
            border-color: var(--accent);
            transform: translateY(-2px);
        }
        
        .feature-icon {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }
        
        .feature-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
            font-size: 0.95rem;
        }
        
        .feature-desc {
            font-size: 0.8rem;
            color: var(--text-muted);
        }
        
        .suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            justify-content: center;
        }
        
        .suggestion {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 0.6rem 1.25rem;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.85rem;
            color: var(--text-secondary);
        }
        
        .suggestion:hover {
            border-color: var(--accent);
            color: var(--accent);
            background: rgba(34, 211, 238, 0.1);
        }
        
        /* Messages */
        .message {
            display: flex;
            gap: 1rem;
            animation: fadeIn 0.3s ease;
            max-width: 900px;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .message-avatar {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            flex-shrink: 0;
        }
        
        .message.user .message-avatar {
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
        }
        
        .message.assistant .message-avatar {
            background: var(--accent-gradient);
            color: #0f0f14;
        }
        
        .message-content {
            flex: 1;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1rem 1.25rem;
            line-height: 1.7;
        }
        
        .message-content pre {
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1rem;
            overflow-x: auto;
            margin: 0.75rem 0;
        }
        
        .message-content code {
            font-family: 'Fira Code', 'Consolas', monospace;
            font-size: 0.85rem;
        }
        
        .message-content p {
            margin-bottom: 0.75rem;
        }
        
        .message-content p:last-child {
            margin-bottom: 0;
        }
        
        .message-content ul, .message-content ol {
            margin-left: 1.5rem;
            margin-bottom: 0.75rem;
        }
        
        /* Typing indicator */
        .typing {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
        
        .typing-dot {
            width: 8px;
            height: 8px;
            background: var(--accent);
            border-radius: 50%;
            animation: bounce 1.4s ease-in-out infinite;
        }
        
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-8px); }
        }
        
        /* Input Area */
        .input-area {
            background: var(--bg-secondary);
            border-top: 1px solid var(--border);
            padding: 1.25rem 2rem;
        }
        
        .input-container {
            max-width: 900px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 0.75rem 1rem;
            display: flex;
            gap: 0.75rem;
            align-items: flex-end;
            transition: all 0.2s;
        }
        
        .input-container:focus-within {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1);
        }
        
        .input-textarea {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 0.95rem;
            resize: none;
            min-height: 24px;
            max-height: 200px;
            outline: none;
        }
        
        .input-textarea::placeholder {
            color: var(--text-muted);
        }
        
        .send-button {
            background: var(--accent-gradient);
            border: none;
            border-radius: 10px;
            width: 42px;
            height: 42px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(34, 211, 238, 0.3);
        }
        
        .send-button:hover {
            transform: scale(1.05);
        }
        
        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .send-button svg {
            width: 20px;
            height: 20px;
            fill: #0f0f14;
        }
        
        /* Error message */
        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid var(--error);
            border-radius: 10px;
            padding: 1rem;
            color: var(--error);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 0.75rem;
            font-size: 0.75rem;
            color: var(--text-muted);
            border-top: 1px solid var(--border);
            background: var(--bg-secondary);
        }
        
        .footer a {
            color: var(--accent);
            text-decoration: none;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .main-container {
                grid-template-columns: 1fr;
            }
            .sidebar {
                display: none;
            }
            .welcome-features {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo">
            <div class="logo-icon">P</div>
            <div>
                <div class="logo-text">PAGIA</div>
                <div class="logo-subtitle">Automações Comerciais Integradas</div>
            </div>
        </div>
        <div class="header-actions">
            <select id="providerSelect" class="provider-select">
                <option value="">Carregando...</option>
            </select>
            <a href="https://github.com/automacoescomerciaisintegradas/PAGIA" target="_blank" class="github-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
            </a>
            <div class="status-indicator">
                <span class="status-dot"></span>
                <span>Conectado</span>
            </div>
        </div>
    </header>
    
    <div class="main-container">
        <aside class="sidebar">
            <div class="sidebar-section">
                <div class="sidebar-title">Menu</div>
                <div class="sidebar-item active">
                    <span class="sidebar-item-icon">💬</span>
                    <span>Chat</span>
                </div>
                <div class="sidebar-item" onclick="showDocs()">
                    <span class="sidebar-item-icon">📚</span>
                    <span>Documentação</span>
                </div>
                <div class="sidebar-item" onclick="showProviders()">
                    <span class="sidebar-item-icon">⚙️</span>
                    <span>Provedores</span>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-title">Instalação Rápida</div>
                <div class="info-card">
                    <div class="info-card-title">📦 Via NPM</div>
                    <div class="info-card-content">
                        <code>npm install -g pagia</code>
                    </div>
                </div>
                <div class="info-card">
                    <div class="info-card-title">📂 Via Git</div>
                    <div class="info-card-content">
                        <code>git clone https://github.com/automacoescomerciaisintegradas/pagia.git</code><br><br>
                        <code>cd pagia && npm install</code><br>
                        <code>npm run build && npm link</code>
                    </div>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-title">Contato</div>
                <div class="info-card">
                    <div class="info-card-content">
                        📧 contato@automacoescomerciais.com.br<br>
                        © 2025 Automações Comerciais Integradas
                    </div>
                </div>
            </div>
        </aside>
        
        <main class="chat-area">
            <div id="chatContainer" class="chat-container">
                <div class="welcome">
                    <div class="welcome-icon">🤖</div>
                    <h1>Bem-vindo ao PAGIA</h1>
                    <p>Plano de Ação de Gestão e Implementação com IA.<br>
                    Seu assistente inteligente para desenvolvimento e gestão de projetos.</p>
                    
                    <div class="welcome-features">
                        <div class="feature-card">
                            <div class="feature-icon">💻</div>
                            <div class="feature-title">Geração de Código</div>
                            <div class="feature-desc">Crie componentes, funções e projetos completos</div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📋</div>
                            <div class="feature-title">Gestão de Planos</div>
                            <div class="feature-desc">Organize tarefas e acompanhe o progresso</div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔄</div>
                            <div class="feature-title">Multi-Provedor</div>
                            <div class="feature-desc">Gemini, OpenAI, Groq, Ollama e mais</div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🛠️</div>
                            <div class="feature-title">Agentes de IA</div>
                            <div class="feature-desc">Analista, Desenvolvedor, Arquiteto</div>
                        </div>
                    </div>
                    
                    <div class="suggestions">
                        <button class="suggestion" onclick="sendSuggestion('Crie um componente React com TypeScript')">Componente React</button>
                        <button class="suggestion" onclick="sendSuggestion('Como configurar o PAGIA com Ollama local?')">Configurar Ollama</button>
                        <button class="suggestion" onclick="sendSuggestion('Analise este projeto e sugira melhorias')">Analisar projeto</button>
                        <button class="suggestion" onclick="sendSuggestion('Explique a arquitetura do PAGIA')">Arquitetura PAGIA</button>
                    </div>
                </div>
            </div>
            
            <div class="input-area">
                <div class="input-container">
                    <textarea 
                        id="messageInput" 
                        class="input-textarea" 
                        placeholder="Digite sua mensagem..." 
                        rows="1"
                        onkeydown="handleKeyDown(event)"
                        oninput="autoResize(this)"
                    ></textarea>
                    <button id="sendButton" class="send-button" onclick="sendMessage()">
                        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </div>
            </div>
        </main>
    </div>
    
    <footer class="footer">
        Desenvolvido por <a href="https://github.com/automacoescomerciaisintegradas" target="_blank">Automações Comerciais Integradas</a> | 
        <a href="https://github.com/automacoescomerciaisintegradas/PAGIA" target="_blank">GitHub</a> | 
        © 2025
    </footer>
    
    <script>
        let isLoading = false;
        let currentProvider = '';
        let currentModel = '';
        
        // Configure marked
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true
        });
        
        // Load providers
        async function loadProviders() {
            try {
                const res = await fetch('/api/router');
                const data = await res.json();
                
                const select = document.getElementById('providerSelect');
                select.innerHTML = '';
                
                data.providers.forEach(p => {
                    p.models.forEach(m => {
                        const option = document.createElement('option');
                        option.value = p.name + '/' + m;
                        option.textContent = p.name + '/' + m;
                        if (p.name === data.router.default.provider && m === data.router.default.model) {
                            option.selected = true;
                            currentProvider = p.name;
                            currentModel = m;
                        }
                        select.appendChild(option);
                    });
                });
                
                select.onchange = () => {
                    const [p, m] = select.value.split('/');
                    currentProvider = p;
                    currentModel = m;
                };
            } catch (e) {
                console.error('Failed to load providers:', e);
            }
        }
        
        function handleKeyDown(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        }
        
        function autoResize(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
        
        function sendSuggestion(text) {
            document.getElementById('messageInput').value = text;
            sendMessage();
        }
        
        function showDocs() {
            window.open('https://github.com/automacoescomerciaisintegradas/PAGIA#readme', '_blank');
        }
        
        function showProviders() {
            alert('Use o seletor no topo para trocar de provedor/modelo.\\n\\nOu execute: pagia router status');
        }
        
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (!message || isLoading) return;
            
            // Clear welcome screen
            const welcome = document.querySelector('.welcome');
            if (welcome) welcome.remove();
            
            // Add user message
            addMessage('user', message);
            input.value = '';
            input.style.height = 'auto';
            
            // Show typing indicator
            isLoading = true;
            const typingEl = addTypingIndicator();
            document.getElementById('sendButton').disabled = true;
            
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message,
                        provider: currentProvider,
                        model: currentModel,
                    }),
                });
                
                const data = await res.json();
                
                typingEl.remove();
                
                if (data.error) {
                    addError(data.error);
                } else {
                    addMessage('assistant', data.content);
                }
                
            } catch (e) {
                typingEl.remove();
                addError('Erro de conexão com o servidor.');
            }
            
            isLoading = false;
            document.getElementById('sendButton').disabled = false;
        }
        
        function addMessage(role, content) {
            const container = document.getElementById('chatContainer');
            const div = document.createElement('div');
            div.className = 'message ' + role;
            
            const avatar = role === 'user' ? '👤' : '🤖';
            const htmlContent = role === 'assistant' ? marked.parse(content) : escapeHtml(content);
            
            div.innerHTML = \`
                <div class="message-avatar">\${avatar}</div>
                <div class="message-content">\${htmlContent}</div>
            \`;
            
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
            
            // Highlight code blocks
            if (role === 'assistant') {
                div.querySelectorAll('pre code').forEach(block => {
                    hljs.highlightElement(block);
                });
            }
        }
        
        function addTypingIndicator() {
            const container = document.getElementById('chatContainer');
            const div = document.createElement('div');
            div.className = 'message assistant';
            div.innerHTML = \`
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="typing">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            \`;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
            return div;
        }
        
        function addError(message) {
            const container = document.getElementById('chatContainer');
            const div = document.createElement('div');
            div.className = 'error-message';
            div.innerHTML = '❌ ' + message;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Initialize
        loadProviders();
        document.getElementById('messageInput').focus();
    </script>
</body>
</html>`;
}

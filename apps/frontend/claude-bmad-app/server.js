import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { spawn } from 'child_process';
import fs from 'fs';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carregar .env da raiz do projeto PAGIA com caminho absoluto
config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Helper para carregar tarefas reais das configurações da CLI (.pagia/plans)
function loadRealTasks() {
    let allTasks = [];
    try {
        const plansDir = path.resolve('../../.pagia/plans');
        if (!fs.existsSync(plansDir)) return [];

        const subdirs = ['stages', 'global'];

        subdirs.forEach(subdir => {
            const dirPath = path.join(plansDir, subdir);
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.yaml'));
                files.forEach(file => {
                    try {
                        const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
                        const doc = yaml.load(content);
                        if (doc && doc.tasks) {
                            allTasks = allTasks.concat(doc.tasks.map(t => ({
                                ...t,
                                spec: doc.name || subdir,
                                agent: t.assignedAgent || t.assignee || 'Unassigned'
                            })));
                        } else if (doc && doc.stages) {
                            // Suporte para schema de onboarding/stages aninhados
                            doc.stages.forEach(stage => {
                                if (stage.tasks) {
                                    allTasks = allTasks.concat(stage.tasks.map(t => ({
                                        ...t,
                                        name: t.title || t.name,
                                        spec: stage.title || doc.name,
                                        agent: t.assignedAgent || t.assignee || 'Unassigned'
                                    })));
                                }
                            });
                        }
                    } catch (e) {
                        console.error(`Erro ao ler arquivo ${file}:`, e.message);
                    }
                });
            }
        });
    } catch (e) {
        console.error("Erro ao ler diretório de planos:", e.message);
    }
    return allTasks;
}

// Função de Detecção Automática de Provedor
function detectBestProvider() {
    const providers = [
        { type: 'gemini', key: 'GEMINI_API_KEY', label: 'Google Gemini 2.0 (Flash)', color: 'yellow' },
        { type: 'openai', key: 'OPENAI_API_KEY', label: 'OpenAI GPT-4o', color: 'white' },
        { type: 'anthropic', key: 'ANTHROPIC_API_KEY', label: 'Anthropic Claude 3.5', color: 'magenta' },
        { type: 'groq', key: 'GROQ_API_KEY', label: 'Groq (Llama 3)', color: 'green' }
    ];

    // Se o usuário forçou um via APP_PROVIDER, use-o
    if (process.env.AI_PROVIDER && process.env.AI_PROVIDER !== 'auto') {
        const forced = providers.find(p => p.type === process.env.AI_PROVIDER);
        if (forced) return forced;
        if (['local', 'ollama'].includes(process.env.AI_PROVIDER)) {
            return { type: 'ollama', key: null, label: 'Ollama (Local)', color: 'blue' };
        }
    }

    // Busca o primeiro disponível no .env
    for (const p of providers) {
        if (process.env[p.key] && process.env[p.key].trim() !== '') {
            return p;
        }
    }

    // Fallback padrão
    return { type: 'ollama', key: null, label: 'Ollama (Local - Fallback)', color: 'blue' };
}

const activeProvider = detectBestProvider();
let providerType = activeProvider.type;
let aiClient;
let geminiModel;

console.log(chalk.bold.cyan(`\n🚀 Inicializando Orchestrator PAGIA...`));

try {
    switch (activeProvider.type) {
        case 'local':
        case 'ollama':
            const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
            aiClient = new OpenAI({
                apiKey: 'ollama',
                baseURL: `${ollamaHost}/v1`,
            });
            console.log(chalk[activeProvider.color](`📡 Modo: ${activeProvider.label}`));
            break;

        case 'groq':
            aiClient = new OpenAI({
                apiKey: process.env.GROQ_API_KEY,
                baseURL: 'https://api.groq.com/openai/v1',
            });
            console.log(chalk[activeProvider.color](`⚡ Modo: ${activeProvider.label}`));
            break;

        case 'openai':
            aiClient = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            console.log(chalk[activeProvider.color](`🌐 Modo: ${activeProvider.label}`));
            break;

        case 'gemini':
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            console.log(chalk[activeProvider.color](`✨ Modo: ${activeProvider.label}`));
            break;

        case 'anthropic':
            aiClient = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });
            console.log(chalk[activeProvider.color](`🎭 Modo: ${activeProvider.label}`));
            break;
    }
} catch (e) {
    console.error(chalk.red("❌ Erro ao configurar provedor:"), e.message);
    // Fallback de emergência
    providerType = 'ollama';
}

app.use(express.static('public'));

// Endpoint de Download de PRD
app.get('/api/download-prd', (req, res) => {
    const fileName = req.query.file;
    if (!fileName) return res.status(400).send('Arquivo não especificado');

    const filePath = path.resolve('../../.pagia/docs/prds', fileName);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('PRD não encontrado');
    }
});

// Endpoint para Listar PRDs
app.get('/api/list-prds', (req, res) => {
    const prdsDir = path.resolve('../../.pagia/docs/prds');
    if (!fs.existsSync(prdsDir)) return res.json([]);

    try {
        const files = fs.readdirSync(prdsDir)
            .filter(f => f.endsWith('.md'))
            .map(f => {
                const stats = fs.statSync(path.join(prdsDir, f));
                return {
                    name: f,
                    date: stats.mtime,
                    size: stats.size
                };
            })
            .sort((a, b) => b.date - a.date);
        res.json(files);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

let projectState = {
    currentLayout: 'default',
    tasks: loadRealTasks(), // Carrega tarefas reais do JSON
    pages: [
        {
            id: 'index', name: 'Home', content: `
            <div style="padding: 40px; text-align: center; color: #1e293b;">
                <h1 style="color: #00f2ff; margin-bottom: 20px;">PAGIA Dashboard Maestro</h1>
                <p>O provedor atual é: <strong style="color: #8b5cf6;">${providerType.toUpperCase()}</strong></p>
                <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                    Peça ao Maestro para mudar este conteúdo no chat lateral!
                </div>
            </div>
        ` }
    ],
    styles: {
        primaryColor: '#00ccff',
        backgroundColor: '#0f172a'
    }
};

io.on('connection', (socket) => {
    console.log(chalk.green('🔌 Cliente conectado:'), socket.id);
    socket.emit('state-update', projectState);

    socket.on('chat-message', async (message) => {
        console.log(chalk.blue('💬 Comando:'), message);

        try {
            let responseText = '';
            const systemPrompt = "Você é o Agente Maestro da Interface Premium do PAGIA. Sua tarefa é gerenciar o projeto e evoluir o código em tempo real. Sempre que o usuário pedir uma mudança visual ou funcional, retorne um objeto JSON que atualiza o estado do app. Estrutura esperada: { \"thinking\": \"Seu raciocínio estratégico aqui em português\", \"update\": { \"content\": \"Código HTML5/CSS/JS completo e funcional (premium design)\", \"styles\": { \"primaryColor\": \"#xxxxxx\" } } }. Responda APENAS o JSON em português do Brasil.";

            if (providerType === 'gemini') {
                const result = await geminiModel.generateContent({
                    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUsuário: ${message}` }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        maxOutputTokens: 8192,
                        temperature: 0.7
                    }
                });
                responseText = result.response.text();
            } else if (providerType === 'anthropic' && aiClient instanceof Anthropic) {
                const response = await aiClient.messages.create({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 8192,
                    system: systemPrompt,
                    messages: [{ role: "user", content: message }],
                });
                responseText = response.content[0].text;
            } else {
                // OpenAI Compatible (Local, Groq, OpenAI)
                const modelMap = {
                    'local': process.env.DEEPSEEK_MODEL || 'llama3.2',
                    'groq': 'llama-3.3-70b-versatile',
                    'openai': 'gpt-4o'
                };

                const completion = await aiClient.chat.completions.create({
                    model: modelMap[providerType] || 'gpt-4o',
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message }
                    ],
                    max_tokens: 4096, // Groq/OpenAI geralmente preferem limites menores por chamada, mas aumentaremos para o dobro do anterior
                    response_format: { type: "json_object" }
                });
                responseText = completion.choices[0].message.content;
            }

            const data = JSON.parse(responseText);

            if (data.update) {
                projectState.pages[0].content = data.update.content || projectState.pages[0].content;
                projectState.styles = { ...projectState.styles, ...data.update.styles };

                io.emit('state-update', projectState);
                io.emit('agent-thinking', data.thinking);
            }
        } catch (error) {
            console.error(chalk.red('❌ Erro no Processamento:'), error);
            socket.emit('error', 'Ocorreu um erro ao processar sua solicitação.');
        }
    });

    // Gerenciador de processos ativos
    const activeProcesses = new Map();

    // Execução de comandos reais do sistema
    socket.on('run-real-command', ({ command, args, terminalId, cwd }) => {
        // Se já houver um processo rodando neste terminal, encerra-o
        if (activeProcesses.has(terminalId)) {
            activeProcesses.get(terminalId).kill();
        }

        console.log(chalk.yellow(`⚙️ Executando: ${command} ${args.join(' ')} em ${terminalId}`));

        // Garantir que o CWD seja absoluto e aponte para a raiz se necessário
        const projectRoot = path.resolve(__dirname, '../../../');
        const finalCwd = (!cwd || cwd === '.') ? projectRoot : cwd;

        const child = spawn(command, args, {
            cwd: finalCwd,
            shell: true,
            env: { ...process.env, PYTHONIOENCODING: 'UTF-8' }
        });

        activeProcesses.set(terminalId, child);

        let fullOutput = ''; // Variável para acumular o log

        child.stdout.on('data', (data) => {
            const str = data.toString();
            fullOutput += str;

            // Detecção em Tempo Real para UX instantânea
            if (str.includes('DOWNLOAD_URL:')) {
                const match = str.match(/DOWNLOAD_URL:\s*(.+)/);
                if (match && match[1]) {
                    const url = match[1].trim();
                    io.emit('prd-ready', { url, terminalId });
                }
            }

            io.emit('terminal-log', {
                terminalId: terminalId,
                text: str,
                type: 'info'
            });
        });

        child.stderr.on('data', (data) => {
            io.emit('terminal-log', {
                terminalId: terminalId,
                text: data.toString(),
                type: 'error'
            });
        });

        child.on('close', (code) => {
            activeProcesses.delete(terminalId);
            const output = fullOutput || '';

            // Se encontrar a URL de download no log, avisa o frontend
            if (output.includes('DOWNLOAD_URL:')) {
                const url = output.split('DOWNLOAD_URL:')[1].trim();
                io.emit('prd-ready', { url, terminalId });
            }

            io.emit('terminal-log', {
                terminalId: terminalId,
                text: `\n[FIM] Processo finalizado com código ${code}`,
                type: code === 0 ? 'success' : 'error'
            });
        });

        // Captura o último output para processar metadados
        child.stdout.on('data', (data) => {
            child.stdout_last = data.toString();
        });
    });

    socket.on('kill-process', (terminalId) => {
        if (activeProcesses.has(terminalId)) {
            activeProcesses.get(terminalId).kill();
            activeProcesses.delete(terminalId);
            socket.emit('terminal-log', {
                terminalId: terminalId,
                text: `\n[CORTE] Processo encerrado pelo usuário.`,
                type: 'error'
            });
        }
    });

    socket.on('terminal-input', ({ terminalId, text }) => {
        const child = activeProcesses.get(terminalId);
        if (child && child.stdin.writable) {
            child.stdin.write(text + '\n');
        }
    });
});

const PORT = 3005;
httpServer.listen(PORT, () => {
    console.log(chalk.bold.cyan(`🌌 PAGIA Maestro rodando em http://localhost:${PORT}`));
});

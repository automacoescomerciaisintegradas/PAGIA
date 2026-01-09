#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Diretório para armazenar sessões
const SESSIONS_DIR = path.resolve(process.cwd(), '.pagia', 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Função para carregar sessão
function loadSession(id) {
    const file = path.join(SESSIONS_DIR, `${id}.json`);
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Função para salvar sessão
function saveSession(id, history) {
    const file = path.join(SESSIONS_DIR, `${id}.json`);
    fs.writeFileSync(file, JSON.stringify(history, null, 2));
}

// Função para carregar histórico de comandos
function loadCommandHistory() {
    const historyFile = path.join(SESSIONS_DIR, 'command-history.json');
    if (!fs.existsSync(historyFile)) return [];
    return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
}

// Função para salvar histórico de comandos
function saveCommandHistory(history) {
    const historyFile = path.join(SESSIONS_DIR, 'command-history.json');
    const maxHistory = 1000; // Limitar histórico para evitar arquivos muito grandes
    if (history.length > maxHistory) {
        history = history.slice(-maxHistory);
    }
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// Função para criar prompt com histórico
function createPersistentPrompt(sessionId = 'default') {
    let history = loadSession(sessionId);
    let commandHistory = loadCommandHistory();
    let historyIndex = commandHistory.length; // Para navegação com setas

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        history: commandHistory, // Usar histórico do readline
        historySize: 100
    });

    // Exibir cabeçalho
    console.log(`┌─ PAGIA AI Persistente ──────────────────┐`);
    console.log(`│ Sessão: ${sessionId.padEnd(29)}│`);
    console.log(`│ Digite 'help' para comandos especiais  │`);
    console.log(`│ Digite 'exit' ou Ctrl+C para sair      │`);
    console.log(`└──────────────────────────────────────────┘`);

    // Função para exibir prompt
    function promptUser() {
        rl.question('> ', (input) => {
            if (!input) {
                promptUser();
                return;
            }

            // Processar comandos especiais
            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
                console.log('👋 Saindo do PAGIA...');
                rl.close();
                return;
            }

            if (input.toLowerCase() === 'help') {
                showHelp();
                promptUser();
                return;
            }

            if (input.toLowerCase() === 'history') {
                showSessionHistory(history);
                promptUser();
                return;
            }

            if (input.toLowerCase() === 'sessions') {
                listSessions();
                promptUser();
                return;
            }

            if (input.toLowerCase().startsWith('session ')) {
                const newSessionId = input.split(' ')[1];
                if (newSessionId) {
                    console.log(`🔄 Mudando para sessão: ${newSessionId}`);
                    // Salvar sessão atual antes de mudar
                    saveSession(sessionId, history);
                    // Carregar nova sessão
                    history = loadSession(newSessionId);
                    sessionId = newSessionId;
                    console.log(`✅ Sessão atual: ${sessionId}`);
                }
                promptUser();
                return;
            }

            // Adicionar comando ao histórico
            commandHistory.push(input);
            saveCommandHistory(commandHistory);

            // Adicionar ao histórico da sessão
            history.push(`Usuário: ${input}`);
            
            // Processar comando (aqui você pode adicionar sua lógica de IA)
            processCommand(input, history, sessionId).then(() => {
                promptUser();
            }).catch(error => {
                console.error('Erro ao processar comando:', error.message);
                promptUser();
            });
        });
    }

    promptUser();

    rl.on('close', () => {
        // Salvar sessão ao sair
        saveSession(sessionId, history);
        console.log('\n👋 Sessão salva. Até logo!');
    });

    // Manipular Ctrl+C
    process.on('SIGINT', () => {
        saveSession(sessionId, history);
        console.log('\n\n👋 Sessão salva. Até logo!');
        process.exit(0);
    });
}

// Função para processar comandos (exemplo com IA)
async function processCommand(input, history, sessionId) {
    console.log(`Processando: ${input}`);
    
    // Adicionar ao histórico
    history.push(`Sistema: Processando comando...`);
    
    try {
        // Simular resposta (substitua com sua lógica de IA real)
        if (process.env.GEMINI_API_KEY) {
            // Importar e usar a IA se a chave estiver configurada
            const { runAI } = await import('./src/ai/runner.js');
            
            const prompt = history.join('\n') +
                '\nAssistente: responda sempre em português do Brasil.\n';
            
            const response = await runAI(prompt);
            console.log(response);
            
            // Adicionar resposta ao histórico
            history[history.length - 1] = `Sistema: Processando comando...`;
            history.push(`Assistente: ${response}`);
        } else {
            // Resposta simulada se não houver chave de API
            const simulatedResponse = `⚠️  GEMINI_API_KEY não configurada. Comando "${input}" processado em modo offline.`;
            console.log(simulatedResponse);
            history.push(`Assistente: ${simulatedResponse}`);
        }
        
        // Salvar sessão atualizada
        saveSession(sessionId, history);
    } catch (error) {
        console.error('Erro ao processar IA:', error.message);
        const errorMessage = `❌ Erro ao processar: ${error.message}`;
        console.log(errorMessage);
        history.push(`Assistente: ${errorMessage}`);
        
        // Salvar mesmo com erro
        saveSession(sessionId, history);
    }
}

// Funções auxiliares
function showHelp() {
    console.log(`
Comandos especiais:
  help          - Mostra esta ajuda
  history       - Mostra histórico da sessão atual
  sessions      - Lista todas as sessões
  session <id>  - Muda para uma sessão específica
  exit/quit     - Sai do PAGIA
    `);
}

function showSessionHistory(history) {
    if (history.length === 0) {
        console.log('Nenhuma interação na sessão atual.');
        return;
    }
    
    console.log(`\n--- Histórico da Sessão ---`);
    history.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.substring(0, 100)}${entry.length > 100 ? '...' : ''}`);
    });
    console.log('---------------------------\n');
}

function listSessions() {
    const files = fs.readdirSync(SESSIONS_DIR);
    const sessions = files.filter(file => file.endsWith('.json') && file !== 'command-history.json');
    
    if (sessions.length === 0) {
        console.log('Nenhuma sessão encontrada.');
        return;
    }
    
    console.log('\n--- Sessões Disponíveis ---');
    sessions.forEach((session, index) => {
        const sessionId = session.replace('.json', '');
        console.log(`${index + 1}. ${sessionId}`);
    });
    console.log('---------------------------\n');
}

// Iniciar o prompt persistente
const sessionId = process.argv[3] || 'default';
createPersistentPrompt(sessionId);
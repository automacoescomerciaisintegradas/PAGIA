#!/usr/bin/env node

// Forçar saída UTF-8 no Windows
if (process.platform === 'win32') {
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');
}

import 'dotenv/config';
import { createPrompt } from './src/ui/prompt.js';
import { loadSession, saveSession } from './src/session/store.js';
import { runAI } from './src/ai/runner.js';

// Função para escrever no console de forma segura
function safeWrite(message) {
    try {
        process.stdout.write(message + '\n');
    } catch (error) {
        console.log(message);
    }
}

// Obter ID da sessão
const sessionId = process.argv[3] || 'default';
let history = loadSession(sessionId);

// Exibir cabeçalho
safeWrite(`┌─ PAGIA Terminal Persistente ──────────────┐`);
safeWrite(`│ Sessão: ${sessionId.padEnd(32)}│`);
safeWrite(`│ Digite 'ajuda' para comandos especiais   │`);
safeWrite(`│ Digite 'sair' para encerrar              │`);
safeWrite(`└──────────────────────────────────────────┘`);

// Mostrar informações da sessão
if (history.length > 0) {
    safeWrite(`[${history.length} interações anteriores carregadas]`);
}

// Função para processar comandos
async function processCommand(input) {
    if (!input) return;

    // Comandos especiais
    if (input.toLowerCase() === 'sair' || input.toLowerCase() === 'exit') {
        saveSession(sessionId, history);
        safeWrite('👋 Sessão salva. Até logo!');
        process.exit(0);
    }

    if (input.toLowerCase() === 'ajuda') {
        safeWrite(`
Comandos especiais:
  ajuda         - Mostra esta ajuda
  historico     - Mostra histórico da sessão
  limpar        - Limpa histórico da sessão
  sessao <id>   - Muda para outra sessão (não implementado aqui)
  sair          - Sai e salva a sessão
        `);
        return;
    }

    if (input.toLowerCase() === 'historico') {
        if (history.length === 0) {
            safeWrite('Nenhuma interação registrada.');
        } else {
            safeWrite('\n--- Histórico da Sessão ---');
            history.forEach((entry, index) => {
                safeWrite(`${index + 1}. ${entry.substring(0, 60)}${entry.length > 60 ? '...' : ''}`);
            });
            safeWrite('---------------------------\n');
        }
        return;
    }

    if (input.toLowerCase() === 'limpar') {
        history = [];
        saveSession(sessionId, history);
        safeWrite('✅ Histórico da sessão limpo.');
        return;
    }

    // Adicionar entrada do usuário ao histórico
    history.push(`Usuário: ${input}`);

    try {
        // Criar prompt com contexto completo
        const prompt = history.join('\n') +
            '\nAssistente: responda sempre em português do Brasil e mantenha contexto das mensagens anteriores.\n';

        safeWrite('PAGIA: ');

        // Processar com IA se configurada
        if (process.env.GEMINI_API_KEY) {
            const response = await runAI(prompt);
            safeWrite(response);
            history.push(`Assistente: ${response}`);
        } else {
            const response = `⚠️  GEMINI_API_KEY não configurada. Modo offline ativado. Recebi: "${input}"`;
            safeWrite(response);
            history.push(`Assistente: ${response}`);
        }

        // Salvar sessão atualizada
        saveSession(sessionId, history);
    } catch (error) {
        const errorMessage = `❌ Erro: ${error.message}`;
        safeWrite(errorMessage);
        history.push(`Erro: ${errorMessage}`);
        saveSession(sessionId, history);
    }
}

// Criar prompt interativo
createPrompt(processCommand);

// Manipular encerramento
process.on('SIGINT', () => {
    saveSession(sessionId, history);
    safeWrite('\n\n👋 Sessão salva. Encerrando...');
    process.exit(0);
});
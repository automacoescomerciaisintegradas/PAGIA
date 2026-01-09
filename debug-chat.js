#!/usr/bin/env node

import 'dotenv/config';
import { createPrompt } from './src/ui/prompt.js';
import { loadSession, saveSession } from './src/session/store.js';
import { runAI } from './src/ai/runner.js';

console.log('Iniciando PAGIA Chat Debug...');

// Verificar variáveis de ambiente
console.log('AI_PROVIDER:', process.env.AI_PROVIDER);
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_MODEL:', process.env.GEMINI_MODEL);

const sessionId = 'debug-session';
let history = loadSession(sessionId);

console.log(`┌─ PAGIA AI Debug ──────────────────────────┐`);
console.log(`│ Sessão: ${sessionId.padEnd(32)}│`);
console.log(`│ Digite sua mensagem (Ctrl+C para sair)   │`);
console.log(`└──────────────────────────────────────────┘`);

createPrompt(async (input) => {
    if (!input) return;

    console.log('Input recebido:', input);
    
    history.push(`Usuário: ${input}`);

    const prompt = history.join('\n') +
        '\nAssistente: responda sempre em português do Brasil.\n';

    try {
        console.log('Executando IA com prompt...');
        const response = await runAI(prompt);
        console.log('Resposta:', response);

        history.push(`Assistente: ${response}`);
        saveSession(sessionId, history);
    } catch (error) {
        console.error("Erro ao executar IA:", error.message);
        console.error("Stack:", error.stack);
    }
});
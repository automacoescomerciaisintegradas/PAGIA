#!/usr/bin/env node

import 'dotenv/config';
import { runAI } from './src/ai/runner.js';

console.log('Teste de conexão com IA...');

// Verificar variáveis de ambiente
console.log('AI_PROVIDER:', process.env.AI_PROVIDER);
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_MODEL:', process.env.GEMINI_MODEL);

try {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY não está configurada");
    }
    
    console.log("Executando teste de IA...");
    const response = await runAI("Olá, apenas responda com 'PAGIA funcionando!' em português.");
    console.log("Resposta recebida:", response);
} catch (error) {
    console.error("Erro no teste de IA:", error.message);
    console.error("Stack:", error.stack);
}
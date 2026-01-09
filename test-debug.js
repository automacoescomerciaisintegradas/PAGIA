#!/usr/bin/env node

import 'dotenv/config';

console.error('=== DEBUG: Iniciando teste de ambiente PAGIA ===');
console.error('AI_PROVIDER:', process.env.AI_PROVIDER || 'NÃO CONFIGURADO');
console.error('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.error('GEMINI_MODEL:', process.env.GEMINI_MODEL || 'NÃO CONFIGURADO');

if (!process.env.GEMINI_API_KEY) {
    console.error('⚠️  ERRO: GEMINI_API_KEY não está configurada!');
    console.error('Por favor, adicione sua chave de API no arquivo .env');
    process.exit(1);
}

console.error('API Key está configurada, testando conexão...');

try {
    // Importar e testar a API do Gemini diretamente
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp' 
    });
    
    console.error('Modelo criado, gerando conteúdo...');
    
    // Usar IIFE para lidar com async/await
    (async () => {
        try {
            const result = await model.generateContent('Teste de conexão, responda com "Conexão bem-sucedida"');
            const response = await result.response;
            const text = response.text();
            console.error('Resposta da API recebida:', text.substring(0, 100) + '...');
        } catch (error) {
            console.error('Erro na API:', error.message);
            console.error('Stack:', error.stack);
        }
    })();
    
} catch (error) {
    console.error('Erro ao importar GoogleGenerativeAI:', error.message);
    console.error('Stack:', error.stack);
}
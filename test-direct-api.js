#!/usr/bin/env node

import 'dotenv/config';

console.log('Teste de ambiente PAGIA');
console.log('AI_PROVIDER:', process.env.AI_PROVIDER || 'NÃO CONFIGURADO');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_MODEL:', process.env.GEMINI_MODEL || 'NÃO CONFIGURADO');

// Teste de API diretamente
if (process.env.GEMINI_API_KEY) {
    console.log('API Key está configurada, testando conexão...');
    
    // Importar e testar a API do Gemini diretamente
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp' });
    
    try {
        const result = await model.generateContent('Teste de conexão, responda com "Conexão bem-sucedida"');
        const response = await result.response;
        console.log('Resposta da API:', response.text());
    } catch (error) {
        console.error('Erro na API:', error.message);
    }
} else {
    console.log('⚠️  GEMINI_API_KEY não está configurada. Por favor, adicione sua chave de API no arquivo .env');
    console.log('Você pode obter uma chave em: https://aistudio.google.com/app/apikey');
}
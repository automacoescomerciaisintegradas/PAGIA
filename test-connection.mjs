import { runAI } from './src/ai/runner.js';

async function testAIConnection() {
    console.log('Testando conexão com IA...');
    
    try {
        const response = await runAI("Olá! Por favor, responda com 'PAGIA conectado com sucesso!' em português brasileiro.");
        console.log('Resposta da IA:', response);
    } catch (error) {
        console.error('Erro na conexão com IA:', error.message);
        
        if (error.message.includes('GEMINI_API_KEY')) {
            console.log('\n💡 Para resolver este problema:');
            console.log('1. Obtenha uma chave de API do Google AI Studio: https://aistudio.google.com/app/apikey');
            console.log('2. Adicione ao arquivo .env:');
            console.log('   GEMINI_API_KEY=sua_chave_aqui');
            console.log('3. Reinicie o aplicativo');
        }
    }
}

testAIConnection();
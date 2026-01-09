#!/usr/bin/env node

// Configurar dotenv para carregar variáveis de ambiente
import 'dotenv/config';

// Log de diagnóstico
console.log('=== DIAGNÓSTICO PAGIA ===');
console.log('Diretório atual:', process.cwd());
console.log('Node version:', process.version);
console.log('AI_PROVIDER:', process.env.AI_PROVIDER);
console.log('GEMINI_API_KEY configurada:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_MODEL:', process.env.GEMINI_MODEL || 'NÃO CONFIGURADO');

// Testar importação dos módulos
try {
    console.log('\n1. Testando importação de módulos...');
    
    // Testar importação do runner
    const { runAI } = await import('./src/ai/runner.js');
    console.log('✅ Módulo src/ai/runner.js importado com sucesso');
    
    // Testar importação do prompt
    const { createPrompt } = await import('./src/ui/prompt.js');
    console.log('✅ Módulo src/ui/prompt.js importado com sucesso');
    
    // Testar importação do session store
    const { loadSession, saveSession } = await import('./src/session/store.js');
    console.log('✅ Módulo src/session/store.js importado com sucesso');
    
    // Testar carregamento de sessão
    console.log('\n2. Testando sistema de sessão...');
    const history = loadSession('test-session');
    console.log('✅ Sessão carregada com sucesso, itens:', history.length);
    
    // Testar salvamento de sessão
    saveSession('test-session', [...history, 'Teste de salvamento']);
    console.log('✅ Sessão salva com sucesso');
    
    // Testar conexão com IA se a chave estiver configurada
    if (process.env.GEMINI_API_KEY) {
        console.log('\n3. Testando conexão com IA...');
        try {
            const response = await runAI("Teste de conexão, responda com 'Conexão bem-sucedida' em português.");
            console.log('✅ Conexão com IA bem-sucedida');
            console.log('Resposta:', response.substring(0, 100) + (response.length > 100 ? '...' : ''));
        } catch (aiError) {
            console.log('⚠️  Erro na conexão com IA:', aiError.message);
        }
    } else {
        console.log('\n3. ⚠️  GEMINI_API_KEY não configurada - pulando teste de IA');
        console.log('   Para configurar: adicione GEMINI_API_KEY= sua_chave_no_arquivo .env');
    }
    
    console.log('\n=== DIAGNÓSTICO CONCLUÍDO COM SUCESSO ===');
    
    // Agora tentar iniciar o chat se tudo estiver OK
    console.log('\n4. Iniciando interface de chat...');
    
    const sessionId = 'default';
    let chatHistory = loadSession(sessionId);
    
    console.log(`┌─ PAGIA Chat Iniciado ───────────────────┐`);
    console.log(`│ Sessão: ${sessionId.padEnd(29)}│`);
    console.log(`│ Items no histórico: ${chatHistory.length.toString().padEnd(19)}│`);
    console.log(`└──────────────────────────────────────────┘`);
    
    // Criar interface de prompt
    const readline = await import('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.setPrompt('> ');
    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();
        
        if (input.toLowerCase() === 'sair' || input.toLowerCase() === 'exit') {
            console.log('👋 Saindo...');
            rl.close();
            return;
        }
        
        if (input.toLowerCase() === 'ajuda') {
            console.log('Comandos: ajuda, sair, historico');
            rl.prompt();
            return;
        }
        
        if (input.toLowerCase() === 'historico') {
            console.log('Histórico de interações:');
            chatHistory.forEach((item, idx) => {
                console.log(`${idx + 1}. ${item.substring(0, 50)}${item.length > 50 ? '...' : ''}`);
            });
            rl.prompt();
            return;
        }
        
        // Adicionar ao histórico
        chatHistory.push(`Usuário: ${input}`);
        
        // Processar com IA se configurada
        if (process.env.GEMINI_API_KEY) {
            try {
                const prompt = chatHistory.join('\n') + '\nPAGIA: ';
                const response = await runAI(prompt);
                console.log('PAGIA:', response);
                chatHistory.push(`PAGIA: ${response}`);
            } catch (error) {
                console.log('Erro:', error.message);
                chatHistory.push(`Erro: ${error.message}`);
            }
        } else {
            console.log('PAGIA: (modo offline - API não configurada)');
            chatHistory.push(`PAGIA: (modo offline - API não configurada)`);
        }
        
        // Salvar sessão
        saveSession(sessionId, chatHistory);
        
        rl.prompt();
    });

    rl.on('close', () => {
        saveSession(sessionId, chatHistory);
        console.log('\nSessão salva. Até logo!');
    });
    
} catch (error) {
    console.error('\n❌ ERRO FATAL NO DIAGNÓSTICO:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
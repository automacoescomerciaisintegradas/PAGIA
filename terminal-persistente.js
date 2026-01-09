#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';

// Configurar diretórios
const PAGIA_DIR = path.resolve(process.cwd(), '.pagia');
const SESSIONS_DIR = path.join(PAGIA_DIR, 'sessions');

// Criar diretórios se não existirem
if (!fs.existsSync(PAGIA_DIR)) {
    fs.mkdirSync(PAGIA_DIR, { recursive: true });
}
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Função para carregar sessão
function loadSession(sessionId) {
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error(`Erro ao ler sessão ${sessionId}:`, error.message);
            return [];
        }
    }
    return [];
}

// Função para salvar sessão
function saveSession(sessionId, history) {
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    try {
        fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
        return true;
    } catch (error) {
        console.error(`Erro ao salvar sessão ${sessionId}:`, error.message);
        return false;
    }
}

// Função para listar sessões
function listSessions() {
    try {
        const files = fs.readdirSync(SESSIONS_DIR);
        return files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
    } catch (error) {
        console.error('Erro ao listar sessões:', error.message);
        return [];
    }
}

// Função principal
function startPersistentChat() {
    const sessionId = process.argv[3] || 'default';
    let history = loadSession(sessionId);
    
    console.log(`┌─ PAGIA Terminal Persistente ──────────────┐`);
    console.log(`│ Sessão: ${sessionId.padEnd(32)}│`);
    console.log(`│ Digite 'ajuda' para comandos especiais   │`);
    console.log(`│ Digite 'sair' para encerrar              │`);
    console.log(`└──────────────────────────────────────────┘`);
    
    // Mostrar histórico anterior se existir
    if (history.length > 0) {
        console.log(`\n[${history.length} interações anteriores carregadas]\n`);
    }
    
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    function processInput(input) {
        // Comandos especiais
        if (input.toLowerCase() === 'sair') {
            saveSession(sessionId, history);
            console.log('👋 Sessão salva. Até logo!');
            rl.close();
            return;
        }
        
        if (input.toLowerCase() === 'ajuda') {
            console.log(`
Comandos especiais:
  ajuda         - Mostra esta ajuda
  historico     - Mostra histórico da sessão
  sessoes       - Lista todas as sessões
  sessao <id>   - Muda para outra sessão
  limpar        - Limpa o histórico da sessão atual
  sair          - Sai e salva a sessão
            `);
            promptUser();
            return;
        }
        
        if (input.toLowerCase() === 'historico') {
            if (history.length === 0) {
                console.log('Nenhuma interação registrada nesta sessão.');
            } else {
                console.log('\n--- Histórico da Sessão ---');
                history.forEach((entry, index) => {
                    console.log(`${index + 1}. ${entry}`);
                });
                console.log('---------------------------\n');
            }
            promptUser();
            return;
        }
        
        if (input.toLowerCase() === 'sessoes') {
            const sessions = listSessions();
            if (sessions.length === 0) {
                console.log('Nenhuma sessão encontrada.');
            } else {
                console.log('\n--- Sessões Disponíveis ---');
                sessions.forEach((session, index) => {
                    const marker = session === sessionId ? ' [ATUAL]' : '';
                    console.log(`${index + 1}. ${session}${marker}`);
                });
                console.log('---------------------------\n');
            }
            promptUser();
            return;
        }
        
        if (input.toLowerCase().startsWith('sessao ')) {
            const newSessionId = input.split(' ', 2)[1];
            if (newSessionId) {
                // Salvar sessão atual
                saveSession(sessionId, history);
                
                // Carregar nova sessão
                const newHistory = loadSession(newSessionId);
                history = newHistory;
                console.log(`✅ Mudança para sessão: ${newSessionId}`);
                
                if (history.length > 0) {
                    console.log(`[${history.length} interações carregadas]\n`);
                }
            } else {
                console.log('Uso: sessao <id_da_sessao>');
            }
            promptUser();
            return;
        }
        
        if (input.toLowerCase() === 'limpar') {
            history = [];
            saveSession(sessionId, history);
            console.log('✅ Histórico da sessão atual limpo.');
            promptUser();
            return;
        }
        
        // Adicionar comando ao histórico
        const userEntry = `Usuário: ${input}`;
        history.push(userEntry);
        
        // Simular processamento (substitua com sua lógica real)
        console.log(`Processando: ${input}`);
        
        // Simular resposta (poderia ser uma chamada à IA)
        setTimeout(() => {
            const response = `PAGIA: Recebi seu comando "${input}". Esta é uma resposta simulada. Para funcionalidade completa, configure sua API.`;
            console.log(response);
            history.push(`PAGIA: ${response}`);
            
            // Salvar sessão atualizada
            saveSession(sessionId, history);
            
            promptUser();
        }, 100);
    }
    
    function promptUser() {
        rl.question('> ', processInput);
    }
    
    // Iniciar prompt
    promptUser();
    
    // Manipular encerramento
    rl.on('close', () => {
        saveSession(sessionId, history);
        console.log('\n👋 Sessão salva automaticamente.');
    });
    
    process.on('SIGINT', () => {
        saveSession(sessionId, history);
        console.log('\n\n👋 Sessão salva. Encerrando...');
        process.exit(0);
    });
}

// Iniciar o chat persistente
startPersistentChat();
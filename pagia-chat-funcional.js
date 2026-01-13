#!/usr/bin/env node

/**
 * PAGIA CHAT FUNCIONAL - Solução Imediata
 * 
 * Este script fornece um terminal PAGIA funcional com persistência de sessões
 * que deve funcionar no seu ambiente Windows.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawn } from 'child_process';

// Configuração do sistema de persistência
const PAGIA_DIR = path.resolve('.pagia');
const SESSIONS_DIR = path.join(PAGIA_DIR, 'sessions');

// Garantir que os diretórios existam
if (!fs.existsSync(PAGIA_DIR)) {
    fs.mkdirSync(PAGIA_DIR, { recursive: true });
}
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

class PagiaChat {
    constructor(sessionId = 'default') {
        this.sessionId = sessionId;
        this.history = this.loadSession(sessionId);
        this.rl = null;
    }
    
    loadSession(sessionId) {
        const file = path.join(SESSIONS_DIR, `${sessionId}.json`);
        if (!fs.existsSync(file)) {
            // Criar sessão vazia
            fs.writeFileSync(file, JSON.stringify([], null, 2));
            return [];
        }
        
        try {
            const content = fs.readFileSync(file, 'utf8');
            const data = JSON.parse(content);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`Erro ao ler sessão ${sessionId}:`, error.message);
            return [];
        }
    }
    
    saveSession(sessionId, history) {
        try {
            // Limitar tamanho do histórico
            const MAX_HISTORY = 1000;
            if (history.length > MAX_HISTORY) {
                history = history.slice(-MAX_HISTORY);
            }
            
            const file = path.join(SESSIONS_DIR, `${sessionId}.json`);
            fs.writeFileSync(file, JSON.stringify(history, null, 2));
            return true;
        } catch (error) {
            console.error(`Erro ao salvar sessão ${sessionId}:`, error.message);
            return false;
        }
    }
    
    addInteraction(role, content) {
        const interaction = {
            timestamp: new Date().toISOString(),
            role: role,
            content: content
        };
        this.history.push(interaction);
        this.saveSession(this.sessionId, this.history);
    }
    
    showHeader() {
        process.stdout.write('\n');
        process.stdout.write('┌─ PAGIA Chat Funcional ───────────────────┐\n');
        process.stdout.write(`│ Sessão: ${this.sessionId.padEnd(32)}│\n`);
        process.stdout.write('│ Digite "ajuda" para comandos           │\n');
        process.stdout.write('│ Digite "sair" para encerrar            │\n');
        process.stdout.write('└─────────────────────────────────────────┘\n');
        
        if (this.history.length > 0) {
            process.stdout.write(`\n[${this.history.length} interações carregadas]\n\n`);
        }
    }
    
    showHelp() {
        process.stdout.write(`
Comandos disponíveis:
  ajuda     - Mostra esta ajuda
  historico - Mostra histórico da sessão
  limpar    - Limpa histórico da sessão
  sessao    - Mostra sessão atual
  sair      - Sai do chat
\n`);
    }
    
    showHistory() {
        if (this.history.length === 0) {
            process.stdout.write('Nenhuma interação registrada.\n');
            return;
        }
        
        process.stdout.write('\n--- Histórico da Sessão ---\n');
        this.history.forEach((entry, index) => {
            const prefix = entry.role === 'usuário' ? '👤 ' : 
                          entry.role === 'assistente' ? '🤖 ' : '💬 ';
            process.stdout.write(`${prefix}${index + 1}. [${entry.timestamp.split('T')[1].substring(0,8)}] ${entry.content.substring(0, 70)}${entry.content.length > 70 ? '...' : ''}\n`);
        });
        process.stdout.write('---------------------------\n\n');
    }
    
    clearHistory() {
        this.history = [];
        this.saveSession(this.sessionId, this.history);
        process.stdout.write('✅ Histórico limpo.\n');
    }
    
    async processCommand(input) {
        // Comandos especiais
        switch (input.toLowerCase()) {
            case 'ajuda':
                this.showHelp();
                return;
            case 'historico':
                this.showHistory();
                return;
            case 'limpar':
                this.clearHistory();
                return;
            case 'sessao':
                process.stdout.write(`Sessão atual: ${this.sessionId} (${this.history.length} interações)\n`);
                return;
            case 'sair':
            case 'exit':
                process.stdout.write('👋 Saindo...\n');
                this.rl.close();
                return;
        }
        
        // Adicionar interação do usuário
        this.addInteraction('usuário', input);
        
        // Simular resposta (você pode substituir com a API real)
        process.stdout.write('PAGIA: ');
        
        // Verificar se temos API key configurada
        if (process.env.GEMINI_API_KEY) {
            try {
                // Importar temporariamente para tentar usar a API
                const { runAI } = await import('./src/ai/runner.js');
                const prompt = this.history.map(h => `${h.role}: ${h.content}`).join('\n') + 
                              '\nAssistente: responda em português do Brasil.';
                const response = await runAI(prompt);
                process.stdout.write(response + '\n');
                this.addInteraction('assistente', response);
            } catch (error) {
                const fallbackResponse = `⚠️  Erro na API: ${error.message}. Modo offline ativado.`;
                process.stdout.write(fallbackResponse + '\n');
                this.addInteraction('assistente', fallbackResponse);
            }
        } else {
            // Resposta simulada para modo offline
            const responses = [
                `Recebi sua mensagem: "${input}". Esta é uma resposta simulada.`,
                `Entendi: "${input}". Para funcionalidade completa, configure GEMINI_API_KEY.`,
                `Processando: "${input}". Sistema de persistência está funcionando.`,
                `Analisando: "${input}". Suas interações estão sendo salvas.`
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            process.stdout.write(response + '\n');
            this.addInteraction('assistente', response);
        }
    }
    
    start() {
        this.showHeader();
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const prompt = () => {
            this.rl.question('> ', async (input) => {
                if (input.trim()) {
                    await this.processCommand(input.trim());
                }
                if (!input.toLowerCase().match(/^(sair|exit)$/)) {
                    prompt();
                }
            });
        };
        
        prompt();
        
        this.rl.on('close', () => {
            process.stdout.write('\nSessão salva. Até logo!\n');
            process.exit(0);
        });
    }
}

// Iniciar o chat
const sessionId = process.argv[2] || 'default';
const chat = new PagiaChat(sessionId);
chat.start();
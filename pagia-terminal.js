#!/usr/bin/env node

/**
 * PAGIA Terminal Persistente com Histórico Completo e Curadoria de Contexto
 *
 * Este wrapper implementa:
 * - Persistência de sessões entre execuções
 * - Histórico de comandos
 * - Recuperação de contexto
 * - Gerenciamento de múltiplas sessões
 * - Integração com sistema avançado de curadoria de contexto
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import 'dotenv/config';

// Importar funções de sessão
const { loadSession, saveSession, listSessions, cleanupSession } = await import('./src/session/store.js');
const { runAI } = await import('./src/ai/runner.js');

// Importar habilidades para curadoria de contexto
const { runSkill } = await import('./src/engine/skill-runner.ts');
const { getSkill } = await import('./src/skills/index.ts');

class PagiaTerminal {
    constructor(sessionId = 'default') {
        this.sessionId = sessionId;
        this.history = loadSession(sessionId);
        this.commandHistory = [];
        this.historyIndex = -1;

        // Configurar diretórios
        this.setupDirectories();
    }

    setupDirectories() {
        const pagiaDir = path.resolve(process.cwd(), '.pagia');
        if (!fs.existsSync(pagiaDir)) {
            fs.mkdirSync(pagiaDir, { recursive: true });
        }
    }

    async start() {
        this.showHeader();

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            history: this.commandHistory,
            historySize: 100
        });

        // Carregar histórico de comandos se existir
        this.loadCommandHistory();

        const prompt = () => {
            rl.question('> ', async (input) => {
                if (input === undefined) {
                    // EOF (Ctrl+D)
                    this.cleanup();
                    process.exit(0);
                }

                if (input.trim()) {
                    await this.processCommand(input.trim(), rl);
                }
                prompt();
            });
        };

        prompt();

        rl.on('close', () => {
            this.cleanup();
            process.exit(0);
        });

        // Manipular Ctrl+C
        process.on('SIGINT', () => {
            this.cleanup();
            process.stdout.write('\n\n👋 Sessão salva. Até logo!\n');
            process.exit(0);
        });
    }

    showHeader() {
        process.stdout.write('\n');
        process.stdout.write('┌─ PAGIA Terminal Persistente v2.0 ──────────┐\n');
        process.stdout.write(`│ Sessão: ${this.sessionId.padEnd(35)}│\n`);
        process.stdout.write('│ API Configurada: ' + (process.env.GEMINI_API_KEY ? 'Sim'.padEnd(22) : 'Não'.padEnd(22)) + '│\n');
        process.stdout.write('│ Digite "ajuda" para comandos especiais     │\n');
        process.stdout.write('│ Digite "sair" para encerrar                │\n');
        process.stdout.write('└─────────────────────────────────────────────┘\n');

        if (this.history.length > 0) {
            process.stdout.write(`\n[${this.history.length} interações anteriores carregadas]\n\n`);
        }
    }

    async processCommand(input, rl) {
        // Adicionar ao histórico de comandos
        if (input.toLowerCase() !== 'sair' && input.toLowerCase() !== 'historico') {
            this.commandHistory.push(input);
            this.saveCommandHistory();
        }

        // Comandos especiais
        switch (input.toLowerCase()) {
            case 'sair':
            case 'exit':
            case 'quit':
                this.cleanup();
                process.exit(0);
                return;

            case 'ajuda':
            case 'help':
                this.showHelp();
                return;

            case 'historico':
            case 'history':
                this.showSessionHistory();
                return;

            case 'sessoes':
            case 'sessions':
                this.showSessions();
                return;

            case 'limpar':
            case 'clear':
                this.clearSession();
                return;

            case 'info':
                this.showInfo();
                return;

            case 'cleanup':
                this.performCleanup();
                return;

            // Comandos de curadoria de contexto
            case 'contexto':
            case 'context':
                this.showContextHelp();
                return;

            case 'context-stats':
            case 'context stats':
                await this.runContextCommand('stats');
                return;

            case 'context-build':
            case 'context build':
                await this.runContextCommand('build-tree . "**/*.md" "**/*.ts" "**/*.js"');
                return;
        }

        // Comandos de curadoria de contexto com argumentos
        if (input.toLowerCase().startsWith('context ') || input.toLowerCase().startsWith('contexto ')) {
            const contextCommand = input.substring(input.indexOf(' ') + 1);
            await this.runContextCommand(contextCommand);
            return;
        }

        // Comando de troca de sessão
        if (input.toLowerCase().startsWith('sessao ') || input.toLowerCase().startsWith('session ')) {
            const newSessionId = input.split(' ', 2)[1];
            if (newSessionId) {
                this.switchSession(newSessionId);
            } else {
                process.stdout.write('Uso: sessao <nome_da_sessao>\n');
            }
            return;
        }

        // Adicionar comando ao histórico da sessão
        this.history.push(`Usuário: ${input}`);

        try {
            process.stdout.write('PAGIA: ');

            if (process.env.GEMINI_API_KEY) {
                // Criar prompt com contexto completo
                const prompt = this.history.join('\n') +
                    '\nAssistente: responda sempre em português do Brasil e mantenha contexto das mensagens anteriores.\n';

                const response = await runAI(prompt);
                process.stdout.write(response + '\n');
                this.history.push(`Assistente: ${response}`);
            } else {
                // Modo offline
                const response = `⚠️  GEMINI_API_KEY não configurada. Comando recebido: "${input}". Para funcionalidade completa, configure sua API.`;
                process.stdout.write(response + '\n');
                this.history.push(`Assistente: ${response}`);
            }

            // Salvar sessão atualizada
            saveSession(this.sessionId, this.history);

        } catch (error) {
            const errorMessage = `❌ Erro: ${error.message}`;
            process.stdout.write(errorMessage + '\n');
            this.history.push(`Erro: ${errorMessage}`);
            saveSession(this.sessionId, this.history);
        }
    }

    async runContextCommand(contextCommand) {
        try {
            // Parse the context command
            const parts = contextCommand.trim().split(' ');
            const operation = parts[0];
            const args = parts.slice(1).join(' ');

            // Run the context curation skill
            const skill = await getSkill('context-curation');
            const result = await runSkill(skill, {
                sessionId: this.sessionId,
                history: this.history,
                input: `${operation} ${args}`.trim()
            });

            process.stdout.write(result + '\n');
        } catch (error) {
            process.stdout.write(`❌ Erro ao executar comando de contexto: ${error.message}\n`);
        }
    }

    showContextHelp() {
        process.stdout.write(`
Comandos de Curadoria de Contexto:
  context stats                    - Mostra estatísticas da árvore de contexto
  context build-tree [dir] [pats]  - Constrói árvore de contexto
  context search <query>           - Busca tradicional por palavras-chave
  context semantic-search <query>  - Busca semântica usando embeddings
  context add-document <file> [cat] [tags] - Adiciona documento com tags
  context filter [type] [tag] [pri] - Filtra contexto por critérios
  contexto                         - Mostra esta ajuda de contexto

Exemplos:
  > context build-tree . "**/*.ts" "**/*.md"
  > context semantic-search "autenticação de usuários"
  > context add-document readme.md documentation "important,api"
  > context filter code
\n`);
    }

    showHelp() {
        process.stdout.write(`
Comandos Especiais:
  ajuda/help      - Mostra esta ajuda
  historico       - Mostra histórico da sessão atual
  sessoes         - Lista todas as sessões disponíveis
  sessao <nome>   - Muda para outra sessão
  limpar          - Limpa histórico da sessão atual
  info            - Mostra informações do sistema
  cleanup         - Limpa sessões antigas
  context         - Comandos de curadoria de contexto
  sair/exit       - Sai do terminal (salva automaticamente)

Atalhos:
  ↑/↓             - Navegar pelo histórico de comandos
  Tab             - Auto-completar (se disponível)
\n`);
    }

    showSessionHistory() {
        if (this.history.length === 0) {
            process.stdout.write('Nenhuma interação registrada nesta sessão.\n');
            return;
        }

        process.stdout.write(`\n--- Histórico da Sessão '${this.sessionId}' (${this.history.length} itens) ---\n`);
        this.history.forEach((entry, index) => {
            const prefix = entry.startsWith('Usuário:') ? '👤 ' : entry.startsWith('Assistente:') ? '🤖 ' : '💬 ';
            process.stdout.write(`${prefix}${index + 1}. ${entry.substring(0, 80)}${entry.length > 80 ? '...' : ''}\n`);
        });
        process.stdout.write('--------------------------------------------------------\n\n');
    }

    showSessions() {
        const sessions = listSessions();

        if (sessions.length === 0) {
            process.stdout.write('Nenhuma sessão encontrada.\n');
            return;
        }

        process.stdout.write('\n--- Sessões Disponíveis ---\n');
        sessions.forEach((session, index) => {
            const marker = session === this.sessionId ? ' [ATUAL]' : '';
            const history = loadSession(session);
            process.stdout.write(`${index + 1}. ${session}${marker} (${history.length} msgs)\n`);
        });
        process.stdout.write('---------------------------\n\n');
    }

    switchSession(newSessionId) {
        // Salvar sessão atual
        saveSession(this.sessionId, this.history);

        // Carregar nova sessão
        this.sessionId = newSessionId;
        this.history = loadSession(newSessionId);

        process.stdout.write(`✅ Mudança para sessão: ${newSessionId}\n`);
        if (this.history.length > 0) {
            process.stdout.write(`[${this.history.length} interações carregadas]\n\n`);
        }
    }

    clearSession() {
        this.history = [];
        saveSession(this.sessionId, this.history);
        process.stdout.write('✅ Histórico da sessão atual limpo.\n');
    }

    showInfo() {
        const sessions = listSessions();
        const currentHistory = loadSession(this.sessionId);

        process.stdout.write('\n--- Informações do Sistema ---\n');
        process.stdout.write(`Sessão Atual: ${this.sessionId}\n`);
        process.stdout.write(`Mensagens na Sessão: ${currentHistory.length}\n`);
        process.stdout.write(`Total de Sessões: ${sessions.length}\n`);
        process.stdout.write(`API Configurada: ${process.env.GEMINI_API_KEY ? 'Sim' : 'Não'}\n`);
        process.stdout.write(`Diretório .pagia: ${path.resolve(process.cwd(), '.pagia')}\n`);
        process.stdout.write('-------------------------------\n\n');
    }

    performCleanup() {
        // Limpar sessão atual
        const newSize = cleanupSession(this.sessionId);
        process.stdout.write(`✅ Sessão '${this.sessionId}' limpa: ${newSize} mensagens mantidas.\n`);

        // Listar sessões para possível limpeza
        const sessions = listSessions();
        process.stdout.write(`Sessões existentes: ${sessions.join(', ') || 'nenhuma'}\n`);
    }

    loadCommandHistory() {
        const historyFile = path.join(process.cwd(), '.pagia', 'command-history.json');
        if (fs.existsSync(historyFile)) {
            try {
                const content = fs.readFileSync(historyFile, 'utf8');
                this.commandHistory = JSON.parse(content);
            } catch (error) {
                // Ignorar erro e começar com histórico vazio
            }
        }
    }

    saveCommandHistory() {
        const historyFile = path.join(process.cwd(), '.pagia', 'command-history.json');
        try {
            // Limitar tamanho do histórico de comandos
            const maxCommands = 500;
            if (this.commandHistory.length > maxCommands) {
                this.commandHistory = this.commandHistory.slice(-maxCommands);
            }
            fs.writeFileSync(historyFile, JSON.stringify(this.commandHistory, null, 2));
        } catch (error) {
            // Não interromper execução se não puder salvar histórico de comandos
        }
    }

    cleanup() {
        // Salvar sessão atual
        saveSession(this.sessionId, this.history);

        // Salvar histórico de comandos
        this.saveCommandHistory();
    }
}

// Iniciar terminal
const sessionId = process.argv[2] || 'default';
const terminal = new PagiaTerminal(sessionId);

// Iniciar o terminal
terminal.start().catch(error => {
    console.error('Erro fatal no terminal:', error);
    process.exit(1);
});
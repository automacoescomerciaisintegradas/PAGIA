/**
 * PAGIA CLI Engine
 * Loop principal da CLI - comportamento 100% padrão de terminal
 * 
 * @author Automações Comerciais Integradas
 */

import readline from 'readline';

export class Engine {
    private rl: readline.Interface;
    private onCommand: (input: string) => Promise<void>;
    private promptPrefix: string;

    constructor(onCommand: (input: string) => Promise<void>, promptPrefix: string = '> ') {
        this.onCommand = onCommand;
        this.promptPrefix = promptPrefix;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        // Handle Ctrl+C
        this.rl.on('SIGINT', () => {
            console.log('\n👋 Até logo!');
            process.exit(0);
        });

        // Handle Ctrl+D
        this.rl.on('close', () => {
            console.log('\n👋 Até logo!');
            process.exit(0);
        });
    }

    start() {
        this.renderPrompt();
    }

    private renderPrompt() {
        this.rl.question(this.promptPrefix, async (input) => {
            await this.safeExecute(input);
            this.renderPrompt(); // Só volta ao prompt APÓS a execução completa
        });
    }

    private async safeExecute(input: string) {
        const trimmed = input.trim();
        if (!trimmed) return;

        try {
            await this.onCommand(trimmed);
        } catch (err: any) {
            console.error('❌ ERRO:', err.message || err);
        }
    }
}

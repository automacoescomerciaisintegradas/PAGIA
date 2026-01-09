/**
 * PAGIA CLI Engine
 * Loop principal da CLI - comportamento 100% padrão de terminal
 *
 * @author Automações Comerciais Integradas
 */
import readline from 'readline';
export class Engine {
    rl;
    onCommand;
    promptPrefix;
    constructor(onCommand, promptPrefix = '> ') {
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
    renderPrompt() {
        this.rl.question(this.promptPrefix, async (input) => {
            await this.safeExecute(input);
            this.renderPrompt(); // Só volta ao prompt APÓS a execução completa
        });
    }
    async safeExecute(input) {
        const trimmed = input.trim();
        if (!trimmed)
            return;
        try {
            await this.onCommand(trimmed);
        }
        catch (err) {
            console.error('❌ ERRO:', err.message || err);
        }
    }
}
//# sourceMappingURL=Engine.js.map
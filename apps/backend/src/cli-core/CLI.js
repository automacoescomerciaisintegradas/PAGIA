/**
 * PAGIA CLI Command Registry
 * Registro e execução de comandos
 */
import { Renderer } from './Renderer.js';
export class CLI {
    commands = new Map();
    defaultHandler;
    register(command) {
        this.commands.set(command.name, command);
    }
    setDefaultHandler(handler) {
        this.defaultHandler = handler;
    }
    async execute(input) {
        if (!input)
            return;
        // Check if it's a slash command
        if (input.startsWith('/')) {
            const [name, ...args] = input.split(' ');
            const commandName = name.substring(1).toLowerCase(); // Remove /
            const command = this.commands.get(commandName);
            if (command) {
                await command.run(args);
                return;
            }
            else {
                Renderer.error(`Comando desconhecido: ${name}. Use /help para ver comandos.`);
                return;
            }
        }
        // Default: treat as chat/ask
        if (this.defaultHandler) {
            await this.defaultHandler(input);
        }
        else {
            Renderer.info('Digite /help para ver comandos disponíveis.');
        }
    }
    listCommands() {
        return Array.from(this.commands.values());
    }
}
//# sourceMappingURL=CLI.js.map
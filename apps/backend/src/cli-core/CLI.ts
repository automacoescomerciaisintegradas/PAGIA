/**
 * PAGIA CLI Command Registry
 * Registro e execução de comandos
 */

import { CLICommand } from './types.js';
import { Renderer } from './Renderer.js';

export class CLI {
    private commands = new Map<string, CLICommand>();
    private defaultHandler?: (input: string) => Promise<void>;

    register(command: CLICommand) {
        this.commands.set(command.name, command);
    }

    setDefaultHandler(handler: (input: string) => Promise<void>) {
        this.defaultHandler = handler;
    }

    async execute(input: string) {
        if (!input) return;

        // Check if it's a slash command
        if (input.startsWith('/')) {
            const [name, ...args] = input.split(' ');
            const commandName = name.substring(1).toLowerCase(); // Remove /
            const command = this.commands.get(commandName);

            if (command) {
                await command.run(args);
                return;
            } else {
                Renderer.error(`Comando desconhecido: ${name}. Use /help para ver comandos.`);
                return;
            }
        }

        // Default: treat as chat/ask
        if (this.defaultHandler) {
            await this.defaultHandler(input);
        } else {
            Renderer.info('Digite /help para ver comandos disponíveis.');
        }
    }

    listCommands(): CLICommand[] {
        return Array.from(this.commands.values());
    }
}

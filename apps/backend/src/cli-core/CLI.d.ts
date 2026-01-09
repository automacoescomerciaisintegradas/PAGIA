/**
 * PAGIA CLI Command Registry
 * Registro e execução de comandos
 */
import { CLICommand } from './types.js';
export declare class CLI {
    private commands;
    private defaultHandler?;
    register(command: CLICommand): void;
    setDefaultHandler(handler: (input: string) => Promise<void>): void;
    execute(input: string): Promise<void>;
    listCommands(): CLICommand[];
}
//# sourceMappingURL=CLI.d.ts.map
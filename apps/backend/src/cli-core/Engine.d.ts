/**
 * PAGIA CLI Engine
 * Loop principal da CLI - comportamento 100% padrão de terminal
 *
 * @author Automações Comerciais Integradas
 */
export declare class Engine {
    private rl;
    private onCommand;
    private promptPrefix;
    constructor(onCommand: (input: string) => Promise<void>, promptPrefix?: string);
    start(): void;
    private renderPrompt;
    private safeExecute;
}
//# sourceMappingURL=Engine.d.ts.map
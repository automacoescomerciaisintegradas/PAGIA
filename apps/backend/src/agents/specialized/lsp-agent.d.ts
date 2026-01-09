import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
export declare class LSPAgent extends BaseAgent {
    readonly name = "LSP Agent";
    readonly role = "Especialista em Language Server Protocol e Navega\u00E7\u00E3o de C\u00F3digo";
    readonly description = "Agente especializado em funcionalidades LSP como go-to-definition, find-references e hover-documentation";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    readonly module = "lsp";
    execute(input: AgentInput): Promise<AgentOutput>;
    private parseCommand;
    private formatResult;
    private handleGoToDefinition;
    private handleFindReferences;
    private handleHoverInfo;
    private handleAnalyzeDependencies;
}
export declare const lspAgent: LSPAgent;
//# sourceMappingURL=lsp-agent.d.ts.map
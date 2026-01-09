/**
 * PAGIA - Debugger Agent
 * Agente Especializado em Depuração de Erros
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/debugger-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * DebuggerAgent - Especialista em depuração de erros
 */
export declare class DebuggerAgent extends BaseAgent {
    readonly name = "Debugger";
    readonly role = "Especialista em Depura\u00E7\u00E3o de Erros";
    readonly description = "Agente especializado em an\u00E1lise de causas raiz de erros, falhas em testes e comportamentos inesperados. Usa proativamente quando encontrar qualquer problema t\u00E9cnico.";
    readonly module = "debugging";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
    private generateSampleFix;
    private formatStackTrace;
    private generateProblematicCode;
    private generateFixedCode;
}
export declare const debuggerAgent: DebuggerAgent;
//# sourceMappingURL=debugger-agent.d.ts.map
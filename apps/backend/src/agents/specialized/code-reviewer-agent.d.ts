/**
 * PAGIA - Code Reviewer Agent
 * Agente Especializado em Revisão de Código
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/code-reviewer-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * CodeReviewerAgent - Especialista em revisão de código
 */
export declare class CodeReviewerAgent extends BaseAgent {
    readonly name = "Code Reviewer";
    readonly role = "Senior Code Reviewer";
    readonly description = "Agente especializado em revis\u00E3o de c\u00F3digo com foco em qualidade, seguran\u00E7a e melhores pr\u00E1ticas. Analisa c\u00F3digo para identificar problemas, sugerir melhorias e garantir padr\u00F5es consistentes.";
    readonly module = "code-quality";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const codeReviewerAgent: CodeReviewerAgent;
//# sourceMappingURL=code-reviewer-agent.d.ts.map
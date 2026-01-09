/**
 * PAGIA - Data Scientist Agent
 * Agente Especializado em Ciência de Dados
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/data-scientist-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * DataScientistAgent - Especialista em ciência de dados
 */
export declare class DataScientistAgent extends BaseAgent {
    readonly name = "Data Scientist";
    readonly role = "Especialista em An\u00E1lise de Dados";
    readonly description = "Agente especializado em an\u00E1lise de dados, consultas SQL e opera\u00E7\u00F5es no BigQuery. Usa proativamente para tarefas e consultas de an\u00E1lise de dados.";
    readonly module = "data-science";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
    private generateSQLQuery;
    private getTableName;
    private generateSampleQuery;
    private generateOptimizedQuery;
}
export declare const dataScientistAgent: DataScientistAgent;
//# sourceMappingURL=data-scientist-agent.d.ts.map
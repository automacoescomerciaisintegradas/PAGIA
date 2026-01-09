/**
 * PAGIA - Setup BMAD Agents
 * Script para inicializar os agentes BMAD no projeto
 *
 * @module scripts/setup-bmad-agents
 * @author Automações Comerciais Integradas
 */
declare const BMAD_AGENTS: {
    id: string;
    name: string;
    role: string;
    description: string;
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
}[];
/**
 * Instala os agentes BMAD no projeto
 */
export declare function setupBMADAgents(): Promise<void>;
export { BMAD_AGENTS };
//# sourceMappingURL=setup-bmad-agents.d.ts.map
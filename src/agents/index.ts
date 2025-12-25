/**
 * PAGIA - Agents Index
 * Exportações do módulo de agentes
 * 
 * @module agents
 * @author Automações Comerciais Integradas
 */

// Base
export { BaseAgent, AgentInput, AgentOutput, SuggestedAction } from './base-agent.js';
export { AgentRegistry, agentRegistry } from './agent-registry.js';
export { AgentComposer, agentComposer, ComposedAgent, CompositionStrategy } from './agent-composer.js';

// Agentes Especializados
export { CodeOptimizerAgent, codeOptimizerAgent } from './specialized/code-optimizer.js';
export { PlannerAgent, plannerAgent } from './specialized/planner-agent.js';
export { TesterAgent, testerAgent } from './specialized/tester-agent.js';
export { ConductorAgent, conductorAgent } from './specialized/conductor-agent.js';

// Integração com Inngest AgentKit
export { InngestAdapter, inngestAdapter } from './inngest-adapter.js';
export { PAGIANetwork, pagiaNetwork } from './inngest-network.js';


/**
 * PAGIA - Agent Registry
 * Registro centralizado de agentes
 *
 * @module agents/agent-registry
 * @author Automações Comerciais Integradas
 */
import { eventBus, PAGIAEvents } from '../core/event-bus.js';
/**
 * Classe AgentRegistry - Registro centralizado de agentes
 */
export class AgentRegistry {
    static instance;
    agents = new Map();
    constructor() { }
    /**
     * Obtém a instância singleton do AgentRegistry
     */
    static getInstance() {
        if (!AgentRegistry.instance) {
            AgentRegistry.instance = new AgentRegistry();
        }
        return AgentRegistry.instance;
    }
    /**
     * Registra um agente
     */
    async register(agent, tags = []) {
        const entry = {
            agent,
            registeredAt: new Date(),
            enabled: true,
            tags: tags.map((t) => t.toLowerCase()),
        };
        this.agents.set(agent.id, entry);
        await eventBus.emit(PAGIAEvents.AGENT_REGISTERED, {
            agentId: agent.id,
            agentName: agent.name,
            module: agent.module,
        });
    }
    /**
     * Remove registro de um agente
     */
    async unregister(agentId) {
        const entry = this.agents.get(agentId);
        if (!entry) {
            return false;
        }
        this.agents.delete(agentId);
        await eventBus.emit(PAGIAEvents.AGENT_UNREGISTERED, {
            agentId,
            agentName: entry.agent.name,
        });
        return true;
    }
    /**
     * Obtém um agente pelo ID
     */
    get(agentId) {
        return this.agents.get(agentId)?.agent;
    }
    /**
     * Obtém um agente pelo nome
     */
    getByName(name) {
        const lowerName = name.toLowerCase();
        for (const entry of this.agents.values()) {
            if (entry.agent.name.toLowerCase() === lowerName) {
                return entry.agent;
            }
        }
        return undefined;
    }
    /**
     * Lista todos os agentes registrados
     */
    list(options) {
        let agents = Array.from(this.agents.values());
        if (options?.enabled !== undefined) {
            agents = agents.filter((e) => e.enabled === options.enabled);
        }
        if (options?.module) {
            agents = agents.filter((e) => e.agent.module === options.module);
        }
        return agents.map((e) => e.agent);
    }
    /**
     * Busca agentes por capacidade
     */
    findByCapability(capability) {
        const lowerCapability = capability.toLowerCase();
        return Array.from(this.agents.values())
            .filter((e) => e.enabled && e.agent.hasCapability(lowerCapability))
            .map((e) => e.agent);
    }
    /**
     * Busca agentes por tag
     */
    findByTag(tag) {
        const lowerTag = tag.toLowerCase();
        return Array.from(this.agents.values())
            .filter((e) => e.enabled && e.tags.includes(lowerTag))
            .map((e) => e.agent);
    }
    /**
     * Busca agentes por módulo
     */
    findByModule(module) {
        return Array.from(this.agents.values())
            .filter((e) => e.agent.module === module)
            .map((e) => e.agent);
    }
    /**
     * Busca agentes por papel (role)
     */
    findByRole(role) {
        const lowerRole = role.toLowerCase();
        return Array.from(this.agents.values())
            .filter((e) => e.enabled && e.agent.role.toLowerCase().includes(lowerRole))
            .map((e) => e.agent);
    }
    /**
     * Busca avançada de agentes
     */
    search(query) {
        let results = Array.from(this.agents.values());
        if (query.enabled !== undefined) {
            results = results.filter((e) => e.enabled === query.enabled);
        }
        if (query.name) {
            const lowerName = query.name.toLowerCase();
            results = results.filter((e) => e.agent.name.toLowerCase().includes(lowerName));
        }
        if (query.role) {
            const lowerRole = query.role.toLowerCase();
            results = results.filter((e) => e.agent.role.toLowerCase().includes(lowerRole));
        }
        if (query.module) {
            results = results.filter((e) => e.agent.module === query.module);
        }
        if (query.capabilities && query.capabilities.length > 0) {
            const lowerCaps = query.capabilities.map((c) => c.toLowerCase());
            results = results.filter((e) => lowerCaps.some((cap) => e.agent.hasCapability(cap)));
        }
        if (query.tags && query.tags.length > 0) {
            const lowerTags = query.tags.map((t) => t.toLowerCase());
            results = results.filter((e) => lowerTags.some((tag) => e.tags.includes(tag)));
        }
        return results.map((e) => e.agent);
    }
    /**
     * Habilita um agente
     */
    enable(agentId) {
        const entry = this.agents.get(agentId);
        if (!entry) {
            return false;
        }
        entry.enabled = true;
        return true;
    }
    /**
     * Desabilita um agente
     */
    disable(agentId) {
        const entry = this.agents.get(agentId);
        if (!entry) {
            return false;
        }
        entry.enabled = false;
        return true;
    }
    /**
     * Verifica se um agente está registrado
     */
    has(agentId) {
        return this.agents.has(agentId);
    }
    /**
     * Verifica se um agente está habilitado
     */
    isEnabled(agentId) {
        return this.agents.get(agentId)?.enabled ?? false;
    }
    /**
     * Adiciona tags a um agente
     */
    addTags(agentId, tags) {
        const entry = this.agents.get(agentId);
        if (!entry) {
            return false;
        }
        const newTags = tags.map((t) => t.toLowerCase());
        entry.tags = [...new Set([...entry.tags, ...newTags])];
        return true;
    }
    /**
     * Remove tags de um agente
     */
    removeTags(agentId, tags) {
        const entry = this.agents.get(agentId);
        if (!entry) {
            return false;
        }
        const tagsToRemove = tags.map((t) => t.toLowerCase());
        entry.tags = entry.tags.filter((t) => !tagsToRemove.includes(t));
        return true;
    }
    /**
     * Obtém número de agentes registrados
     */
    count(enabledOnly = false) {
        if (enabledOnly) {
            return Array.from(this.agents.values()).filter((e) => e.enabled).length;
        }
        return this.agents.size;
    }
    /**
     * Obtém estatísticas do registro
     */
    getStats() {
        const entries = Array.from(this.agents.values());
        const byModule = {};
        for (const entry of entries) {
            const module = entry.agent.module;
            byModule[module] = (byModule[module] || 0) + 1;
        }
        return {
            total: entries.length,
            enabled: entries.filter((e) => e.enabled).length,
            disabled: entries.filter((e) => !e.enabled).length,
            byModule,
        };
    }
    /**
     * Limpa o registro
     */
    clear() {
        this.agents.clear();
    }
    /**
     * Exporta agentes para JSON
     */
    toJSON() {
        return Array.from(this.agents.values()).map((entry) => ({
            ...entry.agent.toJSON(),
            registeredAt: entry.registeredAt.toISOString(),
            enabled: entry.enabled,
            tags: entry.tags,
        }));
    }
}
// Singleton exportado
export const agentRegistry = AgentRegistry.getInstance();
//# sourceMappingURL=agent-registry.js.map
/**
 * PAGIA - Web Bundler
 * Sistema de empacotamento de agentes para uso web
 * 
 * @module bundler/web-bundler
 * @author Automações Comerciais Integradas
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import Handlebars from 'handlebars';
import { ensureDir } from '../utils/file-utils.js';
import { BaseAgent } from '../agents/base-agent.js';
import { agentRegistry } from '../agents/agent-registry.js';

export type BundlePlatform = 'chatgpt' | 'claude' | 'gemini' | 'generic';

export interface Bundle {
    id: string;
    name: string;
    platform: BundlePlatform;
    agents: AgentBundle[];
    content: string;
    metadata: BundleMetadata;
    createdAt: Date;
}

export interface AgentBundle {
    id: string;
    name: string;
    role: string;
    content: string;
}

export interface BundleMetadata {
    version: string;
    author: string;
    description: string;
    tags: string[];
    tokenEstimate: number;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    tokenCount: number;
}

export interface BundleOptions {
    name?: string;
    version?: string;
    author?: string;
    description?: string;
    includeInstructions?: boolean;
    includeMenu?: boolean;
    format?: 'markdown' | 'xml' | 'yaml';
    maxTokens?: number;
}

const PLATFORM_LIMITS: Record<BundlePlatform, number> = {
    chatgpt: 8000,    // Custom GPT instructions limit
    claude: 16000,    // Claude project context
    gemini: 32000,    // Gemini context
    generic: 6000,    // Conservative default
};

/**
 * Classe WebBundler - Empacotamento de agentes
 */
export class WebBundler {
    private static instance: WebBundler;
    private templates: Map<string, Handlebars.TemplateDelegate> = new Map();
    private templatesPath: string;

    private constructor() {
        this.templatesPath = '';
        this.registerDefaultTemplates();
    }

    /**
     * Obtém instância singleton
     */
    static getInstance(): WebBundler {
        if (!WebBundler.instance) {
            WebBundler.instance = new WebBundler();
        }
        return WebBundler.instance;
    }

    /**
     * Registra templates padrão embutidos
     */
    private registerDefaultTemplates(): void {
        // Template ChatGPT
        this.templates.set('chatgpt', Handlebars.compile(`
# {{name}}

{{#if description}}
{{description}}

{{/if}}
## Agentes Disponíveis

{{#each agents}}
### {{name}}
**Papel:** {{role}}

{{content}}

{{/each}}

---
*Gerado pelo PAGIA v{{version}}*
    `.trim()));

        // Template Claude
        this.templates.set('claude', Handlebars.compile(`
<pagia_bundle name="{{name}}" version="{{version}}">
{{#if description}}
<description>{{description}}</description>
{{/if}}

{{#each agents}}
<agent name="{{name}}" role="{{role}}">
{{content}}
</agent>

{{/each}}
</pagia_bundle>
    `.trim()));

        // Template Gemini
        this.templates.set('gemini', Handlebars.compile(`
# Sistema: {{name}}

{{#if description}}
> {{description}}

{{/if}}
## Configuração de Agentes

{{#each agents}}
---
### Agente: {{name}}
Papel: {{role}}

{{content}}

{{/each}}

## Metadados
- Versão: {{version}}
- Autor: {{author}}
- Gerado em: {{generatedAt}}
    `.trim()));

        // Template Genérico
        this.templates.set('generic', Handlebars.compile(`
# {{name}}

{{#if description}}
{{description}}

{{/if}}
{{#each agents}}
## {{name}}

**Função:** {{role}}

{{content}}

---

{{/each}}
    `.trim()));
    }

    /**
     * Carrega template de arquivo
     */
    loadTemplate(platform: string, filePath: string): void {
        if (!existsSync(filePath)) {
            throw new Error(`Template não encontrado: ${filePath}`);
        }

        const content = readFileSync(filePath, 'utf-8');
        this.templates.set(platform, Handlebars.compile(content));
    }

    /**
     * Empacota agentes para uma plataforma
     */
    async bundle(
        agents: BaseAgent[],
        platform: BundlePlatform,
        options: BundleOptions = {}
    ): Promise<Bundle> {
        const template = this.templates.get(platform);

        if (!template) {
            throw new Error(`Plataforma não suportada: ${platform}`);
        }

        // Preparar dados dos agentes
        const agentBundles: AgentBundle[] = agents.map((agent) => ({
            id: agent.id,
            name: agent.name,
            role: agent.role,
            content: this.formatAgentContent(agent, options),
        }));

        // Renderizar template
        const content = template({
            name: options.name || 'PAGIA Bundle',
            version: options.version || '1.0.0',
            author: options.author || 'PAGIA',
            description: options.description || '',
            agents: agentBundles,
            generatedAt: new Date().toISOString(),
        });

        // Calcular tokens
        const tokenEstimate = this.estimateTokens(content);

        const bundle: Bundle = {
            id: `bundle-${Date.now()}`,
            name: options.name || 'PAGIA Bundle',
            platform,
            agents: agentBundles,
            content,
            metadata: {
                version: options.version || '1.0.0',
                author: options.author || 'PAGIA',
                description: options.description || '',
                tags: [],
                tokenEstimate,
            },
            createdAt: new Date(),
        };

        return bundle;
    }

    /**
     * Empacota agentes por IDs
     */
    async bundleByIds(
        agentIds: string[],
        platform: BundlePlatform,
        options: BundleOptions = {}
    ): Promise<Bundle> {
        const agents: BaseAgent[] = [];

        for (const id of agentIds) {
            const agent = agentRegistry.get(id);
            if (agent) {
                agents.push(agent);
            }
        }

        if (agents.length === 0) {
            throw new Error('Nenhum agente encontrado');
        }

        return this.bundle(agents, platform, options);
    }

    /**
     * Formata conteúdo de um agente
     */
    private formatAgentContent(agent: BaseAgent, options: BundleOptions): string {
        let content = '';

        // Descrição
        if (agent.description) {
            content += agent.description + '\n\n';
        }

        // Capacidades
        const capabilities = agent.getCapabilities();
        if (capabilities.length > 0) {
            content += '**Capacidades:**\n';
            content += capabilities.map((c) => `- ${c}`).join('\n');
            content += '\n\n';
        }

        // Instruções
        if (options.includeInstructions !== false && agent.instructions) {
            content += '**Instruções:**\n';
            content += agent.instructions + '\n\n';
        }

        // Menu
        if (options.includeMenu !== false && agent.menu.length > 0) {
            content += '**Comandos:**\n';
            content += agent.menu.map((m) => `- \`${m.trigger}\`: ${m.description}`).join('\n');
            content += '\n';
        }

        return content.trim();
    }

    /**
     * Valida um bundle
     */
    validate(bundle: Bundle): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const tokenCount = this.estimateTokens(bundle.content);
        const limit = PLATFORM_LIMITS[bundle.platform];

        // Verificar limite de tokens
        if (tokenCount > limit) {
            errors.push(`Bundle excede limite de tokens da plataforma (${tokenCount}/${limit})`);
        } else if (tokenCount > limit * 0.9) {
            warnings.push(`Bundle está próximo do limite de tokens (${tokenCount}/${limit})`);
        }

        // Verificar agentes vazios
        for (const agent of bundle.agents) {
            if (!agent.content || agent.content.trim().length === 0) {
                warnings.push(`Agente "${agent.name}" não tem conteúdo`);
            }
        }

        // Verificar metadados
        if (!bundle.name) {
            warnings.push('Bundle sem nome definido');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            tokenCount,
        };
    }

    /**
     * Exporta bundle para arquivo
     */
    async export(bundle: Bundle, outputPath: string): Promise<void> {
        ensureDir(dirname(outputPath));
        writeFileSync(outputPath, bundle.content, 'utf-8');
    }

    /**
     * Exporta bundle com metadados (JSON)
     */
    async exportWithMetadata(bundle: Bundle, outputPath: string): Promise<void> {
        ensureDir(dirname(outputPath));
        writeFileSync(outputPath, JSON.stringify(bundle, null, 2), 'utf-8');
    }

    /**
     * Carrega bundle de arquivo JSON
     */
    load(filePath: string): Bundle {
        if (!existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filePath}`);
        }

        const content = readFileSync(filePath, 'utf-8');
        return JSON.parse(content) as Bundle;
    }

    /**
     * Estima número de tokens
     */
    private estimateTokens(content: string): number {
        // Estimativa: ~4 caracteres por token
        return Math.ceil(content.length / 4);
    }

    /**
     * Obtém limite de tokens para plataforma
     */
    getTokenLimit(platform: BundlePlatform): number {
        return PLATFORM_LIMITS[platform];
    }

    /**
     * Lista plataformas suportadas
     */
    getSupportedPlatforms(): BundlePlatform[] {
        return ['chatgpt', 'claude', 'gemini', 'generic'];
    }

    /**
     * Define caminho de templates
     */
    setTemplatesPath(path: string): void {
        this.templatesPath = path;
    }

    /**
     * Carrega todos os templates de um diretório
     */
    loadTemplatesFromDir(dirPath: string): void {
        if (!existsSync(dirPath)) {
            return;
        }

        const files = ['chatgpt.hbs', 'claude.hbs', 'gemini.hbs', 'generic.hbs'];

        for (const file of files) {
            const filePath = join(dirPath, file);
            if (existsSync(filePath)) {
                const platform = file.replace('.hbs', '');
                this.loadTemplate(platform, filePath);
            }
        }
    }
}

// Singleton exportado
export const webBundler = WebBundler.getInstance();

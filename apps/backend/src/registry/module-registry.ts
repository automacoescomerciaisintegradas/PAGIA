/**
 * PAGIA - Module Registry
 * Repositório de módulos da comunidade
 * 
 * @module registry/module-registry
 * @author Automações Comerciais Integradas
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { ensureDir, readFile, writeFile, fileExists, removeDir, listDirs } from '../utils/file-utils.js';
import { eventBus } from '../core/event-bus.js';

export interface ModuleManifest {
    code: string;
    name: string;
    description: string;
    version: string;
    author: string;
    license: string;
    repository?: string;
    homepage?: string;
    keywords: string[];
    dependencies: string[];
    peerDependencies?: Record<string, string>;
    pagia: {
        minVersion: string;
        type: ModuleType;
        agents?: string[];
        commands?: string[];
        mcpTools?: string[];
    };
}

export type ModuleType = 'plan' | 'agent' | 'workflow' | 'tool' | 'integration';

export interface InstalledModule {
    manifest: ModuleManifest;
    path: string;
    installedAt: Date;
    updatedAt: Date;
    enabled: boolean;
}

export interface RegistryEntry {
    code: string;
    name: string;
    description: string;
    version: string;
    author: string;
    downloads: number;
    rating: number;
    type: ModuleType;
    repository: string;
    keywords: string[];
    publishedAt: Date;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Classe ModuleRegistry - Registro de módulos
 */
export class ModuleRegistry {
    private static instance: ModuleRegistry;
    private registryUrl: string;
    private modulesPath: string;
    private installed: Map<string, InstalledModule> = new Map();
    private registryCache: RegistryEntry[] = [];

    private constructor() {
        this.registryUrl = 'https://registry.pagia.dev/api/v1';
        this.modulesPath = '';
    }

    /**
     * Obtém instância singleton
     */
    static getInstance(): ModuleRegistry {
        if (!ModuleRegistry.instance) {
            ModuleRegistry.instance = new ModuleRegistry();
        }
        return ModuleRegistry.instance;
    }

    /**
     * Define caminho dos módulos
     */
    setModulesPath(path: string): void {
        this.modulesPath = resolve(path);
        ensureDir(this.modulesPath);
        this.loadInstalled();
    }

    /**
     * Define URL do registro
     */
    setRegistryUrl(url: string): void {
        this.registryUrl = url;
    }

    /**
     * Carrega módulos instalados
     */
    private loadInstalled(): void {
        const installedPath = join(this.modulesPath, 'installed.json');

        if (!fileExists(installedPath)) {
            return;
        }

        try {
            const data = JSON.parse(readFile(installedPath)) as InstalledModule[];

            for (const mod of data) {
                this.installed.set(mod.manifest.code, {
                    ...mod,
                    installedAt: new Date(mod.installedAt),
                    updatedAt: new Date(mod.updatedAt),
                });
            }
        } catch {
            // Ignorar erros
        }
    }

    /**
     * Salva módulos instalados
     */
    private saveInstalled(): void {
        const installedPath = join(this.modulesPath, 'installed.json');
        const data = Array.from(this.installed.values());
        writeFile(installedPath, JSON.stringify(data, null, 2));
    }

    /**
     * Busca módulos no registro
     */
    async search(query: string, options?: {
        type?: ModuleType;
        author?: string;
        limit?: number;
    }): Promise<RegistryEntry[]> {
        // Por enquanto, busca local (quando tiver servidor, faz fetch)
        try {
            const response = await fetch(`${this.registryUrl}/modules?q=${encodeURIComponent(query)}`);

            if (response.ok) {
                const data = await response.json() as { modules: RegistryEntry[] };
                this.registryCache = data.modules;
                return data.modules;
            }
        } catch {
            // Fallback para cache local
        }

        // Filtrar cache
        return this.registryCache.filter((m) => {
            const matchQuery = m.name.toLowerCase().includes(query.toLowerCase()) ||
                m.description.toLowerCase().includes(query.toLowerCase()) ||
                m.keywords.some((k: string) => k.toLowerCase().includes(query.toLowerCase()));

            const matchType = !options?.type || m.type === options.type;
            const matchAuthor = !options?.author || m.author === options.author;

            return matchQuery && matchType && matchAuthor;
        }).slice(0, options?.limit || 20);
    }

    /**
     * Instala um módulo
     */
    async install(moduleCode: string, options?: {
        version?: string;
        source?: string;
    }): Promise<InstalledModule> {
        if (this.installed.has(moduleCode)) {
            throw new Error(`Módulo já instalado: ${moduleCode}`);
        }

        const modulePath = join(this.modulesPath, moduleCode);
        ensureDir(modulePath);

        let manifest: ModuleManifest;

        // Se fonte for local
        if (options?.source && existsSync(options.source)) {
            manifest = await this.installFromLocal(options.source, modulePath);
        } else if (options?.source?.startsWith('http')) {
            manifest = await this.installFromUrl(options.source, modulePath);
        } else {
            manifest = await this.installFromRegistry(moduleCode, options?.version, modulePath);
        }

        const installed: InstalledModule = {
            manifest,
            path: modulePath,
            installedAt: new Date(),
            updatedAt: new Date(),
            enabled: true,
        };

        this.installed.set(moduleCode, installed);
        this.saveInstalled();

        await eventBus.emit('module:installed', { moduleCode, manifest });

        return installed;
    }

    /**
     * Instala de diretório local
     */
    private async installFromLocal(source: string, targetPath: string): Promise<ModuleManifest> {
        const manifestPath = join(source, 'module.yaml');

        if (!fileExists(manifestPath)) {
            throw new Error(`Manifesto não encontrado: ${manifestPath}`);
        }

        const manifest = parseYaml(readFile(manifestPath)) as ModuleManifest;

        // Validar
        const validation = this.validate(source);
        if (!validation.valid) {
            throw new Error(`Módulo inválido: ${validation.errors.join(', ')}`);
        }

        // Copiar arquivos
        const { cpSync } = await import('fs');
        cpSync(source, targetPath, { recursive: true });

        return manifest;
    }

    /**
     * Instala de URL
     */
    private async installFromUrl(url: string, targetPath: string): Promise<ModuleManifest> {
        // Clonar repositório ou baixar arquivo
        if (url.includes('github.com')) {
            // Usar git clone
            const { execSync } = await import('child_process');
            execSync(`git clone ${url} ${targetPath}`, { stdio: 'ignore' });
        } else {
            // Baixar e extrair
            throw new Error('Download direto ainda não implementado');
        }

        const manifestPath = join(targetPath, 'module.yaml');

        if (!fileExists(manifestPath)) {
            throw new Error('Manifesto não encontrado no repositório');
        }

        return parseYaml(readFile(manifestPath)) as ModuleManifest;
    }

    /**
     * Instala do registro
     */
    private async installFromRegistry(
        moduleCode: string,
        version?: string,
        targetPath?: string
    ): Promise<ModuleManifest> {
        const response = await fetch(`${this.registryUrl}/modules/${moduleCode}${version ? `@${version}` : ''}`);

        if (!response.ok) {
            throw new Error(`Módulo não encontrado no registro: ${moduleCode}`);
        }

        const data = await response.json() as { manifest: ModuleManifest; downloadUrl: string };

        // Baixar e instalar
        return this.installFromUrl(data.downloadUrl, targetPath!);
    }

    /**
     * Desinstala um módulo
     */
    async uninstall(moduleCode: string): Promise<boolean> {
        const installed = this.installed.get(moduleCode);

        if (!installed) {
            return false;
        }

        // Remover diretório
        removeDir(installed.path);

        this.installed.delete(moduleCode);
        this.saveInstalled();

        await eventBus.emit('module:uninstalled', { moduleCode });

        return true;
    }

    /**
     * Atualiza um módulo
     */
    async update(moduleCode: string, version?: string): Promise<InstalledModule | null> {
        const installed = this.installed.get(moduleCode);

        if (!installed) {
            return null;
        }

        // Desinstalar e reinstalar
        await this.uninstall(moduleCode);
        return this.install(moduleCode, { version });
    }

    /**
     * Lista módulos instalados
     */
    listInstalled(options?: { enabled?: boolean; type?: ModuleType }): InstalledModule[] {
        let modules = Array.from(this.installed.values());

        if (options?.enabled !== undefined) {
            modules = modules.filter((m) => m.enabled === options.enabled);
        }

        if (options?.type) {
            modules = modules.filter((m) => m.manifest.pagia.type === options.type);
        }

        return modules;
    }

    /**
     * Obtém módulo instalado
     */
    getInstalled(moduleCode: string): InstalledModule | undefined {
        return this.installed.get(moduleCode);
    }

    /**
     * Verifica se módulo está instalado
     */
    isInstalled(moduleCode: string): boolean {
        return this.installed.has(moduleCode);
    }

    /**
     * Habilita módulo
     */
    enable(moduleCode: string): boolean {
        const installed = this.installed.get(moduleCode);

        if (!installed) {
            return false;
        }

        installed.enabled = true;
        this.saveInstalled();

        return true;
    }

    /**
     * Desabilita módulo
     */
    disable(moduleCode: string): boolean {
        const installed = this.installed.get(moduleCode);

        if (!installed) {
            return false;
        }

        installed.enabled = false;
        this.saveInstalled();

        return true;
    }

    /**
     * Valida um módulo
     */
    validate(modulePath: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Verificar manifesto
        const manifestPath = join(modulePath, 'module.yaml');

        if (!fileExists(manifestPath)) {
            errors.push('Manifesto module.yaml não encontrado');
            return { valid: false, errors, warnings };
        }

        try {
            const manifest = parseYaml(readFile(manifestPath)) as ModuleManifest;

            // Campos obrigatórios
            if (!manifest.code) errors.push('Campo "code" obrigatório');
            if (!manifest.name) errors.push('Campo "name" obrigatório');
            if (!manifest.version) errors.push('Campo "version" obrigatório');
            if (!manifest.pagia) errors.push('Campo "pagia" obrigatório');

            // Validar formato do código
            if (manifest.code && !/^[a-z0-9-]+$/.test(manifest.code)) {
                errors.push('Código deve conter apenas letras minúsculas, números e hífens');
            }

            // Validar versão semântica
            if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
                warnings.push('Versão deve seguir semver (ex: 1.0.0)');
            }

            // Verificar estrutura mínima
            if (manifest.pagia?.agents && manifest.pagia.agents.length > 0) {
                for (const agentFile of manifest.pagia.agents) {
                    const agentPath = join(modulePath, agentFile);
                    if (!fileExists(agentPath)) {
                        errors.push(`Agente não encontrado: ${agentFile}`);
                    }
                }
            }
        } catch (error) {
            errors.push(`Erro ao parsear manifesto: ${error}`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Publica módulo no registro
     */
    async publish(modulePath: string): Promise<{ success: boolean; message: string }> {
        const validation = this.validate(modulePath);

        if (!validation.valid) {
            return {
                success: false,
                message: `Validação falhou: ${validation.errors.join(', ')}`,
            };
        }

        const manifestPath = join(modulePath, 'module.yaml');
        const manifest = parseYaml(readFile(manifestPath)) as ModuleManifest;

        try {
            const response = await fetch(`${this.registryUrl}/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ manifest, path: modulePath }),
            });

            if (response.ok) {
                return { success: true, message: `Módulo ${manifest.code}@${manifest.version} publicado com sucesso!` };
            }

            const error = await response.text();
            return { success: false, message: error };
        } catch (error) {
            return {
                success: false,
                message: `Erro ao publicar: ${error}. Verifique sua conexão ou use publicação local.`,
            };
        }
    }

    /**
     * Cria scaffold de módulo
     */
    async scaffold(
        moduleCode: string,
        type: ModuleType,
        outputPath: string
    ): Promise<string> {
        const modulePath = join(outputPath, moduleCode);
        ensureDir(modulePath);

        // Criar manifesto
        const manifest: ModuleManifest = {
            code: moduleCode,
            name: moduleCode.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            description: `Módulo PAGIA: ${moduleCode}`,
            version: '1.0.0',
            author: '',
            license: 'MIT',
            keywords: [type, 'pagia'],
            dependencies: [],
            pagia: {
                minVersion: '1.0.0',
                type,
                agents: type === 'agent' ? ['agent.ts'] : undefined,
                commands: type === 'tool' ? ['command.ts'] : undefined,
            },
        };

        writeFile(join(modulePath, 'module.yaml'), stringifyYaml(manifest));

        // Criar README
        writeFile(join(modulePath, 'README.md'), `# ${manifest.name}

${manifest.description}

## Instalação

\`\`\`bash
pagia registry install ${moduleCode}
\`\`\`

## Uso

...

## Licença

${manifest.license}
`);

        // Criar arquivo base conforme tipo
        if (type === 'agent') {
            ensureDir(join(modulePath, 'src'));
            writeFile(join(modulePath, 'agent.ts'), `import { BaseAgent, AgentInput, AgentOutput } from 'pagia/agents';

export class ${manifest.name.replace(/\s/g, '')}Agent extends BaseAgent {
  readonly name = '${manifest.name}';
  readonly role = 'Agente customizado';
  readonly description = '${manifest.description}';
  readonly module = '${moduleCode}';

  capabilities = [];

  async execute(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();

    // Implementar lógica do agente

    return this.createOutput('Resposta do agente', undefined, startTime);
  }
}

export const ${moduleCode.replace(/-/g, '')}Agent = new ${manifest.name.replace(/\s/g, '')}Agent();
`);
        }

        return modulePath;
    }
}

// Singleton exportado
export const moduleRegistry = ModuleRegistry.getInstance();

/**
 * PAGIA - Module Loader
 * Carregamento dinâmico de módulos
 * 
 * @module core/module-loader
 * @author Automações Comerciais Integradas
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import { eventBus, PAGIAEvents } from './event-bus.js';
import type { Module, ModuleManifest, ModuleConfig } from '../types/index.js';

interface LoadedModule {
    manifest: ModuleManifest;
    path: string;
    loaded: boolean;
    error?: string;
}

/**
 * Classe ModuleLoader - Carregamento dinâmico de módulos PAGIA
 */
export class ModuleLoader {
    private static instance: ModuleLoader;
    private modules: Map<string, LoadedModule> = new Map();
    private modulesPath: string = '';

    private constructor() { }

    /**
     * Obtém a instância singleton do ModuleLoader
     */
    static getInstance(): ModuleLoader {
        if (!ModuleLoader.instance) {
            ModuleLoader.instance = new ModuleLoader();
        }
        return ModuleLoader.instance;
    }

    /**
     * Define o caminho base para os módulos
     * @param path Caminho para a pasta de módulos
     */
    setModulesPath(path: string): void {
        this.modulesPath = resolve(path);
    }

    /**
     * Descobre todos os módulos disponíveis
     * @param searchPaths Caminhos adicionais para buscar módulos
     */
    async discover(searchPaths: string[] = []): Promise<ModuleManifest[]> {
        const manifests: ModuleManifest[] = [];
        const paths = [this.modulesPath, ...searchPaths].filter((p) => p && existsSync(p));

        for (const basePath of paths) {
            try {
                const dirs = readdirSync(basePath, { withFileTypes: true })
                    .filter((d) => d.isDirectory())
                    .map((d) => d.name);

                for (const dir of dirs) {
                    const modulePath = join(basePath, dir);
                    const manifest = this.loadManifest(modulePath);

                    if (manifest) {
                        manifests.push(manifest);
                    }
                }
            } catch (error) {
                console.error(`Erro ao descobrir módulos em ${basePath}:`, error);
            }
        }

        return manifests;
    }

    /**
     * Carrega o manifesto de um módulo
     * @param modulePath Caminho para o módulo
     */
    private loadManifest(modulePath: string): ModuleManifest | null {
        const configFiles = ['config.yaml', 'config.yml', 'module.yaml', 'module.yml'];

        for (const file of configFiles) {
            const filePath = join(modulePath, file);
            if (existsSync(filePath)) {
                try {
                    const content = readFileSync(filePath, 'utf-8');
                    const parsed = parseYaml(content) as ModuleManifest;

                    // Validar campos obrigatórios
                    if (!parsed.code || !parsed.name) {
                        console.warn(`Manifesto inválido em ${modulePath}: falta code ou name`);
                        continue;
                    }

                    return {
                        code: parsed.code,
                        name: parsed.name,
                        description: parsed.description || '',
                        version: parsed.version || '1.0.0',
                        dependencies: parsed.dependencies || [],
                        configSchema: parsed.configSchema || {},
                    };
                } catch (error) {
                    console.error(`Erro ao carregar manifesto de ${modulePath}:`, error);
                }
            }
        }

        return null;
    }

    /**
     * Carrega um módulo pelo ID
     * @param moduleId ID do módulo
     */
    async load(moduleId: string): Promise<LoadedModule | null> {
        // Verificar se já está carregado
        if (this.modules.has(moduleId)) {
            const existing = this.modules.get(moduleId)!;
            if (existing.loaded) {
                return existing;
            }
        }

        // Procurar módulo
        const modulePath = join(this.modulesPath, moduleId);

        if (!existsSync(modulePath)) {
            console.error(`Módulo não encontrado: ${moduleId}`);
            return null;
        }

        const manifest = this.loadManifest(modulePath);

        if (!manifest) {
            console.error(`Manifesto inválido para módulo: ${moduleId}`);
            return null;
        }

        // Resolver dependências
        for (const dep of manifest.dependencies) {
            if (!this.modules.has(dep)) {
                await this.load(dep);
            }
        }

        const loadedModule: LoadedModule = {
            manifest,
            path: modulePath,
            loaded: true,
        };

        this.modules.set(moduleId, loadedModule);

        // Emitir evento
        await eventBus.emit(PAGIAEvents.MODULE_LOADED, { moduleId, manifest });

        return loadedModule;
    }

    /**
     * Carrega múltiplos módulos
     * @param moduleIds IDs dos módulos a carregar
     */
    async loadMultiple(moduleIds: string[]): Promise<Map<string, LoadedModule | null>> {
        const results = new Map<string, LoadedModule | null>();

        for (const id of moduleIds) {
            results.set(id, await this.load(id));
        }

        return results;
    }

    /**
     * Descarrega um módulo
     * @param moduleId ID do módulo
     */
    async unload(moduleId: string): Promise<boolean> {
        const module = this.modules.get(moduleId);

        if (!module) {
            return false;
        }

        // Verificar se outros módulos dependem deste
        for (const [id, mod] of this.modules) {
            if (mod.manifest.dependencies.includes(moduleId) && mod.loaded) {
                console.error(`Não é possível descarregar ${moduleId}: ${id} depende dele`);
                return false;
            }
        }

        module.loaded = false;

        await eventBus.emit(PAGIAEvents.MODULE_UNLOADED, { moduleId });

        return true;
    }

    /**
     * Verifica se um módulo está carregado
     * @param moduleId ID do módulo
     */
    isLoaded(moduleId: string): boolean {
        const module = this.modules.get(moduleId);
        return module?.loaded || false;
    }

    /**
     * Obtém um módulo carregado
     * @param moduleId ID do módulo
     */
    get(moduleId: string): LoadedModule | undefined {
        return this.modules.get(moduleId);
    }

    /**
     * Lista todos os módulos
     * @param onlyLoaded Se true, lista apenas módulos carregados
     */
    list(onlyLoaded: boolean = false): LoadedModule[] {
        const modules = Array.from(this.modules.values());

        if (onlyLoaded) {
            return modules.filter((m) => m.loaded);
        }

        return modules;
    }

    /**
     * Obtém o grafo de dependências
     */
    getDependencyGraph(): Map<string, string[]> {
        const graph = new Map<string, string[]>();

        for (const [id, module] of this.modules) {
            graph.set(id, module.manifest.dependencies);
        }

        return graph;
    }

    /**
     * Valida se todas as dependências estão disponíveis
     * @param moduleId ID do módulo
     */
    validateDependencies(moduleId: string): { valid: boolean; missing: string[] } {
        const module = this.modules.get(moduleId);

        if (!module) {
            return { valid: false, missing: [moduleId] };
        }

        const missing: string[] = [];

        for (const dep of module.manifest.dependencies) {
            if (!this.modules.has(dep)) {
                missing.push(dep);
            }
        }

        return { valid: missing.length === 0, missing };
    }

    /**
     * Recarrega um módulo
     * @param moduleId ID do módulo
     */
    async reload(moduleId: string): Promise<LoadedModule | null> {
        await this.unload(moduleId);
        return this.load(moduleId);
    }

    /**
     * Obtém configuração de um módulo
     * @param moduleId ID do módulo
     */
    getConfig(moduleId: string): ModuleConfig | null {
        const module = this.modules.get(moduleId);

        if (!module) {
            return null;
        }

        const configPath = join(module.path, 'config.yaml');

        if (!existsSync(configPath)) {
            return null;
        }

        try {
            const content = readFileSync(configPath, 'utf-8');
            return parseYaml(content) as ModuleConfig;
        } catch {
            return null;
        }
    }

    /**
     * Limpa todos os módulos carregados
     */
    clear(): void {
        this.modules.clear();
    }
}

// Singleton exportado
export const moduleLoader = ModuleLoader.getInstance();

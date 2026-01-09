/**
 * PAGIA - Plugin System
 * Sistema de plugins extensível
 * 
 * @module core/plugin-system
 * @author Automações Comerciais Integradas
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { pathToFileURL } from 'url';

export interface PluginCommand {
    name: string;
    description: string;
    handler: string;
}

export interface PluginAgent {
    name: string;
    file: string;
}

export interface PluginHook {
    event: 'SessionStart' | 'SessionEnd' | 'PreToolUse' | 'PostToolUse' | 'PreAgentRun' | 'PostAgentRun' | 'OnError';
    handler: string;
}

export interface PluginManifest {
    name: string;
    version: string;
    description: string;
    author: string;
    commands?: PluginCommand[];
    agents?: PluginAgent[];
    hooks?: PluginHook[];
    skills?: string[];
    dependencies?: string[];
}

export interface LoadedPlugin {
    manifest: PluginManifest;
    path: string;
    enabled: boolean;
}

/**
 * Plugin Manager - Gerenciador de plugins PAGIA
 */
export class PluginManager {
    private static instance: PluginManager;
    private plugins: Map<string, LoadedPlugin> = new Map();
    private pluginsDir: string;
    private globalPluginsDir: string;

    private constructor() {
        this.globalPluginsDir = join(homedir(), '.pagia', 'plugins');
        this.pluginsDir = join(process.cwd(), '.pagia', 'plugins');

        // Garantir que os diretórios existem
        this.ensurePluginDirs();
    }

    static getInstance(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }

    private ensurePluginDirs(): void {
        if (!existsSync(this.globalPluginsDir)) {
            mkdirSync(this.globalPluginsDir, { recursive: true });
        }
    }

    /**
     * Carrega todos os plugins
     */
    async loadAll(): Promise<void> {
        // Carregar plugins globais
        await this.loadPluginsFromDir(this.globalPluginsDir);

        // Carregar plugins locais (sobrescrevem globais)
        if (existsSync(this.pluginsDir)) {
            await this.loadPluginsFromDir(this.pluginsDir);
        }
    }

    /**
     * Carrega plugins de um diretório
     */
    private async loadPluginsFromDir(dir: string): Promise<void> {
        if (!existsSync(dir)) return;

        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const pluginPath = join(dir, entry.name);
                const manifestPath = join(pluginPath, 'plugin.json');

                if (existsSync(manifestPath)) {
                    try {
                        const manifest: PluginManifest = JSON.parse(
                            readFileSync(manifestPath, 'utf-8')
                        );

                        this.plugins.set(manifest.name, {
                            manifest,
                            path: pluginPath,
                            enabled: true,
                        });
                    } catch (error) {
                        console.error(`Erro ao carregar plugin ${entry.name}:`, error);
                    }
                }
            }
        }
    }

    /**
     * Lista todos os plugins carregados
     */
    list(): LoadedPlugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Obtém um plugin pelo nome
     */
    get(name: string): LoadedPlugin | undefined {
        return this.plugins.get(name);
    }

    /**
     * Instala um plugin
     */
    async install(source: string): Promise<void> {
        // Determinar o tipo de fonte: npm, git ou local
        let pluginName: string;

        if (source.startsWith('http') || source.includes('git@') || source.includes('.git')) {
            // Instalação via Git
            pluginName = await this.installFromGit(source);
        } else if (source.startsWith('.') || source.startsWith('/') || existsSync(source)) {
            // Instalação local
            pluginName = await this.installFromLocal(source);
        } else {
            // Instalação via npm
            pluginName = await this.installFromNpm(source);
        }

        // Carregar o plugin recém-instalado
        const pluginPath = join(this.globalPluginsDir, pluginName);
        const manifestPath = join(pluginPath, 'plugin.json');

        if (existsSync(manifestPath)) {
            try {
                const manifest: PluginManifest = JSON.parse(
                    readFileSync(manifestPath, 'utf-8')
                );

                this.plugins.set(manifest.name, {
                    manifest,
                    path: pluginPath,
                    enabled: true,
                });
            } catch (error) {
                console.error(`Erro ao carregar manifest do plugin ${pluginName}:`, error);
                throw error;
            }
        }
    }

    /**
     * Instala um plugin via Git
     */
    private async installFromGit(gitUrl: string): Promise<string> {
        const { execSync } = await import('child_process');
        const { basename } = await import('path');

        // Extrair nome do repositório
        const repoName = basename(gitUrl.replace('.git', ''), '.git');
        const tempPath = join(this.globalPluginsDir, '.temp', repoName);
        const targetPath = join(this.globalPluginsDir, repoName);

        // Limpar temporário se existir
        if (existsSync(tempPath)) {
            execSync(`rmdir /s /q "${tempPath}"`, { stdio: 'ignore' });
        }

        // Limpar destino se já existir
        if (existsSync(targetPath)) {
            execSync(`rmdir /s /q "${targetPath}"`, { stdio: 'ignore' });
        }

        try {
            // Clonar repositório
            execSync(`git clone "${gitUrl}" "${tempPath}"`, { stdio: 'inherit' });

            // Verificar se tem plugin.json
            const pluginJsonPath = join(tempPath, 'plugin.json');
            if (!existsSync(pluginJsonPath)) {
                throw new Error(`Repositório não contém plugin.json: ${gitUrl}`);
            }

            // Ler nome do plugin do manifest
            const manifest: PluginManifest = JSON.parse(
                readFileSync(pluginJsonPath, 'utf-8')
            );

            const pluginName = manifest.name;
            const finalPath = join(this.globalPluginsDir, pluginName);

            // Mover para pasta final
            execSync(`move "${tempPath}" "${finalPath}"`, { stdio: 'inherit' });

            console.log(`Plugin "${pluginName}" instalado com sucesso via Git!`);
            return pluginName;
        } finally {
            // Limpar temporário
            if (existsSync(tempPath)) {
                execSync(`rmdir /s /q "${tempPath}"`, { stdio: 'ignore' });
            }
        }
    }

    /**
     * Instala um plugin localmente
     */
    private async installFromLocal(localPath: string): Promise<string> {
        const { cpSync } = await import('fs');
        const resolvedPath = resolve(localPath);

        if (!existsSync(resolvedPath)) {
            throw new Error(`Caminho local não encontrado: ${localPath}`);
        }

        // Verificar se tem plugin.json
        const pluginJsonPath = join(resolvedPath, 'plugin.json');
        if (!existsSync(pluginJsonPath)) {
            throw new Error(`Caminho não contém plugin.json: ${resolvedPath}`);
        }

        // Ler nome do plugin do manifest
        const manifest: PluginManifest = JSON.parse(
            readFileSync(pluginJsonPath, 'utf-8')
        );

        const pluginName = manifest.name;
        const targetPath = join(this.globalPluginsDir, pluginName);

        // Copiar para pasta de plugins
        if (existsSync(targetPath)) {
            throw new Error(`Plugin "${pluginName}" já existe`);
        }

        cpSync(resolvedPath, targetPath, { recursive: true });

        console.log(`Plugin "${pluginName}" instalado com sucesso localmente!`);
        return pluginName;
    }

    /**
     * Instala um plugin via npm
     */
    private async installFromNpm(packageName: string): Promise<string> {
        const { execSync } = await import('child_process');
        const tempPath = join(this.globalPluginsDir, '.temp', 'npm-install');

        // Limpar temporário se existir
        if (existsSync(tempPath)) {
            execSync(`rmdir /s /q "${tempPath}"`, { stdio: 'ignore' });
        }

        mkdirSync(tempPath, { recursive: true });

        try {
            // Instalar pacote npm temporariamente
            execSync(`npm install ${packageName}`, {
                cwd: tempPath,
                stdio: 'inherit'
            });

            // Encontrar o diretório do pacote instalado
            const nodeModulesPath = join(tempPath, 'node_modules');
            const packagePath = join(nodeModulesPath, packageName);

            if (!existsSync(packagePath)) {
                throw new Error(`Pacote npm não encontrado após instalação: ${packageName}`);
            }

            // Verificar se tem plugin.json
            const pluginJsonPath = join(packagePath, 'plugin.json');
            if (!existsSync(pluginJsonPath)) {
                throw new Error(`Pacote npm não contém plugin.json: ${packageName}`);
            }

            // Ler nome do plugin do manifest
            const manifest: PluginManifest = JSON.parse(
                readFileSync(pluginJsonPath, 'utf-8')
            );

            const pluginName = manifest.name;
            const targetPath = join(this.globalPluginsDir, pluginName);

            // Copiar para pasta de plugins
            if (existsSync(targetPath)) {
                throw new Error(`Plugin "${pluginName}" já existe`);
            }

            execSync(`xcopy /E /I /Y "${packagePath}" "${targetPath}"`, { stdio: 'inherit' });

            console.log(`Plugin "${pluginName}" instalado com sucesso via npm!`);
            return pluginName;
        } finally {
            // Limpar temporário
            if (existsSync(tempPath)) {
                execSync(`rmdir /s /q "${tempPath}"`, { stdio: 'ignore' });
            }
        }
    }

    /**
     * Remove um plugin
     */
    async remove(name: string): Promise<boolean> {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            return false;
        }

        // Remover do mapa
        this.plugins.delete(name);

        // TODO: Remover arquivos do disco
        return true;
    }

    /**
     * Cria um novo plugin
     */
    async create(name: string, options: Partial<PluginManifest> = {}): Promise<string> {
        const pluginPath = join(this.globalPluginsDir, name);

        if (existsSync(pluginPath)) {
            throw new Error(`Plugin "${name}" já existe`);
        }

        // Criar estrutura de diretórios
        mkdirSync(pluginPath, { recursive: true });
        mkdirSync(join(pluginPath, 'commands'), { recursive: true });
        mkdirSync(join(pluginPath, 'agents'), { recursive: true });
        mkdirSync(join(pluginPath, 'hooks'), { recursive: true });

        // Criar manifest
        const manifest: PluginManifest = {
            name,
            version: '1.0.0',
            description: options.description || `Plugin ${name} para PAGIA`,
            author: options.author || 'PAGIA User',
            commands: [],
            agents: [],
            hooks: [],
            skills: [],
        };

        writeFileSync(
            join(pluginPath, 'plugin.json'),
            JSON.stringify(manifest, null, 2),
            'utf-8'
        );

        // Criar agente de exemplo
        const exampleAgent = `# ${name} Agent

## Papel
Agente do plugin ${name}

## Descrição
Este agente foi criado pelo plugin ${name}.

## Instruções
Implemente as instruções do seu agente aqui.

## Menu
- \`/help\` - Mostrar ajuda
`;

        writeFileSync(
            join(pluginPath, 'agents', `${name}-agent.md`),
            exampleAgent,
            'utf-8'
        );

        // Criar README
        const readme = `# ${name}

Plugin para PAGIA.

## Instalação

\`\`\`bash
pagia plugin install ${name}
\`\`\`

## Uso

Descreva como usar o plugin aqui.

## Licença

MIT
`;

        writeFileSync(
            join(pluginPath, 'README.md'),
            readme,
            'utf-8'
        );

        return pluginPath;
    }

    /**
     * Obtém todos os comandos de todos os plugins
     */
    getAllCommands(): Array<{ plugin: string; command: PluginCommand }> {
        const commands: Array<{ plugin: string; command: PluginCommand }> = [];

        for (const [name, plugin] of this.plugins) {
            if (plugin.enabled && plugin.manifest.commands) {
                for (const cmd of plugin.manifest.commands) {
                    commands.push({ plugin: name, command: cmd });
                }
            }
        }

        return commands;
    }

    /**
     * Obtém todos os agentes de todos os plugins
     */
    getAllAgents(): Array<{ plugin: string; agent: PluginAgent; path: string }> {
        const agents: Array<{ plugin: string; agent: PluginAgent; path: string }> = [];

        for (const [name, plugin] of this.plugins) {
            if (plugin.enabled && plugin.manifest.agents) {
                for (const agent of plugin.manifest.agents) {
                    agents.push({
                        plugin: name,
                        agent,
                        path: join(plugin.path, agent.file),
                    });
                }
            }
        }

        return agents;
    }

    /**
     * Obtém todos os hooks de um tipo específico
     */
    getHooks(event: PluginHook['event']): Array<{ plugin: string; hook: PluginHook; path: string }> {
        const hooks: Array<{ plugin: string; hook: PluginHook; path: string }> = [];

        for (const [name, plugin] of this.plugins) {
            if (plugin.enabled && plugin.manifest.hooks) {
                for (const hook of plugin.manifest.hooks.filter(h => h.event === event)) {
                    hooks.push({
                        plugin: name,
                        hook,
                        path: join(plugin.path, hook.handler),
                    });
                }
            }
        }

        return hooks;
    }

    /**
     * Executa hooks de um evento
     */
    async executeHooks(event: PluginHook['event'], context: any): Promise<void> {
        const hooks = this.getHooks(event);

        for (const { plugin, hook, path } of hooks) {
            try {
                if (existsSync(path)) {
                    const hookModule = await import(pathToFileURL(path).href);
                    if (typeof hookModule.default === 'function') {
                        await hookModule.default(context);
                    } else if (typeof hookModule.handler === 'function') {
                        await hookModule.handler(context);
                    }
                }
            } catch (error) {
                console.error(`Erro ao executar hook ${hook.event} do plugin ${plugin}:`, error);
            }
        }
    }
}

// Singleton exportado
export const pluginManager = PluginManager.getInstance();

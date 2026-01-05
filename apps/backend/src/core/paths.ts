/**
 * PAGIA - Cross-Platform Paths Utility
 * Seguindo o padrão de CLIs como Claude Code, Cursor e Windsurf
 * 
 * Estrutura:
 * - Global: %APPDATA%/PAGIA (Windows) ou ~/.pagia (Unix)
 * - Projeto: .pagia/ no diretório do projeto
 * 
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */

import { homedir, platform } from 'os';
import { join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Application name following CLI standards
const APP_NAME = 'PAGIA';
const APP_NAME_LOWER = 'pagia';

/**
 * Get the global configuration directory path following VS Code fork conventions
 * - Windows: %APPDATA%\PAGIA
 * - macOS: ~/Library/Application Support/PAGIA
 * - Linux: ~/.config/pagia or ~/.pagia
 */
export function getGlobalConfigDir(): string {
    const home = homedir();

    switch (platform()) {
        case 'win32':
            // Windows follows AppData/Roaming pattern like Claude, Cursor, Windsurf
            return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), APP_NAME);

        case 'darwin':
            // macOS uses Application Support
            return join(home, 'Library', 'Application Support', APP_NAME);

        default:
            // Linux uses .config or hidden folder in home
            const xdgConfig = process.env.XDG_CONFIG_HOME || join(home, '.config');
            return join(xdgConfig, APP_NAME_LOWER);
    }
}

/**
 * Get the global data directory for larger storage
 * - Windows: %LOCALAPPDATA%\PAGIA
 * - macOS: ~/Library/Application Support/PAGIA
 * - Linux: ~/.local/share/pagia
 */
export function getGlobalDataDir(): string {
    const home = homedir();

    switch (platform()) {
        case 'win32':
            return join(process.env.LOCALAPPDATA || join(home, 'AppData', 'Local'), APP_NAME);

        case 'darwin':
            return join(home, 'Library', 'Application Support', APP_NAME);

        default:
            const xdgData = process.env.XDG_DATA_HOME || join(home, '.local', 'share');
            return join(xdgData, APP_NAME_LOWER);
    }
}

/**
 * Get the global logs directory
 */
export function getLogsDir(): string {
    return join(getGlobalConfigDir(), 'logs');
}

/**
 * Get the user settings directory (User/)
 */
export function getUserSettingsDir(): string {
    return join(getGlobalConfigDir(), 'User');
}

/**
 * Get the global storage directory
 */
export function getGlobalStorageDir(): string {
    return join(getGlobalConfigDir(), 'globalStorage');
}

/**
 * Get the workspace storage directory
 */
export function getWorkspaceStorageDir(): string {
    return join(getGlobalConfigDir(), 'workspaceStorage');
}

/**
 * Get the extensions directory
 */
export function getExtensionsDir(): string {
    return join(getGlobalConfigDir(), 'extensions');
}

/**
 * Get the credentials directory
 */
export function getCredentialsDir(): string {
    return join(getGlobalStorageDir(), 'credentials');
}

/**
 * Get the global agents directory
 */
export function getGlobalAgentsDir(): string {
    return join(getGlobalStorageDir(), 'agents');
}

/**
 * Get the global skills directory
 */
export function getGlobalSkillsDir(): string {
    return join(getGlobalStorageDir(), 'skills');
}

/**
 * Get the global MCP servers directory
 */
export function getGlobalMcpServersDir(): string {
    return join(getGlobalStorageDir(), 'mcp-servers');
}

/**
 * Get path to the global PAGIA.md (memory/instructions file)
 */
export function getGlobalInstructionsPath(): string {
    return join(getGlobalConfigDir(), 'PAGIA.md');
}

/**
 * Get path to the global settings file
 */
export function getGlobalSettingsPath(): string {
    return join(getUserSettingsDir(), 'settings.json');
}

/**
 * Get path to the global config.yaml (legacy support)
 */
export function getGlobalConfigYamlPath(): string {
    return join(getGlobalConfigDir(), 'config.yaml');
}

/**
 * Structure of global directory following VS Code fork pattern
 */
export interface GlobalDirectoryStructure {
    root: string;
    user: string;
    logs: string;
    globalStorage: string;
    workspaceStorage: string;
    extensions: string;
    credentials: string;
    agents: string;
    skills: string;
    mcpServers: string;
}

/**
 * Get all global directory paths
 */
export function getGlobalDirectoryStructure(): GlobalDirectoryStructure {
    return {
        root: getGlobalConfigDir(),
        user: getUserSettingsDir(),
        logs: getLogsDir(),
        globalStorage: getGlobalStorageDir(),
        workspaceStorage: getWorkspaceStorageDir(),
        extensions: getExtensionsDir(),
        credentials: getCredentialsDir(),
        agents: getGlobalAgentsDir(),
        skills: getGlobalSkillsDir(),
        mcpServers: getGlobalMcpServersDir(),
    };
}

/**
 * Ensure global directory structure exists
 */
export function ensureGlobalDirectories(): void {
    const structure = getGlobalDirectoryStructure();

    const directories = [
        structure.root,
        structure.user,
        join(structure.user, 'snippets'),
        structure.logs,
        structure.globalStorage,
        structure.workspaceStorage,
        structure.extensions,
        structure.credentials,
        structure.agents,
        structure.skills,
        structure.mcpServers,
    ];

    for (const dir of directories) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }
}

/**
 * Structure of project .pagia directory
 */
export interface ProjectDirectoryStructure {
    root: string;           // .pagia/
    settings: string;       // .pagia/settings.json
    settingsLocal: string;  // .pagia/settings.local.json
    instructions: string;   // .pagia/PAGIA.md
    conductor: string;      // .pagia/conductor/
    plans: string;          // .pagia/plans/
    workflows: string;      // .pagia/workflows/
    agents: string;         // .pagia/agents/
    skills: string;         // .pagia/skills/
    mcp: string;            // .pagia/mcp/
    cache: string;          // .pagia/cache/
    config: string;         // .pagia/_cfg/ (legacy)
    router: string;         // .pagia/router.json
}

/**
 * Get project directory structure for a given project root
 */
export function getProjectDirectoryStructure(projectRoot: string): ProjectDirectoryStructure {
    const pagiaDir = join(projectRoot, '.pagia');

    return {
        root: pagiaDir,
        settings: join(pagiaDir, 'settings.json'),
        settingsLocal: join(pagiaDir, 'settings.local.json'),
        instructions: join(pagiaDir, 'PAGIA.md'),
        conductor: join(pagiaDir, 'conductor'),
        plans: join(pagiaDir, 'plans'),
        workflows: join(pagiaDir, 'workflows'),
        agents: join(pagiaDir, 'agents'),
        skills: join(pagiaDir, 'skills'),
        mcp: join(pagiaDir, 'mcp'),
        cache: join(pagiaDir, 'cache'),
        config: join(pagiaDir, '_cfg'),
        router: join(pagiaDir, 'router.json'),
    };
}

/**
 * Ensure project directory structure exists
 */
export function ensureProjectDirectories(projectRoot: string): void {
    const structure = getProjectDirectoryStructure(projectRoot);

    const directories = [
        structure.root,
        structure.conductor,
        structure.plans,
        join(structure.plans, 'global'),
        join(structure.plans, 'stages'),
        join(structure.plans, 'prompts'),
        join(structure.plans, 'ai'),
        structure.workflows,
        structure.agents,
        structure.skills,
        structure.mcp,
        structure.cache,
        join(structure.cache, 'embeddings'),
        join(structure.cache, 'knowledge'),
        structure.config,
        join(structure.config, 'agents'),
    ];

    for (const dir of directories) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }
}

/**
 * Generate a hash for workspace storage based on project path
 */
export function getWorkspaceHash(projectRoot: string): string {
    const path = resolve(projectRoot);
    let hash = 0;

    for (let i = 0; i < path.length; i++) {
        const char = path.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Get workspace storage path for a specific project
 */
export function getWorkspaceStoragePath(projectRoot: string): string {
    const hash = getWorkspaceHash(projectRoot);
    return join(getWorkspaceStorageDir(), hash);
}

/**
 * Check if running in a PAGIA-initialized project
 */
export function isInPagiaProject(projectRoot?: string): boolean {
    const root = projectRoot || process.cwd();
    const pagiaDir = join(root, '.pagia');
    return existsSync(pagiaDir);
}

/**
 * Find the nearest .pagia directory walking up the tree
 */
export function findNearestPagiaDir(startDir?: string): string | null {
    let currentDir = resolve(startDir || process.cwd());
    const root = platform() === 'win32' ? currentDir.split('\\')[0] + '\\' : '/';

    while (currentDir !== root) {
        const pagiaDir = join(currentDir, '.pagia');
        if (existsSync(pagiaDir)) {
            return pagiaDir;
        }
        currentDir = resolve(currentDir, '..');
    }

    return null;
}

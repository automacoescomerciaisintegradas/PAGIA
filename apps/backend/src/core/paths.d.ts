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
/**
 * Get the global configuration directory path following VS Code fork conventions
 * - Windows: %APPDATA%\PAGIA
 * - macOS: ~/Library/Application Support/PAGIA
 * - Linux: ~/.config/pagia or ~/.pagia
 */
export declare function getGlobalConfigDir(): string;
/**
 * Get the global data directory for larger storage
 * - Windows: %LOCALAPPDATA%\PAGIA
 * - macOS: ~/Library/Application Support/PAGIA
 * - Linux: ~/.local/share/pagia
 */
export declare function getGlobalDataDir(): string;
/**
 * Get the global logs directory
 */
export declare function getLogsDir(): string;
/**
 * Get the user settings directory (User/)
 */
export declare function getUserSettingsDir(): string;
/**
 * Get the global storage directory
 */
export declare function getGlobalStorageDir(): string;
/**
 * Get the workspace storage directory
 */
export declare function getWorkspaceStorageDir(): string;
/**
 * Get the extensions directory
 */
export declare function getExtensionsDir(): string;
/**
 * Get the credentials directory
 */
export declare function getCredentialsDir(): string;
/**
 * Get the global agents directory
 */
export declare function getGlobalAgentsDir(): string;
/**
 * Get the global skills directory
 */
export declare function getGlobalSkillsDir(): string;
/**
 * Get the global MCP servers directory
 */
export declare function getGlobalMcpServersDir(): string;
/**
 * Get path to the global PAGIA.md (memory/instructions file)
 */
export declare function getGlobalInstructionsPath(): string;
/**
 * Get path to the global settings file
 */
export declare function getGlobalSettingsPath(): string;
/**
 * Get path to the global config.yaml (legacy support)
 */
export declare function getGlobalConfigYamlPath(): string;
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
export declare function getGlobalDirectoryStructure(): GlobalDirectoryStructure;
/**
 * Ensure global directory structure exists
 */
export declare function ensureGlobalDirectories(): void;
/**
 * Structure of project .pagia directory
 */
export interface ProjectDirectoryStructure {
    root: string;
    settings: string;
    settingsLocal: string;
    instructions: string;
    conductor: string;
    plans: string;
    workflows: string;
    agents: string;
    skills: string;
    mcp: string;
    cache: string;
    config: string;
    router: string;
}
/**
 * Get project directory structure for a given project root
 */
export declare function getProjectDirectoryStructure(projectRoot: string): ProjectDirectoryStructure;
/**
 * Ensure project directory structure exists
 */
export declare function ensureProjectDirectories(projectRoot: string): void;
/**
 * Generate a hash for workspace storage based on project path
 */
export declare function getWorkspaceHash(projectRoot: string): string;
/**
 * Get workspace storage path for a specific project
 */
export declare function getWorkspaceStoragePath(projectRoot: string): string;
/**
 * Check if running in a PAGIA-initialized project
 */
export declare function isInPagiaProject(projectRoot?: string): boolean;
/**
 * Find the nearest .pagia directory walking up the tree
 */
export declare function findNearestPagiaDir(startDir?: string): string | null;
//# sourceMappingURL=paths.d.ts.map
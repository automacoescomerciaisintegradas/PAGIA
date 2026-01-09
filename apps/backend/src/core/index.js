/**
 * PAGIA - Core Index
 * Exportações do módulo core
 *
 * @module core
 * @author Automações Comerciais Integradas
 */
// Configuration
export { AIService, createAIService } from './ai-service.js';
export { ConfigManager, getConfigManager } from './config-manager.js';
export { EventBus, eventBus, PAGIAEvents } from './event-bus.js';
export { ModuleLoader, moduleLoader } from './module-loader.js';
// Global Configuration (AppData/Roaming style)
export { GlobalConfigManager, getGlobalConfig } from './global-config.js';
// Cross-Platform Paths
export { getGlobalConfigDir, getGlobalDataDir, getLogsDir, getUserSettingsDir, getGlobalStorageDir, getWorkspaceStorageDir, getExtensionsDir, getCredentialsDir, getGlobalAgentsDir, getGlobalSkillsDir, getGlobalMcpServersDir, getGlobalInstructionsPath, getGlobalSettingsPath, ensureGlobalDirectories, ensureProjectDirectories, getProjectDirectoryStructure, getGlobalDirectoryStructure, getWorkspaceHash, getWorkspaceStoragePath, isInPagiaProject, findNearestPagiaDir, } from './paths.js';
// Credentials Management
export { CredentialsManager, getCredentialsManager, } from './credentials.js';
// Workspace Storage
export { WorkspaceStorageManager, getWorkspaceStorage, listStoredWorkspaces, cleanupOrphanedWorkspaces, } from './workspace-storage.js';
// Router Management (claude-code-router style)
export { RouterManager, getRouterManager, } from './router-manager.js';
//# sourceMappingURL=index.js.map
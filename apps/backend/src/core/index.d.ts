/**
 * PAGIA - Core Index
 * Exportações do módulo core
 *
 * @module core
 * @author Automações Comerciais Integradas
 */
export { AIService, createAIService, AIMessage, AIResponse } from './ai-service.js';
export { ConfigManager, getConfigManager } from './config-manager.js';
export { EventBus, eventBus, PAGIAEvents, EventHandler } from './event-bus.js';
export { ModuleLoader, moduleLoader } from './module-loader.js';
export { GlobalConfigManager, getGlobalConfig, GlobalSettings, MCPServerConfig } from './global-config.js';
export { getGlobalConfigDir, getGlobalDataDir, getLogsDir, getUserSettingsDir, getGlobalStorageDir, getWorkspaceStorageDir, getExtensionsDir, getCredentialsDir, getGlobalAgentsDir, getGlobalSkillsDir, getGlobalMcpServersDir, getGlobalInstructionsPath, getGlobalSettingsPath, ensureGlobalDirectories, ensureProjectDirectories, getProjectDirectoryStructure, getGlobalDirectoryStructure, getWorkspaceHash, getWorkspaceStoragePath, isInPagiaProject, findNearestPagiaDir, } from './paths.js';
export { CredentialsManager, getCredentialsManager, CredentialProvider, Credential, } from './credentials.js';
export { WorkspaceStorageManager, getWorkspaceStorage, listStoredWorkspaces, cleanupOrphanedWorkspaces, WorkspaceMetadata, WorkspaceState, } from './workspace-storage.js';
export { RouterManager, getRouterManager, } from './router-manager.js';
export type { RouterSystemConfig, ProviderConfig, RouterConfig, RoutingRequest, RoutingResult, PresetManifest, TransformerConfig, BuiltinTransformer, } from './router-types.js';
//# sourceMappingURL=index.d.ts.map
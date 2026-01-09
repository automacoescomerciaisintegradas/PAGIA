/**
 * PAGIA - Workspace Storage Manager
 * Gerencia cache e estado por workspace
 * Seguindo padrão de CLIs como Claude Code, Cursor e Windsurf
 *
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */
/**
 * Workspace metadata structure
 */
export interface WorkspaceMetadata {
    path: string;
    name: string;
    hash: string;
    createdAt: string;
    lastOpenedAt: string;
    settings?: Record<string, unknown>;
}
/**
 * Workspace state structure (persisted)
 */
export interface WorkspaceState {
    openFiles?: string[];
    activeFile?: string;
    agentSession?: {
        lastAgentUsed?: string;
        conversationHistory?: unknown[];
        context?: unknown;
    };
    planState?: {
        currentPlan?: string;
        completedTasks?: string[];
        pendingTasks?: string[];
    };
    custom?: Record<string, unknown>;
}
/**
 * Workspace Storage Manager
 * Handles per-workspace cache and state
 */
export declare class WorkspaceStorageManager {
    private workspacePath;
    private storagePath;
    private hash;
    constructor(workspacePath: string);
    /**
     * Ensure workspace storage directory exists
     */
    private ensureStorageDir;
    /**
     * Get workspace metadata file path
     */
    private getMetadataPath;
    /**
     * Get workspace state file path
     */
    private getStatePath;
    /**
     * Initialize workspace storage
     */
    initialize(): Promise<void>;
    /**
     * Get workspace metadata
     */
    getMetadata(): Promise<WorkspaceMetadata | null>;
    /**
     * Save workspace metadata
     */
    saveMetadata(metadata: WorkspaceMetadata): Promise<void>;
    /**
     * Get workspace state
     */
    getState(): Promise<WorkspaceState>;
    /**
     * Save workspace state
     */
    saveState(state: WorkspaceState): Promise<void>;
    /**
     * Update workspace state (partial update)
     */
    updateState(updates: Partial<WorkspaceState>): Promise<WorkspaceState>;
    /**
     * Get a value from workspace state
     */
    get<T = unknown>(key: string): Promise<T | undefined>;
    /**
     * Set a value in workspace state
     */
    set(key: string, value: unknown): Promise<void>;
    /**
     * Delete a value from workspace state
     */
    delete(key: string): Promise<void>;
    /**
     * Cache a value with optional TTL
     */
    cache(key: string, value: unknown, ttlMs?: number): Promise<void>;
    /**
     * Get cached value
     */
    getCached<T = unknown>(key: string): Promise<T | null>;
    /**
     * Clear all cache
     */
    clearCache(): Promise<void>;
    /**
     * Get storage size in bytes
     */
    getStorageSize(): number;
    /**
     * Get directory size recursively
     */
    private getDirSize;
    /**
     * Sanitize key for file name
     */
    private sanitizeKey;
    /**
     * Get the hash for this workspace
     */
    getHash(): string;
    /**
     * Get the storage path
     */
    getStoragePath(): string;
}
/**
 * Global function to list all stored workspaces
 */
export declare function listStoredWorkspaces(): Promise<WorkspaceMetadata[]>;
/**
 * Cleanup orphaned workspace storage (workspaces that no longer exist)
 */
export declare function cleanupOrphanedWorkspaces(): Promise<number>;
/**
 * Factory function to get workspace storage for a project
 */
export declare function getWorkspaceStorage(workspacePath: string): WorkspaceStorageManager;
//# sourceMappingURL=workspace-storage.d.ts.map
/**
 * PAGIA - Workspace Storage Manager
 * Gerencia cache e estado por workspace
 * Seguindo padrão de CLIs como Claude Code, Cursor e Windsurf
 * 
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { getWorkspaceStorageDir, getWorkspaceStoragePath, getWorkspaceHash } from './paths.js';

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
    // Open files/tabs
    openFiles?: string[];
    activeFile?: string;

    // Agent session state
    agentSession?: {
        lastAgentUsed?: string;
        conversationHistory?: unknown[];
        context?: unknown;
    };

    // Plan state
    planState?: {
        currentPlan?: string;
        completedTasks?: string[];
        pendingTasks?: string[];
    };

    // Custom state
    custom?: Record<string, unknown>;
}

/**
 * Workspace Storage Manager
 * Handles per-workspace cache and state
 */
export class WorkspaceStorageManager {
    private workspacePath: string;
    private storagePath: string;
    private hash: string;

    constructor(workspacePath: string) {
        this.workspacePath = resolve(workspacePath);
        this.hash = getWorkspaceHash(this.workspacePath);
        this.storagePath = getWorkspaceStoragePath(this.workspacePath);
    }

    /**
     * Ensure workspace storage directory exists
     */
    private ensureStorageDir(): void {
        if (!existsSync(this.storagePath)) {
            mkdirSync(this.storagePath, { recursive: true });
        }
    }

    /**
     * Get workspace metadata file path
     */
    private getMetadataPath(): string {
        return join(this.storagePath, 'workspace.json');
    }

    /**
     * Get workspace state file path
     */
    private getStatePath(): string {
        return join(this.storagePath, 'state.json');
    }

    /**
     * Initialize workspace storage
     */
    async initialize(): Promise<void> {
        this.ensureStorageDir();

        // Create metadata if not exists
        if (!existsSync(this.getMetadataPath())) {
            await this.saveMetadata({
                path: this.workspacePath,
                name: this.workspacePath.split(/[/\\]/).pop() || 'workspace',
                hash: this.hash,
                createdAt: new Date().toISOString(),
                lastOpenedAt: new Date().toISOString(),
            });
        } else {
            // Update last opened
            const metadata = await this.getMetadata();
            if (metadata) {
                metadata.lastOpenedAt = new Date().toISOString();
                await this.saveMetadata(metadata);
            }
        }
    }

    /**
     * Get workspace metadata
     */
    async getMetadata(): Promise<WorkspaceMetadata | null> {
        const metadataPath = this.getMetadataPath();

        if (!existsSync(metadataPath)) {
            return null;
        }

        try {
            const content = readFileSync(metadataPath, 'utf-8');
            return JSON.parse(content) as WorkspaceMetadata;
        } catch {
            return null;
        }
    }

    /**
     * Save workspace metadata
     */
    async saveMetadata(metadata: WorkspaceMetadata): Promise<void> {
        this.ensureStorageDir();
        const metadataPath = this.getMetadataPath();
        writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    }

    /**
     * Get workspace state
     */
    async getState(): Promise<WorkspaceState> {
        const statePath = this.getStatePath();

        if (!existsSync(statePath)) {
            return {};
        }

        try {
            const content = readFileSync(statePath, 'utf-8');
            return JSON.parse(content) as WorkspaceState;
        } catch {
            return {};
        }
    }

    /**
     * Save workspace state
     */
    async saveState(state: WorkspaceState): Promise<void> {
        this.ensureStorageDir();
        const statePath = this.getStatePath();
        writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
    }

    /**
     * Update workspace state (partial update)
     */
    async updateState(updates: Partial<WorkspaceState>): Promise<WorkspaceState> {
        const current = await this.getState();
        const updated = { ...current, ...updates };
        await this.saveState(updated);
        return updated;
    }

    /**
     * Get a value from workspace state
     */
    async get<T = unknown>(key: string): Promise<T | undefined> {
        const state = await this.getState();
        return (state.custom?.[key] ?? (state as any)[key]) as T;
    }

    /**
     * Set a value in workspace state
     */
    async set(key: string, value: unknown): Promise<void> {
        const state = await this.getState();

        if (!state.custom) {
            state.custom = {};
        }

        state.custom[key] = value;
        await this.saveState(state);
    }

    /**
     * Delete a value from workspace state
     */
    async delete(key: string): Promise<void> {
        const state = await this.getState();

        if (state.custom) {
            delete state.custom[key];
            await this.saveState(state);
        }
    }

    /**
     * Cache a value with optional TTL
     */
    async cache(key: string, value: unknown, ttlMs?: number): Promise<void> {
        this.ensureStorageDir();

        const cacheDir = join(this.storagePath, 'cache');
        if (!existsSync(cacheDir)) {
            mkdirSync(cacheDir, { recursive: true });
        }

        const cacheEntry = {
            value,
            createdAt: Date.now(),
            expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
        };

        const cachePath = join(cacheDir, `${this.sanitizeKey(key)}.json`);
        writeFileSync(cachePath, JSON.stringify(cacheEntry), 'utf-8');
    }

    /**
     * Get cached value
     */
    async getCached<T = unknown>(key: string): Promise<T | null> {
        const cacheDir = join(this.storagePath, 'cache');
        const cachePath = join(cacheDir, `${this.sanitizeKey(key)}.json`);

        if (!existsSync(cachePath)) {
            return null;
        }

        try {
            const content = readFileSync(cachePath, 'utf-8');
            const entry = JSON.parse(content);

            // Check if expired
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
                unlinkSync(cachePath);
                return null;
            }

            return entry.value as T;
        } catch {
            return null;
        }
    }

    /**
     * Clear all cache
     */
    async clearCache(): Promise<void> {
        const cacheDir = join(this.storagePath, 'cache');

        if (existsSync(cacheDir)) {
            rmSync(cacheDir, { recursive: true, force: true });
        }
    }

    /**
     * Get storage size in bytes
     */
    getStorageSize(): number {
        if (!existsSync(this.storagePath)) {
            return 0;
        }

        return this.getDirSize(this.storagePath);
    }

    /**
     * Get directory size recursively
     */
    private getDirSize(dirPath: string): number {
        let size = 0;

        const items = readdirSync(dirPath);
        for (const item of items) {
            const itemPath = join(dirPath, item);
            const stat = statSync(itemPath);

            if (stat.isDirectory()) {
                size += this.getDirSize(itemPath);
            } else {
                size += stat.size;
            }
        }

        return size;
    }

    /**
     * Sanitize key for file name
     */
    private sanitizeKey(key: string): string {
        return key.replace(/[^a-zA-Z0-9-_]/g, '_');
    }

    /**
     * Get the hash for this workspace
     */
    getHash(): string {
        return this.hash;
    }

    /**
     * Get the storage path
     */
    getStoragePath(): string {
        return this.storagePath;
    }
}

/**
 * Global function to list all stored workspaces
 */
export async function listStoredWorkspaces(): Promise<WorkspaceMetadata[]> {
    const storageDir = getWorkspaceStorageDir();

    if (!existsSync(storageDir)) {
        return [];
    }

    const workspaces: WorkspaceMetadata[] = [];
    const dirs = readdirSync(storageDir);

    for (const dir of dirs) {
        const metadataPath = join(storageDir, dir, 'workspace.json');

        if (existsSync(metadataPath)) {
            try {
                const content = readFileSync(metadataPath, 'utf-8');
                const metadata = JSON.parse(content) as WorkspaceMetadata;

                // Verify the workspace still exists
                if (existsSync(metadata.path)) {
                    workspaces.push(metadata);
                }
            } catch {
                // Skip invalid entries
            }
        }
    }

    // Sort by last opened
    return workspaces.sort((a, b) =>
        new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
    );
}

/**
 * Cleanup orphaned workspace storage (workspaces that no longer exist)
 */
export async function cleanupOrphanedWorkspaces(): Promise<number> {
    const storageDir = getWorkspaceStorageDir();

    if (!existsSync(storageDir)) {
        return 0;
    }

    let cleaned = 0;
    const dirs = readdirSync(storageDir);

    for (const dir of dirs) {
        const metadataPath = join(storageDir, dir, 'workspace.json');

        if (existsSync(metadataPath)) {
            try {
                const content = readFileSync(metadataPath, 'utf-8');
                const metadata = JSON.parse(content) as WorkspaceMetadata;

                // Remove if workspace no longer exists
                if (!existsSync(metadata.path)) {
                    rmSync(join(storageDir, dir), { recursive: true, force: true });
                    cleaned++;
                }
            } catch {
                // Remove invalid entries
                rmSync(join(storageDir, dir), { recursive: true, force: true });
                cleaned++;
            }
        }
    }

    return cleaned;
}

/**
 * Factory function to get workspace storage for a project
 */
export function getWorkspaceStorage(workspacePath: string): WorkspaceStorageManager {
    return new WorkspaceStorageManager(workspacePath);
}

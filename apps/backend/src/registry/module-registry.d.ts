/**
 * PAGIA - Module Registry
 * Repositório de módulos da comunidade
 *
 * @module registry/module-registry
 * @author Automações Comerciais Integradas
 */
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
export declare class ModuleRegistry {
    private static instance;
    private registryUrl;
    private modulesPath;
    private installed;
    private registryCache;
    private constructor();
    /**
     * Obtém instância singleton
     */
    static getInstance(): ModuleRegistry;
    /**
     * Define caminho dos módulos
     */
    setModulesPath(path: string): void;
    /**
     * Define URL do registro
     */
    setRegistryUrl(url: string): void;
    /**
     * Carrega módulos instalados
     */
    private loadInstalled;
    /**
     * Salva módulos instalados
     */
    private saveInstalled;
    /**
     * Busca módulos no registro
     */
    search(query: string, options?: {
        type?: ModuleType;
        author?: string;
        limit?: number;
    }): Promise<RegistryEntry[]>;
    /**
     * Instala um módulo
     */
    install(moduleCode: string, options?: {
        version?: string;
        source?: string;
    }): Promise<InstalledModule>;
    /**
     * Instala de diretório local
     */
    private installFromLocal;
    /**
     * Instala de URL
     */
    private installFromUrl;
    /**
     * Instala do registro
     */
    private installFromRegistry;
    /**
     * Desinstala um módulo
     */
    uninstall(moduleCode: string): Promise<boolean>;
    /**
     * Atualiza um módulo
     */
    update(moduleCode: string, version?: string): Promise<InstalledModule | null>;
    /**
     * Lista módulos instalados
     */
    listInstalled(options?: {
        enabled?: boolean;
        type?: ModuleType;
    }): InstalledModule[];
    /**
     * Obtém módulo instalado
     */
    getInstalled(moduleCode: string): InstalledModule | undefined;
    /**
     * Verifica se módulo está instalado
     */
    isInstalled(moduleCode: string): boolean;
    /**
     * Habilita módulo
     */
    enable(moduleCode: string): boolean;
    /**
     * Desabilita módulo
     */
    disable(moduleCode: string): boolean;
    /**
     * Valida um módulo
     */
    validate(modulePath: string): ValidationResult;
    /**
     * Publica módulo no registro
     */
    publish(modulePath: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Cria scaffold de módulo
     */
    scaffold(moduleCode: string, type: ModuleType, outputPath: string): Promise<string>;
}
export declare const moduleRegistry: ModuleRegistry;
//# sourceMappingURL=module-registry.d.ts.map
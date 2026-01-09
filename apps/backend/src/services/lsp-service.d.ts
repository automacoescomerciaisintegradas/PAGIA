/**
 * Serviço LSP (Language Server Protocol) para PAGIA
 * Implementa funcionalidades de navegação e análise de código
 */
export interface SymbolDefinition {
    symbol: string;
    file: string;
    line: number;
    column: number;
    type: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'module';
    signature: string;
    context: string;
}
export interface Reference {
    file: string;
    line: number;
    column: number;
    usageType: 'call' | 'declaration' | 'import' | 'reference' | 'extension';
    context: string;
}
export interface HoverInfo {
    symbol: string;
    signature: string;
    documentation: string;
    parameters?: Array<{
        name: string;
        type: string;
        description: string;
    }>;
    returns?: {
        type: string;
        description: string;
    };
    examples?: string[];
    deprecated?: boolean;
}
export interface DependencyAnalysis {
    file: string;
    imports: string[];
    exports: string[];
    externalDependencies: string[];
    moduleRelations: Array<{
        from: string;
        to: string;
        type: 'import' | 'export' | 'dependency';
    }>;
    issues: string[];
    unusedDependencies: string[];
}
export declare class LSPService {
    private cache;
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Encontra a definição de um símbolo no código
     */
    goToDefinition(symbol: string, filePath: string, code: string): Promise<SymbolDefinition>;
    /**
     * Encontra todas as referências de um símbolo
     */
    findReferences(symbol: string, codebasePaths: string[]): Promise<{
        symbol: string;
        totalReferences: number;
        references: Reference[];
        impactAnalysis: string;
    }>;
    /**
     * Obtém informações de hover para um símbolo
     */
    getHoverInfo(symbol: string, context: string): Promise<HoverInfo>;
    /**
     * Analisa dependências de um arquivo
     */
    analyzeDependencies(filePath: string): Promise<DependencyAnalysis>;
    /**
     * Busca símbolos em todo o projeto
     */
    searchSymbols(query: string, fileExtensions?: string[]): Promise<SymbolDefinition[]>;
    /**
     * Extrai definições de código
     */
    private extractDefinitions;
    /**
     * Extrai referências de um símbolo no código
     */
    private extractReferences;
    /**
     * Determina o tipo de uso de um símbolo
     */
    private determineUsageType;
    /**
     * Extrai informações de hover
     */
    private extractHoverInfo;
    /**
     * Extrai dependências de um arquivo
     */
    private extractDependencies;
    /**
     * Obtém contexto ao redor de uma linha
     */
    private getContext;
    /**
     * Encontra arquivos relacionados
     */
    private findRelatedFiles;
    /**
     * Obtém todos os arquivos do projeto
     */
    private getAllProjectFiles;
    /**
     * Analisa impacto de mudanças
     */
    private analyzeImpact;
    /**
     * Limpa cache
     */
    clearCache(): void;
}
//# sourceMappingURL=lsp-service.d.ts.map
/**
 * Serviço LSP (Language Server Protocol) para PAGIA
 * Implementa funcionalidades de navegação e análise de código
 */

import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';

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

export class LSPService {
    private cache: Map<string, any> = new Map();
    private projectRoot: string;

    constructor(projectRoot: string = process.cwd()) {
        this.projectRoot = projectRoot;
    }

    /**
     * Encontra a definição de um símbolo no código
     */
    async goToDefinition(symbol: string, filePath: string, code: string): Promise<SymbolDefinition> {
        const cacheKey = `definition:${symbol}:${filePath}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Extrair definições do código
        const definitions = this.extractDefinitions(code, filePath);
        const definition = definitions.find(def => def.symbol === symbol);

        if (definition) {
            this.cache.set(cacheKey, definition);
            return definition;
        }

        // Buscar em arquivos relacionados
        const relatedFiles = await this.findRelatedFiles(filePath);
        for (const file of relatedFiles) {
            try {
                const fileContent = await fs.readFile(file, 'utf-8');
                const fileDefinitions = this.extractDefinitions(fileContent, file);
                const fileDefinition = fileDefinitions.find(def => def.symbol === symbol);

                if (fileDefinition) {
                    this.cache.set(cacheKey, fileDefinition);
                    return fileDefinition;
                }
            } catch (error) {
                console.warn(`Erro ao ler arquivo ${file}:`, error);
            }
        }

        throw new Error(`Definição não encontrada para o símbolo: ${symbol}`);
    }

    /**
     * Encontra todas as referências de um símbolo
     */
    async findReferences(symbol: string, codebasePaths: string[]): Promise<{
        symbol: string;
        totalReferences: number;
        references: Reference[];
        impactAnalysis: string;
    }> {
        const references: Reference[] = [];

        for (const filePath of codebasePaths) {
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const fileReferences = this.extractReferences(content, symbol, filePath);
                references.push(...fileReferences);
            } catch (error) {
                console.warn(`Erro ao processar arquivo ${filePath}:`, error);
            }
        }

        const impactAnalysis = this.analyzeImpact(references);

        return {
            symbol,
            totalReferences: references.length,
            references,
            impactAnalysis
        };
    }

    /**
     * Obtém informações de hover para um símbolo
     */
    async getHoverInfo(symbol: string, context: string): Promise<HoverInfo> {
        const cacheKey = `hover:${symbol}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Extrair informações do contexto
        const hoverInfo = this.extractHoverInfo(symbol, context);

        if (hoverInfo) {
            this.cache.set(cacheKey, hoverInfo);
            return hoverInfo;
        }

        throw new Error(`Informações não encontradas para o símbolo: ${symbol}`);
    }

    /**
     * Analisa dependências de um arquivo
     */
    async analyzeDependencies(filePath: string): Promise<DependencyAnalysis> {
        const cacheKey = `dependencies:${filePath}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const analysis = this.extractDependencies(content, filePath);

            this.cache.set(cacheKey, analysis);
            return analysis;
        } catch (error) {
            throw new Error(`Erro ao analisar dependências do arquivo ${filePath}: ${error}`);
        }
    }

    /**
     * Busca símbolos em todo o projeto
     */
    async searchSymbols(query: string, fileExtensions: string[] = ['.ts', '.js']): Promise<SymbolDefinition[]> {
        const allFiles = await this.getAllProjectFiles(fileExtensions);
        const symbols: SymbolDefinition[] = [];

        for (const file of allFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const definitions = this.extractDefinitions(content, file);
                const matchingSymbols = definitions.filter(def =>
                    def.symbol.toLowerCase().includes(query.toLowerCase())
                );
                symbols.push(...matchingSymbols);
            } catch (error) {
                console.warn(`Erro ao processar arquivo ${file}:`, error);
            }
        }

        return symbols;
    }

    /**
     * Extrai definições de código
     */
    private extractDefinitions(code: string, filePath: string): SymbolDefinition[] {
        const definitions: SymbolDefinition[] = [];
        const lines = code.split('\n');

        // Padrões para diferentes tipos de definições
        const patterns = [
            { regex: /^(\s*)(export\s+)?(async\s+)?function\s+(\w+)/, type: 'function' },
            { regex: /^(\s*)(export\s+)?(abstract\s+)?class\s+(\w+)/, type: 'class' },
            { regex: /^(\s*)(export\s+)?(const|let|var)\s+(\w+)/, type: 'variable' },
            { regex: /^(\s*)(export\s+)?interface\s+(\w+)/, type: 'interface' },
            { regex: /^(\s*)(export\s+)?type\s+(\w+)/, type: 'type' },
            { regex: /^(\s*)import\s+.*from\s+['"](.+)['"]/g, type: 'module' }
        ];

        lines.forEach((line, index) => {
            for (const pattern of patterns) {
                const match = line.match(pattern.regex);
                if (match) {
                    const symbol = match[pattern.type === 'module' ? 2 : 4] || match[3];
                    if (symbol && !symbol.startsWith('_')) { // Ignorar símbolos privados
                        definitions.push({
                            symbol,
                            file: filePath,
                            line: index + 1,
                            column: line.indexOf(symbol) + 1,
                            type: pattern.type as any,
                            signature: line.trim(),
                            context: this.getContext(lines, index, 3)
                        });
                    }
                }
            }
        });

        return definitions;
    }

    /**
     * Extrai referências de um símbolo no código
     */
    private extractReferences(code: string, symbol: string, filePath: string): Reference[] {
        const references: Reference[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            // Encontrar todas as ocorrências do símbolo
            let position = 0;
            while ((position = line.indexOf(symbol, position)) !== -1) {
                // Verificar se é uma referência válida (não parte de outra palavra)
                const beforeChar = position > 0 ? line[position - 1] : ' ';
                const afterChar = position + symbol.length < line.length ? line[position + symbol.length] : ' ';

                const isValidReference = (
                    /\W/.test(beforeChar) && /\W/.test(afterChar) ||
                    position === 0 && /\W/.test(afterChar) ||
                    /\W/.test(beforeChar) && position + symbol.length === line.length
                );

                if (isValidReference) {
                    references.push({
                        file: filePath,
                        line: index + 1,
                        column: position + 1,
                        usageType: this.determineUsageType(line, symbol),
                        context: this.getContext(lines, index, 2)
                    });
                }
                position += symbol.length;
            }
        });

        return references;
    }

    /**
     * Determina o tipo de uso de um símbolo
     */
    private determineUsageType(line: string, symbol: string): Reference['usageType'] {
        if (line.includes(`function ${symbol}`) || line.includes(`class ${symbol}`)) {
            return 'declaration';
        } else if (line.includes(`import`) && line.includes(symbol)) {
            return 'import';
        } else if (line.includes(`${symbol}(`)) {
            return 'call';
        } else if (line.includes(`extends ${symbol}`) || line.includes(`implements ${symbol}`)) {
            return 'extension';
        } else {
            return 'reference';
        }
    }

    /**
     * Extrai informações de hover
     */
    private extractHoverInfo(symbol: string, context: string): HoverInfo | null {
        // Esta seria uma implementação mais complexa usando AST
        // Por simplicidade, retornamos uma estrutura básica
        return {
            symbol,
            signature: `${symbol}(): any`,
            documentation: `Documentação para ${symbol}`,
            parameters: [],
            returns: { type: 'any', description: 'Valor de retorno' }
        };
    }

    /**
     * Extrai dependências de um arquivo
     */
    private extractDependencies(code: string, filePath: string): DependencyAnalysis {
        const imports: string[] = [];
        const exports: string[] = [];
        const externalDependencies: string[] = [];
        const moduleRelations: DependencyAnalysis['moduleRelations'] = [];

        const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
        const exportRegex = /export\s+(?:{[^}]+}|(?:async\s+)?function\s+\w+|class\s+\w+)/g;

        let match;
        while ((match = importRegex.exec(code)) !== null) {
            const importPath = match[1];
            imports.push(importPath);

            if (importPath.startsWith('.') || importPath.startsWith('/')) {
                moduleRelations.push({
                    from: filePath,
                    to: importPath,
                    type: 'import'
                });
            } else {
                externalDependencies.push(importPath);
            }
        }

        while ((match = exportRegex.exec(code)) !== null) {
            exports.push(match[0]);
        }

        return {
            file: filePath,
            imports,
            exports,
            externalDependencies,
            moduleRelations,
            issues: [],
            unusedDependencies: []
        };
    }

    /**
     * Obtém contexto ao redor de uma linha
     */
    private getContext(lines: string[], lineIndex: number, contextLines: number): string {
        const start = Math.max(0, lineIndex - contextLines);
        const end = Math.min(lines.length, lineIndex + contextLines + 1);
        return lines.slice(start, end).join('\n');
    }

    /**
     * Encontra arquivos relacionados
     */
    private async findRelatedFiles(filePath: string): Promise<string[]> {
        const dir = dirname(filePath);
        try {
            const files = await fs.readdir(dir);
            return files
                .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
                .map(file => join(dir, file))
                .filter(file => file !== filePath);
        } catch (error) {
            return [];
        }
    }

    /**
     * Obtém todos os arquivos do projeto
     */
    private async getAllProjectFiles(extensions: string[]): Promise<string[]> {
        const files: string[] = [];

        async function walk(dir: string) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = join(dir, entry.name);

                    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                        await walk(fullPath);
                    } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Ignorar diretórios inacessíveis
            }
        }

        await walk(this.projectRoot);
        return files;
    }

    /**
     * Analisa impacto de mudanças
     */
    private analyzeImpact(references: Reference[]): string {
        const filesAffected = new Set(references.map(ref => ref.file));
        const usageTypes = references.map(ref => ref.usageType);

        return `Mudança afeta ${filesAffected.size} arquivos e ${references.length} referências. Tipos de uso: ${[...new Set(usageTypes)].join(', ')}`;
    }

    /**
     * Limpa cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}
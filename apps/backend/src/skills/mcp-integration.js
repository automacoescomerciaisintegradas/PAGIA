/**
 * PAGIA - MCP Tools Integration for Skills
 * Permite que skills utilizem ferramentas MCP
 *
 * @module skills/mcp-integration
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
/**
 * Gerenciador de ferramentas MCP para Skills
 */
export class MCPToolsManager {
    availableTools = new Map();
    toolHandlers = new Map();
    constructor() {
        this.registerDefaultTools();
    }
    /**
     * Registra ferramentas MCP padrão
     */
    registerDefaultTools() {
        // File System Tools
        this.registerTool({
            name: 'read_file',
            description: 'Lê conteúdo de um arquivo',
            inputSchema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Caminho do arquivo' },
                },
                required: ['path'],
            },
        }, this.handleReadFile.bind(this));
        this.registerTool({
            name: 'list_directory',
            description: 'Lista arquivos em um diretório',
            inputSchema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Caminho do diretório' },
                },
                required: ['path'],
            },
        }, this.handleListDirectory.bind(this));
        // Web Tools
        this.registerTool({
            name: 'web_search',
            description: 'Busca informações na web',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Termo de busca' },
                },
                required: ['query'],
            },
        }, this.handleWebSearch.bind(this));
        // Code Analysis Tools
        this.registerTool({
            name: 'analyze_code',
            description: 'Analisa código para métricas de qualidade',
            inputSchema: {
                type: 'object',
                properties: {
                    code: { type: 'string', description: 'Código a analisar' },
                    language: { type: 'string', description: 'Linguagem de programação' },
                },
                required: ['code'],
            },
        }, this.handleAnalyzeCode.bind(this));
    }
    /**
     * Registra uma nova ferramenta MCP
     */
    registerTool(tool, handler) {
        this.availableTools.set(tool.name, tool);
        this.toolHandlers.set(tool.name, handler);
    }
    /**
     * Lista ferramentas disponíveis
     */
    listTools() {
        return Array.from(this.availableTools.values());
    }
    /**
     * Executa uma ferramenta MCP
     */
    async executeTool(toolCall) {
        const handler = this.toolHandlers.get(toolCall.tool);
        if (!handler) {
            return {
                content: `Ferramenta não encontrada: ${toolCall.tool}`,
                isError: true,
            };
        }
        try {
            return await handler(toolCall.arguments);
        }
        catch (error) {
            return {
                content: `Erro ao executar ferramenta: ${error instanceof Error ? error.message : String(error)}`,
                isError: true,
            };
        }
    }
    /**
     * Verifica se uma skill pode usar ferramentas MCP
     */
    canUseTools(skillFrontmatter) {
        return Array.isArray(skillFrontmatter.tools) && skillFrontmatter.tools.length > 0;
    }
    /**
     * Obtém ferramentas permitidas para uma skill
     */
    getAllowedTools(skillFrontmatter) {
        if (!this.canUseTools(skillFrontmatter)) {
            return [];
        }
        const allowedToolNames = skillFrontmatter.tools;
        return allowedToolNames
            .map(name => this.availableTools.get(name))
            .filter((tool) => tool !== undefined);
    }
    // ==================== Tool Handlers ====================
    async handleReadFile(args) {
        try {
            if (!existsSync(args.path)) {
                return {
                    content: `Arquivo não encontrado: ${args.path}`,
                    isError: true,
                };
            }
            const content = readFileSync(args.path, 'utf-8');
            return {
                content: content,
            };
        }
        catch (error) {
            return {
                content: `Erro ao ler arquivo: ${error instanceof Error ? error.message : String(error)}`,
                isError: true,
            };
        }
    }
    async handleListDirectory(args) {
        try {
            const { readdirSync, statSync } = await import('fs');
            if (!existsSync(args.path)) {
                return {
                    content: `Diretório não encontrado: ${args.path}`,
                    isError: true,
                };
            }
            const files = readdirSync(args.path);
            const fileList = files.map(file => {
                const fullPath = join(args.path, file);
                const stats = statSync(fullPath);
                return {
                    name: file,
                    type: stats.isDirectory() ? 'directory' : 'file',
                    size: stats.size,
                };
            });
            return {
                content: JSON.stringify(fileList, null, 2),
            };
        }
        catch (error) {
            return {
                content: `Erro ao listar diretório: ${error instanceof Error ? error.message : String(error)}`,
                isError: true,
            };
        }
    }
    async handleWebSearch(args) {
        // Placeholder - integração real requer API de busca
        return {
            content: `Busca web não implementada ainda. Query: ${args.query}`,
        };
    }
    async handleAnalyzeCode(args) {
        try {
            const lines = args.code.split('\n');
            const analysis = {
                lines: lines.length,
                characters: args.code.length,
                language: args.language || 'unknown',
                complexity: this.calculateComplexity(args.code),
            };
            return {
                content: JSON.stringify(analysis, null, 2),
            };
        }
        catch (error) {
            return {
                content: `Erro ao analisar código: ${error instanceof Error ? error.message : String(error)}`,
                isError: true,
            };
        }
    }
    calculateComplexity(code) {
        // Análise simples de complexidade ciclomática
        const keywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
        let complexity = 1;
        for (const keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = code.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        }
        return complexity;
    }
}
// Singleton instance
export const mcpToolsManager = new MCPToolsManager();
//# sourceMappingURL=mcp-integration.js.map
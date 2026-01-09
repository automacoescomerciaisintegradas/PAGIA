/**
 * PAGIA - MCP Tools Integration for Skills
 * Permite que skills utilizem ferramentas MCP
 *
 * @module skills/mcp-integration
 */
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}
export interface MCPToolCall {
    tool: string;
    arguments: Record<string, any>;
}
export interface MCPToolResult {
    content: string;
    isError?: boolean;
}
/**
 * Gerenciador de ferramentas MCP para Skills
 */
export declare class MCPToolsManager {
    private availableTools;
    private toolHandlers;
    constructor();
    /**
     * Registra ferramentas MCP padrão
     */
    private registerDefaultTools;
    /**
     * Registra uma nova ferramenta MCP
     */
    registerTool(tool: MCPTool, handler: (args: any) => Promise<MCPToolResult>): void;
    /**
     * Lista ferramentas disponíveis
     */
    listTools(): MCPTool[];
    /**
     * Executa uma ferramenta MCP
     */
    executeTool(toolCall: MCPToolCall): Promise<MCPToolResult>;
    /**
     * Verifica se uma skill pode usar ferramentas MCP
     */
    canUseTools(skillFrontmatter: any): boolean;
    /**
     * Obtém ferramentas permitidas para uma skill
     */
    getAllowedTools(skillFrontmatter: any): MCPTool[];
    private handleReadFile;
    private handleListDirectory;
    private handleWebSearch;
    private handleAnalyzeCode;
    private calculateComplexity;
}
export declare const mcpToolsManager: MCPToolsManager;
//# sourceMappingURL=mcp-integration.d.ts.map
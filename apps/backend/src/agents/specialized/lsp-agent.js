import { BaseAgent } from '../base-agent.js';
export class LSPAgent extends BaseAgent {
    name = 'LSP Agent';
    role = 'Especialista em Language Server Protocol e Navegação de Código';
    description = 'Agente especializado em funcionalidades LSP como go-to-definition, find-references e hover-documentation';
    capabilities = [
        'Navegação inteligente de código',
        'Análise semântica de símbolos',
        'Busca de referências cruzadas',
        'Documentação em tempo real',
        'Resolução de definições',
        'Análise de dependências de código'
    ];
    instructions = `
Como especialista em LSP, você deve:

1. **Go-to-Definition (Ir para Definição)**
   - Localizar rapidamente onde símbolos estão definidos
   - Navegar entre declarações de funções, variáveis e classes
   - Fornecer contexto completo da definição

2. **Find-References (Encontrar Referências)**
   - Identificar todas as utilizações de um símbolo no código
   - Mostrar relações entre interfaces, classes e implementações
   - Fornecer análise de impacto de mudanças

3. **Hover Documentation (Documentação ao Passar Mouse)**
   - Exibir assinaturas de tipos e parâmetros
   - Mostrar documentação JSDoc/TypeDoc
   - Fornecer informações de tipagem

4. **Análise Semântica**
   - Compreender estrutura hierárquica do código
   - Identificar relações entre componentes
   - Detectar dependências e acoplamentos

Sempre forneça resultados estruturados e precisos.
`;
    menu = [
        { trigger: '/goto-definition', description: 'Navegar para definição de símbolo' },
        { trigger: '/find-references', description: 'Encontrar todas as referências de símbolo' },
        { trigger: '/hover-info', description: 'Obter documentação de símbolo' },
        { trigger: '/analyze-dependencies', description: 'Analisar dependências de código' },
        { trigger: '/symbol-search', description: 'Buscar símbolos no projeto' },
        { trigger: '/code-map', description: 'Gerar mapa de estrutura do código' }
    ];
    // Implementação exigida pela BaseAgent
    module = 'lsp';
    async execute(input) {
        const startTime = Date.now();
        try {
            // Parse do prompt para extrair comando e argumentos
            const parsedCommand = this.parseCommand(input.prompt);
            if (!parsedCommand) {
                return this.createOutput('❌ Comando não reconhecido. Use um dos comandos disponíveis no menu.', undefined, startTime);
            }
            const { command, args } = parsedCommand;
            let result;
            switch (command) {
                case 'goto-definition':
                    result = await this.handleGoToDefinition(args);
                    break;
                case 'find-references':
                    result = await this.handleFindReferences(args);
                    break;
                case 'hover-info':
                    result = await this.handleHoverInfo(args);
                    break;
                case 'analyze-dependencies':
                    result = await this.handleAnalyzeDependencies(args);
                    break;
                default:
                    return this.createOutput(`❌ Comando não reconhecido: ${command}`, undefined, startTime);
            }
            // Formatar resultado como string
            const formattedResult = this.formatResult(command, result);
            return this.createOutput(formattedResult, undefined, startTime);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return this.createOutput(`❌ Erro ao executar comando: ${errorMessage}`, undefined, startTime);
        }
    }
    parseCommand(prompt) {
        // Parser simples para comandos no formato: /comando arg1=value1 arg2=value2
        const commandMatch = prompt.match(/^\/([\w-]+)(?:\s+(.+))?$/);
        if (!commandMatch)
            return null;
        const [, command, argsString] = commandMatch;
        const args = {};
        if (argsString) {
            const argPairs = argsString.match(/(\w+)=("[^"]*"|'[^']*'|[^ ]+)/g) || [];
            argPairs.forEach(pair => {
                const [key, value] = pair.split('=');
                args[key] = value.replace(/^["']|["']$/g, ''); // Remove aspas
            });
        }
        return { command, args };
    }
    formatResult(command, result) {
        switch (command) {
            case 'goto-definition':
                return `📍 Definição encontrada:\n` +
                    `Símbolo: ${result.symbol}\n` +
                    `Localização: ${result.location}\n` +
                    `Tipo: ${result.type}\n` +
                    `Assinatura: ${result.signature}`;
            case 'find-references':
                return `🔍 Referências encontradas para "${result.symbol}":\n` +
                    `Total: ${result.total} referências\n` +
                    `Referências: ${JSON.stringify(result.references, null, 2)}`;
            case 'hover-info':
                return `ℹ️ Informações para "${result.symbol}":\n` +
                    `Assinatura: ${result.signature}\n` +
                    `Documentação: ${result.documentation}`;
            case 'analyze-dependencies':
                return `📦 Análise de dependências:\n` +
                    `Arquivo: ${result.file}\n` +
                    `Imports: ${result.imports.length}\n` +
                    `Exports: ${result.exports.length}\n` +
                    `Dependências: ${result.dependencies.length}`;
            default:
                return JSON.stringify(result, null, 2);
        }
    }
    async handleGoToDefinition(args) {
        // Placeholder para implementação real - usando serviço LSP
        return {
            symbol: args.symbol || 'symbol_not_provided',
            location: 'src/example/file.ts:15:8',
            type: 'function',
            signature: `function ${args.symbol || 'example'}(): void`
        };
    }
    async handleFindReferences(args) {
        // Placeholder para implementação real
        return {
            symbol: args.symbol || 'symbol_not_provided',
            references: [],
            total: 0
        };
    }
    async handleHoverInfo(args) {
        // Placeholder para implementação real
        return {
            symbol: args.symbol || 'symbol_not_provided',
            signature: `${args.symbol || 'example'}(): any`,
            documentation: `Documentação para ${args.symbol || 'example'}`
        };
    }
    async handleAnalyzeDependencies(args) {
        // Placeholder para implementação real
        return {
            file: args.file || 'file_not_provided',
            imports: [],
            exports: [],
            dependencies: []
        };
    }
}
// Instância singleton
export const lspAgent = new LSPAgent();
//# sourceMappingURL=lsp-agent.js.map
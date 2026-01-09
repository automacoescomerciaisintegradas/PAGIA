/**
 * PAGIA - MCP Command
 * Gerenciamento do servidor MCP
 *
 * @module commands/mcp
 * @author Automações Comerciais Integradas
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { getConfigManager } from '../core/config-manager.js';
import { mcpServer } from '../mcp/mcp-server.js';
import { logger } from '../utils/logger.js';
export const mcpCommand = new Command('mcp')
    .description('Gerenciar servidor Model Context Protocol');
// Iniciar servidor
mcpCommand
    .command('start')
    .description('Iniciar servidor MCP')
    .option('-p, --port <port>', 'Porta do servidor', '3100')
    .action(async (options) => {
    const configManager = getConfigManager();
    if (!configManager.isInitialized()) {
        logger.error('PAGIA não está inicializado.');
        process.exit(1);
    }
    const port = parseInt(options.port);
    if (mcpServer.isRunning()) {
        logger.warn(`Servidor MCP já está rodando na porta ${mcpServer.getPort()}`);
        return;
    }
    const spinner = logger.spin('Iniciando servidor MCP...');
    try {
        await mcpServer.start(port);
        spinner.succeed('Servidor MCP iniciado');
        logger.newLine();
        logger.box(`${chalk.bold('Servidor MCP Ativo')}\n\n` +
            `${chalk.gray('URL:')} http://localhost:${port}\n` +
            `${chalk.gray('WebSocket:')} ws://localhost:${port}\n` +
            `${chalk.gray('RPC:')} POST http://localhost:${port}/rpc\n\n` +
            `Pressione Ctrl+C para parar`, { title: '🔌 MCP Server', borderColor: 'green' });
        // Manter processo rodando
        process.on('SIGINT', async () => {
            logger.newLine();
            logger.info('Parando servidor MCP...');
            await mcpServer.stop();
            process.exit(0);
        });
        // Manter o processo vivo
        await new Promise(() => { });
    }
    catch (error) {
        spinner.fail('Erro ao iniciar servidor MCP');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
});
// Status do servidor
mcpCommand
    .command('status')
    .description('Verificar status do servidor MCP')
    .action(async () => {
    if (mcpServer.isRunning()) {
        logger.success(`Servidor MCP rodando na porta ${mcpServer.getPort()}`);
    }
    else {
        logger.info('Servidor MCP não está rodando');
        logger.info('Use `pagia mcp start` para iniciar');
    }
});
// Listar ferramentas
mcpCommand
    .command('tools')
    .description('Listar ferramentas MCP disponíveis')
    .action(async () => {
    // Verificar servidor local
    const port = 3100;
    try {
        const response = await fetch(`http://localhost:${port}/tools`);
        const data = await response.json();
        logger.section('Ferramentas MCP');
        for (const tool of data.tools) {
            console.log(`  ${chalk.cyan('•')} ${chalk.bold(tool.name)}`);
            console.log(`    ${chalk.gray(tool.description)}`);
            console.log();
        }
        logger.info(`Total: ${data.tools.length} ferramenta(s)`);
    }
    catch {
        logger.warn('Servidor MCP não está rodando');
        logger.info('Use `pagia mcp start` para iniciar');
    }
});
// Listar recursos
mcpCommand
    .command('resources')
    .description('Listar recursos MCP disponíveis')
    .action(async () => {
    const port = 3100;
    try {
        const response = await fetch(`http://localhost:${port}/resources`);
        const data = await response.json();
        logger.section('Recursos MCP');
        for (const resource of data.resources) {
            console.log(`  ${chalk.cyan('•')} ${chalk.bold(resource.name)}`);
            console.log(`    ${chalk.gray('URI:')} ${resource.uri}`);
            console.log(`    ${chalk.gray(resource.description)}`);
            console.log();
        }
        logger.info(`Total: ${data.resources.length} recurso(s)`);
    }
    catch {
        logger.warn('Servidor MCP não está rodando');
    }
});
// Testar ferramenta
mcpCommand
    .command('call <tool>')
    .description('Chamar uma ferramenta MCP')
    .option('-p, --params <json>', 'Parâmetros em JSON')
    .action(async (tool, options) => {
    const port = 3100;
    try {
        const params = options.params ? JSON.parse(options.params) : {};
        const response = await fetch(`http://localhost:${port}/tools/${tool}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });
        const data = await response.json();
        logger.section(`Resultado: ${tool}`);
        console.log(JSON.stringify(data, null, 2));
    }
    catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
    }
});
// Gerar configuração para IDE
mcpCommand
    .command('config <ide>')
    .description('Gerar configuração MCP para IDE')
    .action(async (ide) => {
    const port = 3100;
    logger.section(`Configuração MCP para ${ide}`);
    switch (ide.toLowerCase()) {
        case 'cursor':
            console.log(chalk.gray('Adicione ao .cursor/mcp.json:'));
            console.log(JSON.stringify({
                servers: {
                    pagia: {
                        url: `http://localhost:${port}`,
                        transport: 'http',
                    },
                },
            }, null, 2));
            break;
        case 'vscode':
            console.log(chalk.gray('Adicione ao .vscode/settings.json:'));
            console.log(JSON.stringify({
                'mcp.servers': {
                    pagia: {
                        endpoint: `http://localhost:${port}/rpc`,
                    },
                },
            }, null, 2));
            break;
        case 'claude':
            console.log(chalk.gray('Adicione ao claude_desktop_config.json:'));
            console.log(JSON.stringify({
                mcpServers: {
                    pagia: {
                        command: 'npx',
                        args: ['pagia', 'mcp', 'start'],
                    },
                },
            }, null, 2));
            break;
        case 'n8n':
            console.log(chalk.gray('Configure no N8N MCP Client Node:'));
            console.log(`
${chalk.bold('Opção 1: HTTP Transport')}
URL: http://localhost:${port}
Transport: HTTP

${chalk.bold('Opção 2: SSE Transport')}
URL: http://localhost:${port}/sse
Transport: SSE

${chalk.bold('Ferramentas disponíveis:')}
- pagia.listAgents
- pagia.executeAgent
- pagia.searchKnowledge
- pagia.status
- pagia.createNetwork
- pagia.runNetwork
- pagia.ingestCode
- pagia.ingestURL
`);
            console.log(chalk.yellow('Nota: Configure as credenciais de API se necessário.'));
            break;
        case 'gemini':
        case 'google':
            console.log(chalk.gray('Para Gemini Code Assist / Google AI Studio:'));
            console.log(`
${chalk.bold('Endpoint MCP:')}
URL: http://localhost:${port}
RPC: http://localhost:${port}/rpc

${chalk.bold('Para usar via API:')}
\`\`\`javascript
const response = await fetch('http://localhost:${port}/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
            name: 'pagia.listAgents',
            arguments: {}
        },
        id: 1
    })
});
\`\`\`
`);
            break;
        case 'windsurf':
        case 'codeium':
            console.log(chalk.gray('Configure no Windsurf/Codeium:'));
            console.log(JSON.stringify({
                mcpServers: {
                    pagia: {
                        serverUrl: `http://localhost:${port}`,
                        transport: 'http',
                    },
                },
            }, null, 2));
            break;
        case 'continue':
            console.log(chalk.gray('Adicione ao config.json do Continue:'));
            console.log(JSON.stringify({
                mcpServers: [{
                        name: 'pagia',
                        transport: {
                            type: 'http',
                            url: `http://localhost:${port}`
                        }
                    }]
            }, null, 2));
            break;
        default:
            logger.warn(`IDE "${ide}" não reconhecida`);
            logger.info('IDEs suportadas: cursor, vscode, claude, n8n, gemini, windsurf, continue');
            console.log(`
${chalk.bold('Configuração genérica:')}
URL HTTP: http://localhost:${port}
URL RPC: http://localhost:${port}/rpc
WebSocket: ws://localhost:${port}

${chalk.bold('Endpoints disponíveis:')}
GET  /tools          - Lista ferramentas
GET  /resources      - Lista recursos
POST /tools/:name    - Chama ferramenta
POST /rpc            - JSON-RPC 2.0
`);
    }
});
// LSP Mode - Inicia servidor LSP para integração com editores
mcpCommand
    .command('lsp')
    .description('Iniciar servidor em modo LSP (Language Server Protocol)')
    .option('-p, --port <port>', 'Porta do servidor', '3101')
    .option('--stdio', 'Usar stdio ao invés de TCP')
    .action(async (options) => {
    logger.section('PAGIA LSP Server');
    const port = parseInt(options.port);
    const spinner = logger.spin(`Iniciando LSP Server na porta ${port}...`);
    try {
        const { createServer } = await import('net');
        const server = createServer((socket) => {
            let buffer = '';
            socket.on('data', (data) => {
                buffer += data.toString();
                // Processar mensagens JSON-RPC
                const headerMatch = buffer.match(/Content-Length: (\d+)\r\n\r\n/);
                if (headerMatch) {
                    const contentLength = parseInt(headerMatch[1]);
                    const headerEnd = buffer.indexOf('\r\n\r\n') + 4;
                    const content = buffer.substring(headerEnd, headerEnd + contentLength);
                    if (content.length === contentLength) {
                        buffer = buffer.substring(headerEnd + contentLength);
                        handleLSPMessage(content, socket);
                    }
                }
            });
        });
        server.listen(port, () => {
            spinner.succeed(`LSP Server iniciado na porta ${port}`);
            logger.newLine();
            logger.box(`${chalk.bold('LSP Server Ativo')}

${chalk.gray('TCP:')} localhost:${port}
${chalk.gray('Modo:')} Language Server Protocol

${chalk.bold('Configuração Neovim:')}
${chalk.cyan(`cmd = { "nc", "localhost", "${port}" }`)}

${chalk.bold('Features:')}
• Completions para /comandos e @agentes
• Code Actions (Otimizar, Refatorar, Testar)
• Hover para informações de agentes

Pressione Ctrl+C para parar`, { title: '📡 LSP Server', borderColor: 'blue' });
        });
        process.on('SIGINT', () => {
            server.close();
            process.exit(0);
        });
        // Manter processo vivo
        await new Promise(() => { });
    }
    catch (error) {
        spinner.fail('Erro ao iniciar LSP Server');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
});
/**
 * Processa mensagem LSP e envia resposta
 */
function handleLSPMessage(content, socket) {
    try {
        const message = JSON.parse(content);
        let response = null;
        switch (message.method) {
            case 'initialize':
                response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: {
                        capabilities: {
                            textDocumentSync: 1,
                            completionProvider: {
                                resolveProvider: true,
                                triggerCharacters: ['/', '@', '#'],
                            },
                            codeActionProvider: true,
                            hoverProvider: true,
                        },
                        serverInfo: {
                            name: 'PAGIA LSP',
                            version: '1.0.0',
                        },
                    },
                };
                break;
            case 'initialized':
                // Notificação, sem resposta
                break;
            case 'textDocument/completion':
                response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: [
                        { label: '/optimize', kind: 3, detail: 'Otimizar código' },
                        { label: '/refactor', kind: 3, detail: 'Refatorar código' },
                        { label: '/test', kind: 3, detail: 'Gerar testes' },
                        { label: '/doc', kind: 3, detail: 'Gerar documentação' },
                        { label: '/explain', kind: 3, detail: 'Explicar código' },
                        { label: '/review', kind: 3, detail: 'Code review' },
                        { label: '@dev', kind: 3, detail: 'Agente Dev' },
                        { label: '@architect', kind: 3, detail: 'Agente Architect' },
                        { label: '@qa', kind: 3, detail: 'Agente QA' },
                        { label: '@code-optimizer', kind: 3, detail: 'Agente Otimizador' },
                    ],
                };
                break;
            case 'textDocument/hover':
                response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: {
                        contents: {
                            kind: 'markdown',
                            value: '**PAGIA**\n\nUse `/comando` ou `@agente` para ações de IA.',
                        },
                    },
                };
                break;
            case 'textDocument/codeAction':
                response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: [
                        {
                            title: '🚀 Otimizar com PAGIA',
                            kind: 'quickfix',
                            command: { title: 'Otimizar', command: 'pagia.optimize' },
                        },
                        {
                            title: '♻️ Refatorar com PAGIA',
                            kind: 'refactor',
                            command: { title: 'Refatorar', command: 'pagia.refactor' },
                        },
                        {
                            title: '🧪 Gerar testes com PAGIA',
                            kind: 'source',
                            command: { title: 'Gerar testes', command: 'pagia.test' },
                        },
                    ],
                };
                break;
            case 'shutdown':
                response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: null,
                };
                break;
            case 'exit':
                socket.end();
                break;
            default:
                // Método desconhecido
                if (message.id) {
                    response = {
                        jsonrpc: '2.0',
                        id: message.id,
                        error: {
                            code: -32601,
                            message: `Method not found: ${message.method}`,
                        },
                    };
                }
        }
        if (response) {
            sendLSPResponse(socket, response);
        }
    }
    catch (error) {
        console.error('LSP parse error:', error);
    }
}
/**
 * Envia resposta LSP formatada
 */
function sendLSPResponse(socket, response) {
    const content = JSON.stringify(response);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
    socket.write(header + content);
}
//# sourceMappingURL=mcp.js.map
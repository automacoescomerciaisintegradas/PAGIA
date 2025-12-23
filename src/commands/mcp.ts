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
            logger.box(
                `${chalk.bold('Servidor MCP Ativo')}\n\n` +
                `${chalk.gray('URL:')} http://localhost:${port}\n` +
                `${chalk.gray('WebSocket:')} ws://localhost:${port}\n` +
                `${chalk.gray('RPC:')} POST http://localhost:${port}/rpc\n\n` +
                `Pressione Ctrl+C para parar`,
                { title: '🔌 MCP Server', borderColor: 'green' }
            );

            // Manter processo rodando
            process.on('SIGINT', async () => {
                logger.newLine();
                logger.info('Parando servidor MCP...');
                await mcpServer.stop();
                process.exit(0);
            });

            // Manter o processo vivo
            await new Promise(() => { });
        } catch (error) {
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
        } else {
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
            const data = await response.json() as { tools: Array<{ name: string; description: string }> };

            logger.section('Ferramentas MCP');

            for (const tool of data.tools) {
                console.log(`  ${chalk.cyan('•')} ${chalk.bold(tool.name)}`);
                console.log(`    ${chalk.gray(tool.description)}`);
                console.log();
            }

            logger.info(`Total: ${data.tools.length} ferramenta(s)`);
        } catch {
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
            const data = await response.json() as { resources: Array<{ uri: string; name: string; description: string }> };

            logger.section('Recursos MCP');

            for (const resource of data.resources) {
                console.log(`  ${chalk.cyan('•')} ${chalk.bold(resource.name)}`);
                console.log(`    ${chalk.gray('URI:')} ${resource.uri}`);
                console.log(`    ${chalk.gray(resource.description)}`);
                console.log();
            }

            logger.info(`Total: ${data.resources.length} recurso(s)`);
        } catch {
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
        } catch (error) {
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

            default:
                logger.warn(`IDE "${ide}" não reconhecida`);
                logger.info('IDEs suportadas: cursor, vscode, claude');
        }
    });

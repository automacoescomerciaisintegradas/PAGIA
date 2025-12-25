/**
 * PAGIA - Agent Command
 * Gerenciamento de Agentes
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import inquirer from 'inquirer';
import { getConfigManager } from '../core/config-manager.js';
import { createAIService } from '../core/ai-service.js';
import { logger } from '../utils/logger.js';
import { setupBMADAgents, BMAD_AGENTS } from '../scripts/setup-bmad-agents.js';
import type { Agent } from '../types/index.js';

export const agentCommand = new Command('agent')
    .description('Gerenciar agentes PAGIA');

// List agents subcommand
agentCommand
    .command('list')
    .description('Listar agentes disponíveis')
    .option('-m, --module <module>', 'Filtrar por módulo')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const config = configManager.load()!;
        const pagiaFolder = configManager.getPagiaFolder();

        logger.section('Agentes Disponíveis');

        let totalAgents = 0;

        // Core agents
        const coreAgentsFolder = join(pagiaFolder, 'core', 'agents');
        if (existsSync(coreAgentsFolder) && (!options.module || options.module === 'core')) {
            const agents = listAgentsInFolder(coreAgentsFolder);
            if (agents.length > 0) {
                console.log(chalk.bold('🔧 Core'));
                agents.forEach((agent) => displayAgent(agent));
                totalAgents += agents.length;
                logger.newLine();
            }
        }

        // Module agents
        for (const module of config.modules.filter((m) => m.enabled)) {
            if (options.module && options.module !== module.code) continue;

            const moduleAgentsFolder = join(pagiaFolder, 'modules', module.code, 'agents');
            if (existsSync(moduleAgentsFolder)) {
                const agents = listAgentsInFolder(moduleAgentsFolder);
                if (agents.length > 0) {
                    const icon = getModuleIcon(module.code);
                    console.log(chalk.bold(`${icon} ${module.name}`));
                    agents.forEach((agent) => displayAgent(agent));
                    totalAgents += agents.length;
                    logger.newLine();
                }
            }
        }

        if (totalAgents === 0) {
            logger.info('Nenhum agente encontrado.');
            logger.info('Use `pagia agent create` para criar um agente.');
        } else {
            logger.info(`Total: ${totalAgents} agente(s)`);
        }
    });

// Create agent subcommand
agentCommand
    .command('create')
    .description('Criar novo agente')
    .option('-n, --name <name>', 'Nome do agente')
    .option('-m, --module <module>', 'Módulo do agente')
    .option('--ai', 'Usar IA para gerar instruções')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const config = configManager.load()!;

        // Get agent details
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Nome do agente:',
                default: options.name,
                validate: (input) => input.trim() ? true : 'Nome é obrigatório',
            },
            {
                type: 'list',
                name: 'module',
                message: 'Módulo do agente:',
                default: options.module,
                choices: [
                    { name: '🔧 Core', value: 'core' },
                    ...config.modules
                        .filter((m) => m.enabled && m.code !== 'core')
                        .map((m) => ({
                            name: `${getModuleIcon(m.code)} ${m.name}`,
                            value: m.code,
                        })),
                ],
            },
            {
                type: 'input',
                name: 'role',
                message: 'Papel/função do agente:',
                validate: (input) => input.trim() ? true : 'Papel é obrigatório',
            },
            {
                type: 'input',
                name: 'description',
                message: 'Descrição breve:',
            },
            {
                type: 'checkbox',
                name: 'capabilities',
                message: 'Capacidades do agente:',
                choices: [
                    'Análise de código',
                    'Geração de tarefas',
                    'Planejamento',
                    'Revisão de código',
                    'Documentação',
                    'Testes',
                    'Debugging',
                    'Otimização',
                ],
            },
        ]);

        const spinner = logger.spin('Criando agente...');

        try {
            const agent: Agent = {
                id: generateId(),
                name: answers.name,
                role: answers.role,
                module: answers.module,
                description: answers.description,
                capabilities: answers.capabilities,
                instructions: '',
                menu: [],
            };

            // Generate instructions with AI if requested
            if (options.ai) {
                spinner.text = 'Gerando instruções com IA...';
                const aiService = createAIService(config.aiProvider);

                const response = await aiService.generate(
                    `Crie instruções detalhadas para um agente de IA com as seguintes características:
          - Nome: ${agent.name}
          - Papel: ${agent.role}
          - Descrição: ${agent.description}
          - Capacidades: ${agent.capabilities.join(', ')}
          
          As instruções devem ser claras, específicas e orientadas a resultados.
          Inclua diretrizes sobre como o agente deve se comportar e interagir.`,
                    'Você é um especialista em design de agentes de IA.'
                );

                agent.instructions = response.content;
            } else {
                agent.instructions = generateDefaultInstructions(agent);
            }

            // Determine save location - sanitize module name for filesystem
            const sanitizedModule = sanitizeFilename(answers.module);
            const agentsFolder = answers.module === 'core'
                ? join(configManager.getPagiaFolder(), 'core', 'agents')
                : join(configManager.getPagiaFolder(), 'modules', sanitizedModule, 'agents');

            if (!existsSync(agentsFolder)) {
                mkdirSync(agentsFolder, { recursive: true });
            }

            const agentFile = join(agentsFolder, `${sanitizeFilename(agent.name)}.md`);
            const agentContent = generateAgentMarkdown(agent);

            writeFileSync(agentFile, agentContent, 'utf-8');

            spinner.succeed(`Agente "${agent.name}" criado com sucesso!`);
            logger.keyValue('Arquivo', agentFile);
        } catch (error) {
            spinner.fail('Erro ao criar agente');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Run agent subcommand
agentCommand
    .command('run <name>')
    .description('Executar um agente')
    .option('-p, --prompt <prompt>', 'Prompt para o agente')
    .action(async (name, options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const config = configManager.load()!;
        const agentFile = findAgentFile(configManager.getPagiaFolder(), name, config);

        if (!agentFile) {
            logger.error(`Agente "${name}" não encontrado.`);
            process.exit(1);
        }

        const agentContent = readFileSync(agentFile, 'utf-8');
        const instructions = extractInstructions(agentContent);

        let prompt = options.prompt;
        if (!prompt) {
            const answer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'prompt',
                    message: `[${name}] Digite sua solicitação:`,
                },
            ]);
            prompt = answer.prompt;
        }

        const spinner = logger.spin('Processando...');

        try {
            const aiService = createAIService(config.aiProvider);
            const response = await aiService.generate(prompt, instructions);

            // Stop spinner safely (Windows compatibility)
            try {
                spinner.stop();
            } catch {
                // Ignore spinner errors on Windows
            }

            // Use simple output on Windows to avoid UV_HANDLE_CLOSING crash
            if (process.platform === 'win32') {
                console.log(`\n${'═'.repeat(60)}`);
                console.log(`🤖 ${name}`);
                console.log(`${'═'.repeat(60)}\n`);
                console.log(response.content);
                console.log(`\n${'─'.repeat(60)}`);
                console.log(`Tokens usados: ${response.tokensUsed || 'N/A'}`);

                // Force clean exit on Windows to avoid UV_HANDLE crash
                setTimeout(() => process.exit(0), 100);
            } else {
                logger.box(response.content, {
                    title: `🤖 ${name}`,
                    borderColor: 'green',
                });
                logger.keyValue('Tokens usados', String(response.tokensUsed || 'N/A'));
            }
        } catch (error) {
            spinner.fail('Erro ao executar agente');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Install BMAD agents subcommand
agentCommand
    .command('bmad')
    .description('Instalar agentes BMAD Method (Analyst, PO, Architect, Scrum Master, QA)')
    .option('-l, --list', 'Apenas listar agentes BMAD disponíveis')
    .action(async (options) => {
        if (options.list) {
            logger.section('Agentes BMAD Method Disponíveis');
            console.log(chalk.gray('Baseados no BMAD - Breakthrough Method for Agile AI-Driven Development\n'));

            for (const agent of BMAD_AGENTS) {
                console.log(`  ${chalk.cyan('•')} ${chalk.bold(agent.name)} - ${agent.role}`);
                console.log(`    ${chalk.gray(agent.description)}`);
                console.log(`    ${chalk.gray('Comandos:')} ${agent.menu.map(m => m.trigger).join(', ')}\n`);
            }

            console.log(chalk.yellow('\nPara instalar: pagia agent bmad'));
            return;
        }

        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        logger.section('Instalando Agentes BMAD Method');

        await setupBMADAgents();

        logger.newLine();
        logger.box(
            `${chalk.bold('Agentes BMAD instalados!')}

Use os seguintes comandos:
${chalk.cyan('pagia agent run analyst')} - Análise de mercado
${chalk.cyan('pagia agent run product-owner')} - PRDs e User Stories
${chalk.cyan('pagia agent run architect')} - Arquitetura de software
${chalk.cyan('pagia agent run scrum-master')} - Sprints e gestão ágil
${chalk.cyan('pagia agent run qa')} - Testes e qualidade`,
            { title: '✅ Sucesso', borderColor: 'green' }
        );
    });

// Helper functions
function listAgentsInFolder(folder: string): { name: string; file: string }[] {
    if (!existsSync(folder)) return [];

    return readdirSync(folder)
        .filter((f) => f.endsWith('.md'))
        .map((f) => ({
            name: f.replace('.md', ''),
            file: join(folder, f),
        }));
}

function displayAgent(agent: { name: string; file: string }): void {
    const content = readFileSync(agent.file, 'utf-8');
    const role = extractRole(content);
    console.log(`  ${chalk.cyan('•')} ${agent.name}${role ? chalk.gray(` - ${role}`) : ''}`);
}

function extractRole(content: string): string {
    const match = content.match(/## Papel\s*\n([^\n]+)/);
    return match ? match[1].trim() : '';
}

function extractInstructions(content: string): string {
    const match = content.match(/## Instruções\s*\n([\s\S]+?)(?=\n## |$)/);
    return match ? match[1].trim() : content;
}

function findAgentFile(pagiaFolder: string, name: string, config: any): string | null {
    const sanitizedName = sanitizeFilename(name);
    const possiblePaths = [
        join(pagiaFolder, 'core', 'agents', `${sanitizedName}.md`),
        join(pagiaFolder, 'core', 'agents', `${name}.md`),
    ];

    for (const module of config.modules.filter((m: any) => m.enabled)) {
        possiblePaths.push(
            join(pagiaFolder, 'modules', module.code, 'agents', `${sanitizedName}.md`),
            join(pagiaFolder, 'modules', module.code, 'agents', `${name}.md`)
        );
    }

    for (const path of possiblePaths) {
        if (existsSync(path)) return path;
    }

    return null;
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeFilename(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getModuleIcon(moduleCode: string): string {
    const icons: Record<string, string> = {
        'global-plan': '📊',
        'stage-plan': '📋',
        'prompt-plan': '💬',
        'ai-plan': '🤖',
        core: '🔧',
    };
    return icons[moduleCode] || '📦';
}

function generateDefaultInstructions(agent: Agent): string {
    return `Você é ${agent.name}, um agente especializado em ${agent.role}.

${agent.description}

## Suas Capacidades
${agent.capabilities.map((c) => `- ${c}`).join('\n')}

## Diretrizes
1. Seja claro e objetivo nas respostas
2. Forneça exemplos quando apropriado
3. Sempre considere o contexto do projeto
4. Sugira próximos passos quando relevante`;
}

function generateAgentMarkdown(agent: Agent): string {
    return `# ${agent.name}

## Papel
${agent.role}

## Descrição
${agent.description}

## Capacidades
${agent.capabilities.map((c) => `- ${c}`).join('\n')}

## Instruções
${agent.instructions}

## Menu
- \`/help\` - Exibir ajuda
- \`/analyze\` - Analisar contexto
- \`/execute\` - Executar tarefa

---
*Agente criado em ${new Date().toISOString()}*
`;
}

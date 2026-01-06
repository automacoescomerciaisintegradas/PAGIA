/**
 * PAGIA - Agent Command
 * Gerenciamento de Agentes
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import { getConfigManager } from '../core/config-manager.js';
import { createAIService } from '../core/ai-service.js';
import { getRouterManager } from '../core/router-manager.js';
import { logger } from '../utils/logger.js';
import { setupBMADAgents, BMAD_AGENTS } from '../scripts/setup-bmad-agents.js';
import { pluginManager } from '../core/plugin-system.js';
import type { Agent } from '../types/index.js';
import { agentRegistry } from '../agents/agent-registry.js';
import { validateAgentMarkdownFile } from '../agents/agent-md-validator.js';

export const agentCommand = new Command('agent')
    .description('Gerenciar agentes PAGIA');

// List agents subcommand
agentCommand
    .command('list')
    .description('Listar agentes disponíveis')
    .option('-m, --module <module>', 'Filtrar por módulo')
    .option('-v, --verbose', 'Mostrar detalhes adicionais')
    .action(async (options) => {
        logger.section('Agentes Disponíveis');

        const agentsList: any[] = [];
        const seenAgents = new Set<string>();

        // Helper to get active provider info
        const configManager = getConfigManager();
        let providerInfo = 'Generic/Unknown';

        try {
            const config = configManager.isInitialized() ? configManager.load() : null;
            const aiConfig = config?.aiProvider || getDefaultAIProvider();
            providerInfo = `${aiConfig.type}`;
            if (aiConfig.model) providerInfo += `/${aiConfig.model}`;
        } catch (e) {
            providerInfo = 'Not Configured';
        }

        // 1. Gather Bundled Agents
        const bundledAgentsFolder = getBundledAgentsFolder();
        if (bundledAgentsFolder && existsSync(bundledAgentsFolder) && (!options.module || options.module === 'core')) {
            const agents = listAgentsInFolder(bundledAgentsFolder);
            agents.forEach(a => {
                if (!seenAgents.has(a.name)) {
                    const content = readFileSync(a.file, 'utf-8');
                    agentsList.push({
                        Name: a.name,
                        Role: extractRole(content) || 'N/A',
                        Module: 'Core (Bundled)',
                        Provider: providerInfo,
                        Status: 'Available'
                    });
                    seenAgents.add(a.name);
                }
            });
        }

        // 2. Gather Local Agents
        if (configManager.isInitialized()) {
            const config = configManager.load()!;
            const pagiaFolder = configManager.getPagiaFolder();

            // Core Local
            const coreAgentsFolder = join(pagiaFolder, 'core', 'agents');
            if (existsSync(coreAgentsFolder) && (!options.module || options.module === 'core')) {
                const agents = listAgentsInFolder(coreAgentsFolder);
                agents.forEach(a => {
                    if (!seenAgents.has(a.name)) {
                        const content = readFileSync(a.file, 'utf-8');
                        agentsList.push({
                            Name: a.name,
                            Role: extractRole(content) || 'N/A',
                            Module: 'Core (Local)',
                            Provider: providerInfo,
                            Status: 'Available'
                        });
                        seenAgents.add(a.name);
                    }
                });
            }

            // Module Agents
            for (const module of config.modules.filter((m) => m.enabled)) {
                if (options.module && options.module !== module.code) continue;
                const moduleAgentsFolder = join(pagiaFolder, 'modules', module.code, 'agents');
                if (existsSync(moduleAgentsFolder)) {
                    const agents = listAgentsInFolder(moduleAgentsFolder);
                    agents.forEach(a => {
                        if (!seenAgents.has(a.name)) {
                            const content = readFileSync(a.file, 'utf-8');
                            agentsList.push({
                                Name: a.name,
                                Role: extractRole(content) || 'N/A',
                                Module: `${module.name}`,
                                Provider: providerInfo,
                                Status: 'Available'
                            });
                            seenAgents.add(a.name);
                        }
                    });
                }
            }
        }

        // 3. Programmatic Agents
        const programmatic = agentRegistry.list();
        programmatic.forEach(a => {
            if (!seenAgents.has(a.name)) {
                agentsList.push({
                    Name: a.name,
                    Role: a.role,
                    Module: a.module || 'System',
                    Provider: providerInfo, // Programmatic agents might use specific providers but we assume global for now
                    Status: agentRegistry.isEnabled(a.id) ? 'Enabled' : 'Disabled'
                });
                seenAgents.add(a.name);
            }
        });

        if (agentsList.length === 0) {
            logger.info('Nenhum agente encontrado.');
            logger.info('Use `pagia agent create` para criar um agente.');
        } else {
            // Display as Table
            console.table(agentsList);
            logger.info(`Total: ${agentsList.length} agente(s)`);
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

// Generate agent template subcommand
agentCommand
    .command('generate <name>')
    .description('Gerar template de arquivo .md para agente')
    .option('-m, --module <module>', 'Módulo do agente', 'core')
    .option('-o, --output <path>', 'Caminho de saída (opcional)')
    .action(async (name, options) => {
        const configManager = getConfigManager();

        const sanitized = sanitizeFilename(name);
        const filename = `${sanitized}.md`;

        const defaultContent = `# ${name}

## Papel
<Descreva o papel do agente>

## Descrição
<Breve descrição do agente>

## Capacidades
- exemplo

## Instruções
<Instruções detalhadas para o agente>

## Menu
- \`/exemplo\` - Comando de exemplo`;

        let targetPath = options.output;

        if (!targetPath) {
            if (configManager.isInitialized()) {
                const pagiaFolder = configManager.getPagiaFolder();
                const folder = options.module === 'core'
                    ? join(pagiaFolder, 'core', 'agents')
                    : join(pagiaFolder, 'modules', sanitizeFilename(options.module), 'agents');

                if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
                targetPath = join(folder, filename);
            } else {
                targetPath = join(process.cwd(), filename);
            }
        }

        if (existsSync(targetPath)) {
            logger.error(`Arquivo já existe: ${targetPath}`);
            process.exit(1);
        }

        writeFileSync(targetPath, defaultContent, 'utf-8');
        logger.success(`Template gerado: ${targetPath}`);
    });

// Validate agent markdown
agentCommand
    .command('validate <file>')
    .description('Validar estrutura de um arquivo de agente (.md)')
    .action(async (file) => {
        const result = validateAgentMarkdownFile(file);

        if (!result.valid) {
            console.error('ERROS:');
            for (const e of result.errors) console.error(`  - ${e}`);
        }

        if (result.warnings.length > 0) {
            console.warn('\nAVISOS:');
            for (const w of result.warnings) console.warn(`  - ${w}`);
        }

        if (result.valid && result.warnings.length === 0) {
            logger.success('Validação OK — o arquivo parece estar no formato esperado.');
        }

        if (!result.valid) process.exit(1);
    });

// Run agent subcommand
agentCommand
    .command('run <name>')
    .description('Executar um agente (Chat interativo)')
    .option('-p, --prompt <prompt>', 'Prompt inicial (execução única)')
    .action(async (name, options) => {
        const configManager = getConfigManager();

        // Buscar agente (primeiro embutido, depois local)
        const pagiaFolder = configManager.isInitialized() ? configManager.getPagiaFolder() : null;
        const config = configManager.isInitialized() ? configManager.load() : null;
        const agentFile = findAgentFile(pagiaFolder, name, config);

        if (!agentFile) {
            logger.error(`Agente "${name}" não encontrado.`);
            logger.info('Use `pagia agent list` para ver agentes disponíveis.');
            process.exit(1);
            return;
        }

        const agentContent = readFileSync(agentFile, 'utf-8');
        const instructions = extractInstructions(agentContent);

        // UI Header for agent session
        console.log(chalk.cyan(`\n  🤖 ${chalk.bold(name.toUpperCase())} Sessão iniciada`));
        console.log(chalk.gray(`  ${'─'.repeat(50)}`));

        let prompt = options.prompt;
        // Se prompt foi passado via flag, executa uma vez e sai. Se não, entra em modo interativo.
        let isInteractive = !prompt;

        // Loop principal para chat interativo
        do {
            if (isInteractive) {
                const answer = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'prompt',
                        message: chalk.cyan('>'),
                        prefix: '',
                    },
                ]);
                prompt = answer.prompt;

                if (!prompt || prompt.toLowerCase() === 'exit' || prompt.toLowerCase() === '/exit' || prompt.toLowerCase() === 'sair') {
                    console.log(chalk.yellow('\nEncerrando sessão do agente...'));
                    break;
                }
            }

            const spinner = logger.spin('Processando...');

            try {
                // Executar Hooks de Plugins (Sistema Extensível)
                await pluginManager.loadAll();
                await pluginManager.executeHooks('PreToolUse', { content: prompt, agent: name });

                // Determine routing task type based on agent name/role
                let taskType: 'code' | 'think' | 'default' = 'default';
                const lowerName = name.toLowerCase();
                if (lowerName.includes('dev') || lowerName.includes('code') || lowerName.includes('qa') || lowerName.includes('implement')) {
                    taskType = 'code';
                } else if (lowerName.includes('analyst') || lowerName.includes('architect') || lowerName.includes('think') || lowerName.includes('plan')) {
                    taskType = 'think';
                }

                // Router Integration
                const router = getRouterManager();
                await router.initialize();

                const route = await router.route({
                    taskType,
                    messages: [{ role: 'user', content: prompt }]
                });

                // Inject Base URL into ENV for AIService to pick up custom URLs
                if (route.apiBaseUrl) {
                    process.env[`${route.provider.toUpperCase()}_BASE_URL`] = route.apiBaseUrl;
                }

                const aiProviderConfig = {
                    type: route.provider as any,
                    apiKey: route.apiKey,
                    model: route.model,
                    temperature: 0.7,
                };

                // Inject Tool Use Instructions
                const toolInstructions = `
## Available Capabilities (Tools)
You can interacting with the file system. To create or overwrite a file, output strictly the following XML format:

<tool_use>
  <name>write_file</name>
  <parameters>
    <path>filename.ext</path>
    <content>
Your file content here...
    </content>
  </parameters>
</tool_use>

You can perform multiple tool calls in a single response if needed.
`;
                const fullInstructions = instructions + '\n' + toolInstructions;

                const aiService = createAIService(aiProviderConfig);
                const response = await aiService.generate(prompt, fullInstructions);

                // Tool Execution Logic
                const content = response.content;
                const toolRegex = /<tool_use>([\s\S]*?)<\/tool_use>/g;
                let match;
                let processedContent = content;

                while ((match = toolRegex.exec(content)) !== null) {
                    const toolBlock = match[1];
                    const nameMatch = toolBlock.match(/<name>(.*?)<\/name>/);
                    const pathMatch = toolBlock.match(/<path>(.*?)<\/path>/);
                    const contentMatch = toolBlock.match(/<content>([\s\S]*?)<\/content>/);

                    if (nameMatch && nameMatch[1] === 'write_file' && pathMatch && contentMatch) {
                        const filePath = pathMatch[1].trim();
                        const fileContent = contentMatch[1].trim(); // Careful with whitespace in actual code

                        // Sanitize path to current directory for safety
                        const safePath = join(process.cwd(), filePath.replace(/^(\.\.(\/|\\|$))+/, ''));

                        // Ensure dirs exist
                        const dir = safePath.substring(0, safePath.lastIndexOf(process.platform === 'win32' ? '\\' : '/'));
                        if (dir && !existsSync(dir)) {
                            mkdirSync(dir, { recursive: true });
                        }

                        writeFileSync(safePath, fileContent, 'utf-8');
                        logger.success(`Arquivo criado via Tool Use: ${filePath}`);

                        // Remove the tool block from display to keep it clean (optional, keeping it shows the action)
                    }
                }

                spinner.stop();

                // Premium output box
                logger.box(processedContent, {
                    title: `🤖 ${name}`,
                    borderColor: 'cyan',
                    padding: 1
                });

                // Status footer for the response
                const providerInfo = `${aiProviderConfig.type}/${aiProviderConfig.model}`;
                console.log(chalk.gray(`  ${'─'.repeat(50)}`));
                console.log(
                    chalk.gray(`  ${await getCurrentDir()} | ${chalk.cyan(providerInfo)} | ${chalk.green(response.tokensUsed || 0)} tokens`)
                );
                console.log('');

                // Reset prompt for next iteration in interactive mode
                if (isInteractive) {
                    prompt = null;
                }

            } catch (error) {
                spinner.fail('Erro ao executar agente');
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(errorMessage);

                if (errorMessage.includes('401') || errorMessage.includes('API Key inválida')) {
                    logger.newLine();
                    logger.warn('Parece que sua API Key é inválida ou expirou.');
                    logger.info('Você pode atualizar a configuração com:');
                    console.log(chalk.cyan('  pagia config set aiProvider.apiKey "SUA_NOVA_CHAVE"'));
                    if (!isInteractive) process.exit(1);
                }
            }
        } while (isInteractive);
    });

// Helper para pegar diretório atual formatado
async function getCurrentDir() {
    return process.cwd().split(/[\\/]/).pop();
}

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

function displayAgent(agent: { name: string; file?: string } | { name: string; role?: string; module?: string; capabilities?: string[]; enabled?: boolean }, verbose?: boolean): void {
    if ((agent as any).file) {
        const content = readFileSync((agent as any).file, 'utf-8');
        const role = extractRole(content);
        console.log(`  ${chalk.cyan('•')} ${agent.name}${role ? chalk.gray(` - ${role}`) : ''}`);

        if (verbose) {
            const caps = extractCapabilities(content);
            if (caps.length > 0) {
                console.log(chalk.gray(`    Capacidades: ${caps.join(', ')}`));
            }
        }

        return;
    }

    // Programmatic agent
    const role = (agent as any).role;
    console.log(`  ${chalk.cyan('•')} ${agent.name}${role ? chalk.gray(` - ${role}`) : ''}`);

    if (verbose) {
        const caps = (agent as any).capabilities || [];
        const moduleName = (agent as any).module || 'unknown';
        const enabled = (agent as any).enabled === false ? 'disabled' : 'enabled';
        if (caps.length > 0) console.log(chalk.gray(`    Capacidades: ${caps.join(', ')}`));
        console.log(chalk.gray(`    Módulo: ${moduleName} | Status: ${enabled}`));
    }
}

function extractRole(content: string): string {
    const match = content.match(/## Papel\s*\n([^\n]+)/);
    return match ? match[1].trim() : '';
}

function extractCapabilities(content: string): string[] {
    const match = content.match(/## Capacidades\s*\n([\s\S]+?)(?=\n## |$)/);
    if (!match) return [];
    return match[1].split('\n').map(s => s.replace(/^-\s*/, '').trim()).filter(Boolean);
}

function extractInstructions(content: string): string {
    const match = content.match(/## Instruções\s*\n([\s\S]+?)(?=\n## |$)/);
    return match ? match[1].trim() : content;
}

function findAgentFile(pagiaFolder: string | null, name: string, config: any): string | null {
    const sanitizedName = sanitizeFilename(name);
    const possiblePaths: string[] = [];

    // PRIMEIRO: Buscar nos agentes EMBUTIDOS do pacote
    const bundledFolder = getBundledAgentsFolder();
    if (bundledFolder) {
        possiblePaths.push(
            join(bundledFolder, `${sanitizedName}.md`),
            join(bundledFolder, `${name}.md`)
        );
    }

    // DEPOIS: Buscar nos agentes locais do projeto
    if (pagiaFolder) {
        possiblePaths.push(
            join(pagiaFolder, 'core', 'agents', `${sanitizedName}.md`),
            join(pagiaFolder, 'core', 'agents', `${name}.md`)
        );

        if (config?.modules) {
            for (const module of config.modules.filter((m: any) => m.enabled)) {
                possiblePaths.push(
                    join(pagiaFolder, 'modules', module.code, 'agents', `${sanitizedName}.md`),
                    join(pagiaFolder, 'modules', module.code, 'agents', `${name}.md`)
                );
            }
        }
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

/**
 * Retorna o caminho da pasta de agentes EMBUTIDOS no pacote PAGIA
 * Isso permite que os agentes funcionem globalmente sem precisar de pagia init
 */
function getBundledAgentsFolder(): string | null {
    // O pacote PAGIA está instalado em node_modules/pagia ou é o diretório atual
    // Vamos usar import.meta.url para encontrar o diretório do pacote

    try {
        // Caminho do arquivo atual (dist/commands/agent.js quando compilado)
        const currentFileUrl = import.meta.url;
        const currentFilePath = new URL(currentFileUrl).pathname;

        // No Windows, remove a barra inicial do caminho
        const normalizedPath = process.platform === 'win32'
            ? currentFilePath.slice(1)
            : currentFilePath;

        // O diretório do pacote PAGIA é dois níveis acima (dist/commands -> dist -> raiz)
        const packageRoot = join(normalizedPath, '..', '..', '..');

        // Os agentes embutidos estão em .pagia/core/agents dentro do pacote
        const bundledPath = join(packageRoot, '.pagia', 'core', 'agents');

        if (existsSync(bundledPath)) {
            return bundledPath;
        }

        // Alternativa: procurar na raiz do projeto PAGIA
        const altPath = join(packageRoot, '..', '.pagia', 'core', 'agents');
        if (existsSync(altPath)) {
            return altPath;
        }

        return null;
    } catch {
        return null;
    }
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

/**
 * Obtém configuração de AI Provider a partir das variáveis de ambiente
 * Usado quando PAGIA não está inicializado no projeto
 */
function getDefaultAIProvider(): any {
    // Detectar provider baseado nas env vars disponíveis
    const providers = [
        { type: 'groq', envKey: 'GROQ_API_KEY', model: 'llama-3.3-70b-versatile' },
        { type: 'gemini', envKey: 'GEMINI_API_KEY', model: 'gemini-2.0-flash-exp' },
        { type: 'openai', envKey: 'OPENAI_API_KEY', model: 'gpt-4o' },
        { type: 'anthropic', envKey: 'ANTHROPIC_API_KEY', model: 'claude-sonnet-4-20250514' },
        { type: 'deepseek', envKey: 'DEEPSEEK_API_KEY', model: 'deepseek-chat' },
        { type: 'mistral', envKey: 'MISTRAL_API_KEY', model: 'mistral-large-latest' },
        { type: 'openrouter', envKey: 'OPENROUTER_API_KEY', model: 'anthropic/claude-sonnet-4' },
    ];

    // Usar AI_PROVIDER se definido
    const preferredProvider = process.env.AI_PROVIDER?.toLowerCase();
    if (preferredProvider) {
        const provider = providers.find(p => p.type === preferredProvider);
        if (provider && process.env[provider.envKey]) {
            return {
                type: provider.type,
                apiKey: process.env[provider.envKey],
                model: process.env.AI_MODEL || provider.model,
                temperature: 0.7,
                maxTokens: 8192,
            };
        }
    }

    // Fallback: usar primeiro provider disponível
    for (const provider of providers) {
        if (process.env[provider.envKey]) {
            return {
                type: provider.type,
                apiKey: process.env[provider.envKey],
                model: process.env.AI_MODEL || provider.model,
                temperature: 0.7,
                maxTokens: 8192,
            };
        }
    }

    // Nenhum provider configurado
    throw new Error(
        'Nenhuma API key de IA configurada. Configure uma das seguintes variáveis de ambiente:\n' +
        '  - GROQ_API_KEY\n' +
        '  - GEMINI_API_KEY\n' +
        '  - OPENAI_API_KEY\n' +
        '  - ANTHROPIC_API_KEY\n' +
        'Ou inicialize o projeto com `pagia init`'
    );
}

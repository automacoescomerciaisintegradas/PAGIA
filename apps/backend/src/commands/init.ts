/**
 * PAGIA - Init Command
 * Inicialização Premium & Estruturada
 * Seguindo padrão de CLIs como Claude Code, Cursor e Windsurf
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { getConfigManager } from '../core/config-manager.js';
import { getGlobalConfig } from '../core/global-config.js';
import { getCredentialsManager } from '../core/credentials.js';
import { getWorkspaceStorage } from '../core/workspace-storage.js';
import {
    ensureGlobalDirectories,
    ensureProjectDirectories,
    getGlobalConfigDir,
    getProjectDirectoryStructure
} from '../core/paths.js';
import { logger } from '../utils/logger.js';
import type { AIProviderType, ModuleConfig } from '../types/index.js';
import { generateVibeProject } from '../utils/vibe-generator.js';
import { startDefaultREPL } from './chat.js';

export const initCommand = new Command('init')
    .description('Inicializar PAGIA ou geradores especializados')
    .option('-y, --yes', 'Usar configurações padrão')
    .action(async (options) => {
        await runMainInit(options);
    });



initCommand.command('vibe')
    .description('Inicializar um novo projeto AI Vibe full-stack (Cloudflare VibeSDK)')
    .option('-n, --name <name>', 'Nome do projeto', 'vibe-app')
    .action(async (cmdOptions) => {
        const projectName = cmdOptions.name;
        logger.info(`🛰️  Iniciando gerador Full-Stack AI Vibe (${chalk.cyan('Cloudflare VibeSDK')})...`);
        const spinner = logger.spin('Configurando boilerplate Premium...');

        try {
            await generateVibeProject({ projectName });

            spinner.succeed(`Projeto Full-Stack VibeSDK gerado com sucesso em ./${chalk.bold(projectName)}!`);
            logger.list([
                'As chaves de API foram sincronizadas automaticamente do Maestro.',
                'Configuração do Cloudflare Workers pronta: Hono + D1 + Vectorize + AI.',
                'Arquitetura de "Vibe Programming" pronta para o futuro.'
            ]);
            logger.info(`🚀 Para começar: ${chalk.cyan(`cd ${projectName} && npm install && npm run dev`)}`);
        } catch (err) {
            spinner.fail('Erro ao gerar projeto VibeSDK');
            logger.error(err instanceof Error ? err.message : String(err));
        }
    });

async function runMainInit(options: any) {
    // --- 1. Visual Welcome ---
    console.clear();
    console.log(
        chalk.cyan(
            figlet.textSync('PAGIA', {
                font: 'Slant',
                horizontalLayout: 'default',
                verticalLayout: 'default',
            })
        )
    );

    console.log(
        boxen(
            `${chalk.bold('Plano de Ação de Gestão e Implementação com IA')}\n` +
            `${chalk.dim('Inicializando ambiente de desenvolvimento orientado por especificações.')}`,
            {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'cyan',
                title: '🚀 Setup',
                titleAlignment: 'center',
            }
        )
    );

    const configManager = getConfigManager();

    // Check if already initialized
    try {
        if (configManager.isInitialized()) {
            const { action } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: chalk.yellow('PAGIA já está detectado neste projeto.'),
                    choices: [
                        { name: 'Entrar no Modo Interativo', value: 'interactive' },
                        { name: 'Atualizar configuração existente', value: 'update' },
                        { name: 'Reinstalar (Sobrescrever tudo)', value: 'overwrite' },
                        { name: 'Sair', value: 'cancel' },
                    ],
                },
            ]);

            if (action === 'interactive') {
                logger.info('Entrando no modo interativo...');
                await startDefaultREPL();
                return;
            }

            if (action === 'cancel') {
                logger.info('Operação cancelada.');
                return;
            }
            if (action === 'overwrite') {
                logger.warn('⚠️  Isso irá sobrescrever configurações e planos locais!');
                const { confirm } = await inquirer.prompt([{ type: 'confirm', name: 'confirm', message: 'Tem certeza?', default: false }]);
                if (!confirm) return;
            }
        }
    } catch (error: any) {
        // Handle prompt cancellation (e.g., user pressing ESC, Ctrl+C)
        if (error.name === 'ExitPromptError' || error.message?.includes('User force closed')) {
            logger.info('Operação cancelada pelo usuário.');
            return;
        }
        throw error; // Re-throw if it's a different error
    }

    // --- 2. Interactive Interview ---
    let answers;
    try {
        answers = await runSetupInterview(options.yes);
    } catch (error: any) {
        // Handle prompt cancellation during interview
        if (error.name === 'ExitPromptError' || error.message?.includes('User force closed')) {
            logger.info('Operação cancelada pelo usuário.');
            return;
        }
        throw error; // Re-throw if it's a different error
    }

    // --- 3. Construction Phase ---
    const spinner = logger.spin('Construindo a infraestrutura do PAGIA...');
    const start = Date.now();

    try {
        // A. Initialize Global Configuration (AppData/Roaming/PAGIA)
        spinner.text = 'Inicializando configuração global...';
        const globalConfig = getGlobalConfig();
        await globalConfig.initialize();
        ensureGlobalDirectories();

        // B. Initialize Core Config
        spinner.text = 'Gerando configurações do projeto...';
        const finalConfig = await configManager.initialize({
            userName: answers.userName,
            language: answers.language,
            debug: (answers as any).debug || false,
            aiProvider: {
                type: answers.aiProvider as AIProviderType,
                apiKey: resolveApiKey(answers) || '',
                model: getDefaultModel(answers.aiProvider as any) || 'gemini-2.0-flash-exp',
            },
            modules: createModulesConfig(answers.modules),
        });

        // C. Create Project Directory Structure (Complete .pagia/)
        spinner.text = 'Criando arquitetura de pastas do projeto...';
        const projectRoot = process.cwd();
        ensureProjectDirectories(projectRoot);
        const pagiaRoot = join(projectRoot, '.pagia');
        createConductorStructure(pagiaRoot);
        createProjectInstructions(pagiaRoot, answers);
        createProjectSettings(pagiaRoot, answers);

        // D. Initialize Workspace Storage
        spinner.text = 'Configurando armazenamento de workspace...';
        const workspaceStorage = getWorkspaceStorage(projectRoot);
        await workspaceStorage.initialize();

        // E. Import credentials from environment
        spinner.text = 'Importando credenciais...';
        const credentials = getCredentialsManager();
        await credentials.importFromEnvironment();

        // F. Add to recent workspaces
        await globalConfig.addRecentWorkspace(projectRoot);

        // G. Create Initial Global Plan
        spinner.text = 'Gerando Plano Global inicial...';
        createInitialGlobalPlan(join(pagiaRoot, 'conductor', 'global'), answers);

        // D. Create Documentation
        spinner.text = 'Gerando documentação do projeto...';
        createProjectReadme(pagiaRoot, answers);

        // E. Install Agents
        spinner.text = 'Instalando agentes inteligentes...';
        try {
            // Try dynamic import, handle relative path carefully
            // Assuming scripts/setup-bmad-agents.js exists relative to built source or original source
            // In dev: src/commands/init.ts -> ../scripts/setup-bmad-agents.ts
            // In prod: dist/commands/init.js -> ../scripts/setup-bmad-agents.js
            // We'll trust the existing structure for now, but catch errors
            const { setupBMADAgents } = await import('../scripts/setup-bmad-agents.js');
            await setupBMADAgents();
            await installExtraAgents(join(pagiaRoot, 'core', 'agents'));
        } catch (err) {
            logger.warn('Aviso: Não foi possível instalar alguns agentes padrão automaticamente. ' + err);
        }

        const duration = ((Date.now() - start) / 1000).toFixed(1);
        spinner.succeed(`Ambiente PAGIA configurado em ${duration}s!`);

        // --- 4. Final Summary ---
        showFinalSummary(finalConfig);

        // Enter Interactive Mode
        logger.info('Entrando no modo interativo...');
        await startDefaultREPL();

    } catch (error) {
        spinner.fail('Falha na inicialização');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}

// --- Helper Functions ---

async function runSetupInterview(skip: boolean) {
    if (skip) {
        return {
            projectName: 'Meu Projeto',
            projectGoal: 'Objetivo não definido',
            userName: process.env.USER_NAME || 'Dev',
            language: 'pt-BR',
            aiProvider: 'gemini',
            modules: ['global-plan', 'stage-plan', 'prompt-plan', 'ai-plan'],
            debug: false,
        };
    }

    return inquirer.prompt([
        // Project Context
        {
            type: 'input',
            name: 'projectName',
            message: 'Nome do Projeto:',
            default: detectProjectName(),
            validate: (input) => input.length > 0 || 'O nome não pode ser vazio',
        },
        {
            type: 'input',
            name: 'projectGoal',
            message: 'Objetivo Principal (Resumido):',
            default: 'Desenvolver uma solução robusta utilizando IA.',
        },
        // User Context
        {
            type: 'input',
            name: 'userName',
            message: 'Seu Nome (para os agentes):',
            default: process.env.USER || 'Developer',
        },
        {
            type: 'list',
            name: 'language',
            message: 'Idioma principal:',
            choices: [
                { name: '🇧🇷 Português (Brasil)', value: 'pt-BR' },
                { name: '🇺🇸 English', value: 'en' },
                { name: '🇪🇸 Español', value: 'es' },
            ],
            default: 'pt-BR',
        },
        // AI Configuration
        {
            type: 'list',
            name: 'aiProvider',
            message: 'Provedor de IA:',
            choices: [
                new inquirer.Separator(' === Recomendados === '),
                { name: '🔮 Google Gemini', value: 'gemini' },
                { name: '⚡ Groq (Llama 3)', value: 'groq' },
                { name: '🤖 OpenAI (GPT-4)', value: 'openai' },
                { name: '🧠 Anthropic (Claude)', value: 'anthropic' },
                new inquirer.Separator(' === Outros === '),
                { name: '🦙 Ollama (Local)', value: 'ollama' },
                { name: '🌊 DeepSeek', value: 'deepseek' },
                { name: '🔀 OpenRouter', value: 'openrouter' },
                { name: '☁️ Alibaba Qwen', value: 'qwen' },
                { name: '💻 AI Coder', value: 'coder' },
                { name: '🤖 Claude Coder', value: 'claude-coder' },
            ],
            default: 'gemini',
        },
        {
            type: 'password',
            name: 'apiKey',
            message: 'API Key (Enter para buscar no .env):',
            when: (answers) => answers.aiProvider !== 'ollama' && !getEnvApiKey(answers.aiProvider),
            mask: '*',
        },
        // Features
        {
            type: 'checkbox',
            name: 'modules',
            message: 'Módulos Ativos:',
            choices: [
                { name: 'Global Plan (Estratégico)', value: 'global-plan', checked: true },
                { name: 'Stage Plan (Tático)', value: 'stage-plan', checked: true },
                { name: 'Prompt Plan (Natural)', value: 'prompt-plan', checked: true },
                { name: 'AI Plan (Autônomo)', value: 'ai-plan', checked: true },
            ],
        },
    ]);
}

function detectProjectName(): string {
    try {
        const pkgPath = join(process.cwd(), 'package.json');
        if (existsSync(pkgPath)) {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            return pkg.name || 'meu-projeto';
        }
        return 'meu-projeto';
    } catch {
        return 'meu-projeto';
    }
}

function createConductorStructure(pagiaRoot: string) {
    const conductorPath = join(pagiaRoot, 'conductor');
    const dirs = [
        'global',
        'stages',
        'prompts',
        'ai',
        'archive'
    ];

    if (!existsSync(conductorPath)) mkdirSync(conductorPath, { recursive: true });

    dirs.forEach(dir => {
        const path = join(conductorPath, dir);
        if (!existsSync(path)) mkdirSync(path, { recursive: true });

        // Add .keep file
        writeFileSync(join(path, '.keep'), '', 'utf-8');
    });
}

function createInitialGlobalPlan(globalDir: string, answers: any) {
    const content = `id: ${Date.now().toString()}
name: ${answers.projectName}
type: global
description: ${answers.projectGoal}
status: planning
objectives:
  - Estabelecer a base do projeto
  - Configurar ambiente de desenvolvimento
  - Definir arquitetura principal
stages: []
milestones: []
createdAt: ${new Date().toISOString()}
updatedAt: ${new Date().toISOString()}
owner: ${answers.userName}
`;

    // Ensure directory exists
    if (!existsSync(globalDir)) mkdirSync(globalDir, { recursive: true });
    writeFileSync(join(globalDir, 'main.yaml'), content, 'utf-8');
}

function createProjectReadme(pagiaRoot: string, answers: any) {
    const content = `# Documentação Conductor - ${answers.projectName}

Esta pasta contém todos os planos de ação e a "memória" do projeto gerenciada pelo PAGIA.

## Estrutura de Pastas

### 1. \`/global\` (Estratégico)
Contém os objetivos de alto nível, OKRs e visão do produto. É o ponto de partida.

### 2. \`/stages\` (Tático)
Divide o projeto em etapas implementáveis (Sprints, Milestones ou Features).

### 3. \`/prompts\` (Entrada)
Planos gerados rapidamente a partir de prompts em linguagem natural.

### 4. \`/ai\` (Autônomo)
Planos gerados e geridos totalmente pelos agentes de IA.

## Comandos Úteis

- \`pagia status\`: Ver o estado atual.
- \`pagia plan create\`: Criar novo plano.
- \`pagia update todos\`: Sincronizar o progresso.
`;
    // Ensure parent dir exists (it was created in createConductorStructure but just to be safe)
    const conductorDir = join(pagiaRoot, 'conductor');
    if (!existsSync(conductorDir)) mkdirSync(conductorDir, { recursive: true });

    writeFileSync(join(conductorDir, 'README.md'), content, 'utf-8');
}

/**
 * Create PAGIA.md instructions file for the project
 * Similar to CLAUDE.md in Claude Code
 */
function createProjectInstructions(pagiaRoot: string, answers: any) {
    const content = `# ${answers.projectName} - PAGIA Instructions

Este arquivo contém instruções específicas para este projeto.
O PAGIA lerá este arquivo para entender o contexto do projeto.

## Sobre o Projeto

**Nome:** ${answers.projectName}
**Objetivo:** ${answers.projectGoal}
**Proprietário:** ${answers.userName}

## Arquitetura

Descreva aqui a arquitetura do projeto:

- Frontend: 
- Backend: 
- Banco de Dados: 
- Infraestrutura: 

## Convenções de Código

- Linguagem principal: 
- Framework: 
- Estilo de código: 

## Contexto Importante

Adicione aqui informações importantes que os agentes de IA devem saber:

---

## Tarefas em Andamento

<!-- O PAGIA atualizará esta seção automaticamente -->

## Histórico de Decisões

<!-- Decisões importantes tomadas no projeto -->

---
*Gerado automaticamente pelo PAGIA em ${new Date().toISOString()}*
`;

    const instructionsPath = join(pagiaRoot, 'PAGIA.md');
    if (!existsSync(instructionsPath)) {
        writeFileSync(instructionsPath, content, 'utf-8');
    }
}

/**
 * Create project settings.json file
 * Similar to .claude/settings.json in Claude Code
 */
function createProjectSettings(pagiaRoot: string, answers: any) {
    const settings = {
        project: {
            name: answers.projectName,
            goal: answers.projectGoal,
            language: answers.language,
        },
        ai: {
            provider: answers.aiProvider,
        },
        permissions: {
            allowFileEdit: true,
            allowFileCreate: true,
            allowFileDelete: false,
            allowCommandExecution: false,
            allowNetworkRequests: true,
        },
        context: {
            include: ["src/**/*", "lib/**/*", "app/**/*", "components/**/*"],
            exclude: ["node_modules/**", "dist/**", ".git/**", "*.log"],
        },
        mcpServers: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const settingsPath = join(pagiaRoot, 'settings.json');
    if (!existsSync(settingsPath)) {
        writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    }

    const localSettingsPath = join(pagiaRoot, 'settings.local.json');
    if (!existsSync(localSettingsPath)) {
        writeFileSync(localSettingsPath, JSON.stringify({}, null, 2), 'utf-8');
    }
}

function resolveApiKey(answers: any): string | undefined {
    if (answers.apiKey) return answers.apiKey;
    if (answers.aiProvider !== 'ollama') {
        const envKey = getEnvApiKey(answers.aiProvider);
        if (envKey) return `$env:${getEnvKeyName(answers.aiProvider)}`;
    }
    return undefined;
}

function getEnvApiKey(provider: string): string | undefined {
    // Basic mapping, extend as needed
    const map: Record<string, string> = {
        gemini: 'GEMINI_API_KEY',
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        groq: 'GROQ_API_KEY',
        qwen: 'QWEN_API_KEY',
        coder: 'CODER_API_KEY',
        'claude-coder': 'ANTHROPIC_API_KEY',
    };
    const key = map[provider] || `${provider.toUpperCase()}_API_KEY`;
    return process.env[key];
}

function getEnvKeyName(provider: string): string {
    const map: Record<string, string> = {
        gemini: 'GEMINI_API_KEY',
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        groq: 'GROQ_API_KEY',
    };
    return map[provider] || `${provider.toUpperCase()}_API_KEY`;
}

function getDefaultModel(provider: string): string {
    const models: Record<string, string> = {
        gemini: 'gemini-1.5-pro-latest',
        openai: 'gpt-4-turbo',
        anthropic: 'claude-3-opus-20240229',
        groq: 'llama3-70b-8192',
        ollama: 'llama3',
        qwen: 'qwen-max',
        coder: 'deepseek-coder-v2',
        'claude-coder': 'claude-3-5-sonnet-20241022',
    };
    return models[provider] || 'default-model';
}

function createModulesConfig(selected: string[]): ModuleConfig[] {
    const all = [
        { code: 'global-plan', name: 'Plano Global' },
        { code: 'stage-plan', name: 'Plano de Etapa' },
        { code: 'prompt-plan', name: 'Plano por Prompt' },
        { code: 'ai-plan', name: 'Plano IA' },
    ];

    return all.map(m => ({
        code: m.code,
        name: m.name,
        enabled: selected.includes(m.code),
        config: {}
    }));
}

async function installExtraAgents(agentsFolder: string) {
    if (!existsSync(agentsFolder)) mkdirSync(agentsFolder, { recursive: true });

    const extraAgents = [
        {
            id: 'dev',
            name: 'Dev',
            role: 'Agente de Desenvolvimento de Código',
            content: `# Dev
## Papel
Agente de Desenvolvimento de Código
## Descrição
Especialista em desenvolvimento, implementação e boas práticas.
`,
        },
        {
            id: 'plan-creator',
            name: 'Plan Creator',
            role: 'Especialista em Planejamento',
            content: `# Plan Creator
## Papel
Especialista em Planejamento Estratégico
## Descrição
Cria planos estruturados e detalhados.
`,
        },
    ];

    for (const agent of extraAgents) {
        const filePath = join(agentsFolder, `${agent.id}.md`);
        if (!existsSync(filePath)) {
            writeFileSync(filePath, agent.content, 'utf-8');
        }
    }
}

function showFinalSummary(config: any) {
    logger.newLine();
    console.log(
        boxen(
            `${chalk.green.bold('✅ PAGIA Inicializado com Sucesso!')}\n\n` +
            `${chalk.white('📂 Estrutura:')} .pagia/conductor criada\n` +
            `${chalk.white('🤖 Agente:')} ${config.aiProvider.type} (${config.aiProvider.model})\n` +
            `${chalk.white('👤 Usuário:')} ${config.userName}\n\n` +
            `${chalk.yellow('👉 Próximos Passos:')}\n` +
            `1. Edite o plano global: ${chalk.cyan('pagia plan view global')}\n` +
            `2. Crie tarefas: ${chalk.cyan('pagia plan create')}\n` +
            `3. Sincronize: ${chalk.cyan('pagia update todos')}`,
            {
                padding: 1,
                borderStyle: 'double',
                borderColor: 'green',
            }
        )
    );
}

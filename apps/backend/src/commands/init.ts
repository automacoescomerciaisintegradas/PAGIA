/**
 * PAGIA - Init Command
 * Inicialização Premium & Estruturada
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { getConfigManager } from '../core/config-manager.js';
import { logger } from '../utils/logger.js';
import type { AIProviderType, ModuleConfig } from '../types/index.js';

export const initCommand = new Command('init')
    .description('Inicializar PAGIA ou geradores especializados')
    .option('-y, --yes', 'Usar configurações padrão')
    .action(async (options) => {
        await runMainInit(options);
    });

initCommand.command('vibe')
    .description('Inicializar um novo projeto AI Vibe full-stack (Cloudflare VibeSDK)')
    .action(async () => {
        logger.info('🛰️  Iniciando gerador Full-Stack AI Vibe (Cloudflare VibeSDK)...');
        const spinner = logger.spin('Configurando boilerplate Premium...');

        try {
            const projectRoot = process.cwd();
            const vibeDir = join(projectRoot, 'vibe-app');

            if (!existsSync(vibeDir)) mkdirSync(vibeDir, { recursive: true });

            // Injeção Inteligente de Segredos
            const configManager = getConfigManager();
            const config = configManager.load();
            let envContent = '';

            if (config && config.aiProvider) {
                const provider = config.aiProvider.type.toUpperCase();
                const apiKey = config.aiProvider.apiKey;
                envContent = `${provider}_API_KEY=${apiKey}\nCLOUDFLARE_ACCOUNT_ID=${process.env.CLOUDFLARE_ACCOUNT_ID || ''}\n`;
                logger.info(`🔑 Segredos injetados para o provedor: ${chalk.cyan(provider)}`);
            }

            // Gerar arquivos do boilerplate
            writeFileSync(join(vibeDir, '.env'), envContent, 'utf-8');
            writeFileSync(join(vibeDir, 'wrangler.toml'), '# VibeSDK Config\nname = "vibe-app"\nmain = "src/index.ts"\n', 'utf-8');
            writeFileSync(join(vibeDir, 'package.json'), JSON.stringify({
                name: "vibe-app",
                version: "1.0.0",
                scripts: {
                    "dev": "wrangler dev",
                    "deploy": "wrangler deploy"
                },
                dependencies: {
                    "@cloudflare/vibesdk": "latest",
                    "hono": "^4.0.0"
                }
            }, null, 2), 'utf-8');

            spinner.succeed(`Projeto Full-Stack VibeSDK gerado com sucesso em ./${chalk.bold('vibe-app')}!`);
            logger.list([
                'As chaves de API foram sincronizadas automaticamente do Maestro.',
                'Configuração do Cloudflare Workers pronta para deploy.',
                'Arquitetura Hono + VibeSDK configurada.'
            ]);
            logger.info(`🚀 Para começar: ${chalk.cyan('cd vibe-app && npm install && npm run dev')}`);
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
    if (configManager.isInitialized()) {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: chalk.yellow('PAGIA já está detectado neste projeto.'),
                choices: [
                    { name: 'Atualizar configuração existente', value: 'update' },
                    { name: 'Reinstalar (Sobrescrever tudo)', value: 'overwrite' },
                    { name: 'Cancelar', value: 'cancel' },
                ],
            },
        ]);

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

    // --- 2. Interactive Interview ---
    const answers = await runSetupInterview(options.yes);

    // --- 3. Construction Phase ---
    const spinner = logger.spin('Construindo a infraestrutura do PAGIA...');
    const start = Date.now();

    try {
        // A. Initialize Core Config
        spinner.text = 'Gerando configurações principais...';
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

        // B. Create Directory Structure (The "Conductor" Architecture)
        spinner.text = 'Criando arquitetura de pastas (Conductor)...';
        const projectRoot = process.cwd();
        const pagiaRoot = join(projectRoot, '.pagia');
        createConductorStructure(pagiaRoot);

        // C. Create Initial Global Plan
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

    } catch (error) {
        spinner.fail('Falha na inicialização');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
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

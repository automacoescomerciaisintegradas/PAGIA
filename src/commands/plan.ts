/**
 * PAGIA - Plan Command
 * Gerenciamento de Planos de Ação
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { existsSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { stringify as stringifyYaml, parse as parseYaml } from 'yaml';
import { getConfigManager } from '../core/config-manager.js';
import { createAIService } from '../core/ai-service.js';
import { logger } from '../utils/logger.js';
import type { GlobalPlan, Stage, PromptPlan, AIPlan } from '../types/index.js';

export const planCommand = new Command('plan')
    .description('Gerenciar planos de ação');

// Create plan subcommand
planCommand
    .command('create')
    .description('Criar novo plano de ação')
    .option('-t, --type <type>', 'Tipo de plano (global, stage, prompt, ai)')
    .option('-n, --name <name>', 'Nome do plano')
    .option('--ai', 'Usar IA para gerar o plano')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado. Execute `pagia init` primeiro.');
            process.exit(1);
        }

        const config = configManager.load()!;
        let planType = options.type;
        let planName = options.name;

        // Interactive selection if not provided
        if (!planType) {
            const answer = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: 'Selecione o tipo de plano:',
                    choices: [
                        { name: '📊 Plano Global de Alto Nível', value: 'global' },
                        { name: '📋 Plano por Etapa/Tópico', value: 'stage' },
                        { name: '💬 Plano por Prompt', value: 'prompt' },
                        { name: '🤖 Plano Controlado pela IA', value: 'ai' },
                    ],
                },
            ]);
            planType = answer.type;
        }

        if (!planName) {
            const answer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Nome do plano:',
                    validate: (input) => input.trim() ? true : 'Nome é obrigatório',
                },
            ]);
            planName = answer.name;
        }

        // Create plan based on type
        const spinner = logger.spin(`Criando plano ${planName}...`);

        try {
            let plan: any;

            switch (planType) {
                case 'global':
                    plan = await createGlobalPlan(planName, options.ai, config);
                    break;
                case 'stage':
                    plan = await createStagePlan(planName, options.ai, config);
                    break;
                case 'prompt':
                    spinner.stop();
                    plan = await createPromptPlan(planName, config);
                    spinner.start();
                    break;
                case 'ai':
                    plan = await createAIPlan(planName, config);
                    break;
                default:
                    throw new Error(`Tipo de plano inválido: ${planType}`);
            }

            // Save plan
            const plansFolder = join(configManager.getPagiaFolder(), 'plans', getPlanFolder(planType));
            const planFile = join(plansFolder, `${sanitizeFilename(planName)}.yaml`);

            writeFileSync(planFile, stringifyYaml(plan, { indent: 2 }), 'utf-8');

            spinner.succeed(`Plano "${planName}" criado com sucesso!`);
            logger.keyValue('Arquivo', planFile);
        } catch (error) {
            spinner.fail('Erro ao criar plano');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// List plans subcommand
planCommand
    .command('list')
    .description('Listar planos existentes')
    .option('-t, --type <type>', 'Filtrar por tipo')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const plansFolder = join(configManager.getPagiaFolder(), 'plans');
        const types = options.type ? [options.type] : ['global', 'stages', 'prompts', 'ai'];

        logger.section('Planos de Ação');

        let totalPlans = 0;

        for (const type of types) {
            const typeFolder = join(plansFolder, type);
            if (!existsSync(typeFolder)) continue;

            const files = readdirSync(typeFolder).filter((f) => f.endsWith('.yaml'));
            if (files.length === 0) continue;

            console.log(chalk.bold(getTypeLabel(type)));

            for (const file of files) {
                const filePath = join(typeFolder, file);
                const content = parseYaml(readFileSync(filePath, 'utf-8'));
                const name = content.name || file.replace('.yaml', '');
                const status = content.status || 'active';

                const statusIcon = status === 'completed' ? '✓' : status === 'in-progress' ? '⏳' : '○';
                const statusColor = status === 'completed' ? chalk.green : status === 'in-progress' ? chalk.yellow : chalk.gray;

                console.log(`  ${statusColor(statusIcon)} ${name}`);
                totalPlans++;
            }
            logger.newLine();
        }

        if (totalPlans === 0) {
            logger.info('Nenhum plano encontrado. Use `pagia plan create` para criar um.');
        } else {
            logger.info(`Total: ${totalPlans} plano(s)`);
        }
    });

// View plan subcommand
planCommand
    .command('view <name>')
    .description('Visualizar detalhes de um plano')
    .action(async (name) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const plansFolder = join(configManager.getPagiaFolder(), 'plans');
        const types = ['global', 'stages', 'prompts', 'ai'];

        for (const type of types) {
            const typeFolder = join(plansFolder, type);
            const planFile = join(typeFolder, `${sanitizeFilename(name)}.yaml`);

            if (existsSync(planFile)) {
                const content = parseYaml(readFileSync(planFile, 'utf-8'));

                logger.box(
                    stringifyYaml(content, { indent: 2 }),
                    { title: `📋 ${content.name || name}`, borderColor: 'cyan' }
                );
                return;
            }
        }

        logger.error(`Plano "${name}" não encontrado.`);
    });

// Helper functions
async function createGlobalPlan(name: string, useAI: boolean, config: any): Promise<GlobalPlan> {
    const plan: GlobalPlan = {
        id: generateId(),
        name,
        description: '',
        objectives: [],
        stages: [],
        milestones: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    if (useAI) {
        const aiService = createAIService(config.aiProvider);
        const response = await aiService.generate(
            `Crie um plano de ação global de alto nível para o projeto "${name}". 
      Inclua 3-5 objetivos principais, 4-6 etapas de desenvolvimento e 3-4 marcos importantes.
      Responda em JSON com a estrutura: { objectives: [...], stages: [...], milestones: [...] }`,
            'Você é um especialista em gestão de projetos e planejamento estratégico.'
        );

        try {
            const generated = JSON.parse(response.content.replace(/```json\n?|\n?```/g, ''));
            plan.objectives = generated.objectives || [];
            plan.stages = generated.stages || [];
            plan.milestones = generated.milestones || [];
        } catch {
            // Keep empty arrays if parsing fails
        }
    }

    return plan;
}

async function createStagePlan(name: string, useAI: boolean, config: any): Promise<Stage> {
    return {
        id: generateId(),
        name,
        description: '',
        order: 1,
        status: 'not-started',
        topics: [],
        tasks: [],
        dependencies: [],
    };
}

async function createPromptPlan(name: string, config: any): Promise<PromptPlan> {
    const { prompt } = await inquirer.prompt([
        {
            type: 'editor',
            name: 'prompt',
            message: 'Digite o prompt para gerar o plano de ação:',
        },
    ]);

    const aiService = createAIService(config.aiProvider);
    const response = await aiService.generate(
        `Analise este prompt e gere um plano de ação: "${prompt}"
    
    Responda em JSON com:
    {
      "interpretation": "sua interpretação do prompt",
      "tasks": [{ "name": "...", "description": "...", "priority": "high|medium|low" }],
      "confidence": 0.0-1.0
    }`,
        'Você é um assistente especializado em transformar solicitações em tarefas acionáveis.'
    );

    let interpretation = '';
    let tasks: any[] = [];
    let confidence = 0.8;

    try {
        const generated = JSON.parse(response.content.replace(/```json\n?|\n?```/g, ''));
        interpretation = generated.interpretation || '';
        tasks = generated.tasks || [];
        confidence = generated.confidence || 0.8;
    } catch {
        // Keep defaults if parsing fails
    }

    return {
        id: generateId(),
        prompt,
        interpretation,
        generatedTasks: tasks,
        confidence,
        createdAt: new Date(),
    };
}

async function createAIPlan(name: string, config: any): Promise<AIPlan> {
    const aiService = createAIService(config.aiProvider);

    const response = await aiService.generate(
        `Analise o contexto do projeto "${name}" e gere um plano de ação autônomo.
    
    Responda em JSON com:
    {
      "analysis": {
        "currentState": "...",
        "blockers": ["..."],
        "opportunities": ["..."],
        "risks": ["..."]
      },
      "recommendations": [
        { "type": "task|workflow|resource", "description": "...", "rationale": "...", "priority": "high|medium|low" }
      ]
    }`,
        'Você é um agente de IA especializado em análise e planejamento de projetos.'
    );

    let analysis = { currentState: '', blockers: [], opportunities: [], risks: [] };
    let recommendations: any[] = [];

    try {
        const generated = JSON.parse(response.content.replace(/```json\n?|\n?```/g, ''));
        analysis = generated.analysis || analysis;
        recommendations = generated.recommendations || [];
    } catch {
        // Keep defaults if parsing fails
    }

    return {
        id: generateId(),
        context: name,
        analysis,
        recommendations,
        automatedTasks: [],
        learnings: [],
        createdAt: new Date(),
    };
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeFilename(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getPlanFolder(type: string): string {
    const folders: Record<string, string> = {
        global: 'global',
        stage: 'stages',
        prompt: 'prompts',
        ai: 'ai',
    };
    return folders[type] || type;
}

function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        global: '📊 Planos Globais',
        stages: '📋 Planos por Etapa',
        prompts: '💬 Planos por Prompt',
        ai: '🤖 Planos IA',
    };
    return labels[type] || type;
}

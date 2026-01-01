/**
 * PAGIA - Plan Command
 * Gerenciamento de Planos de Ação
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { existsSync, writeFileSync, readFileSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';
import { stringify as stringifyYaml, parse as parseYaml } from 'yaml';
import { getConfigManager } from '../core/config-manager.js';
import { createAIService } from '../core/ai-service.js';
import { logger } from '../utils/logger.js';
import type { GlobalPlan, Stage, PromptPlan, AIPlan } from '../types/index.js';

interface InstallOptions {
    type: string;
    name: string;
    force?: boolean;
    dryRun?: boolean;
}

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

// Generate plan subcommand
planCommand
    .command('generate')
    .description('Gerar um plano a partir de template ou scaffold')
    .option('-t, --type <type>', 'Tipo de plano (global, stage, prompt, ai)')
    .option('-n, --name <name>', 'Nome do plano')
    .option('--template <template>', 'Usar um template existente (nome do arquivo sem .yaml)')
    .option('-y, --yes', 'Confirmar sem perguntas')
    .option('--open', 'Abrir o arquivo gerado no editor (usa $EDITOR ou code)')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado. Execute `pagia init` primeiro.');
            process.exit(1);
        }

        let planType = options.type;
        let planName = options.name;
        const template = options.template;
        const skipConfirm = options.yes;
        const openAfter = options.open;

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

        // Derive name automatically from template if provided and no name given
        if (template && !planName) {
            planName = humanizeTemplateName(template);
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

        const pagiaFolder = configManager.getPagiaFolder();

        try {
            if (!skipConfirm) {
                const confirm = await inquirer.prompt([
                    { type: 'confirm', name: 'ok', message: `Gerar plano "${planName}" do tipo "${planType}"?`, default: true },
                ]);
                if (!confirm.ok) {
                    logger.info('Cancelado pelo usuário.');
                    return;
                }
            }

            const planFile = await generatePlanFile(pagiaFolder, planType, planName, template);
            logger.info(`Plano gerado em: ${planFile}`);

            if (openAfter) {
                try {
                    const editor = process.env.EDITOR || 'code';
                    const { spawn } = await import('child_process');
                    spawn(editor, [planFile], { stdio: 'ignore', detached: true }).unref();
                    logger.info('Abrindo arquivo no editor...');
                } catch (err) {
                    logger.warn('Não foi possível abrir o editor automaticamente.');
                }
            }
        } catch (error) {
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

// List templates subcommand
planCommand
    .command('list-templates')
    .description('Listar templates de plano disponíveis')
    .option('-t, --type <type>', 'Filtrar por tipo (global, stages, prompts, ai)')
    .option('--verbose', 'Mostrar detalhes dos templates (descrição, name, createdAt)')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const pagiaFolder = configManager.getPagiaFolder();
        const templates = options.verbose ? listTemplatesDetailed(pagiaFolder, options.type) : listTemplates(pagiaFolder, options.type);

        if (templates.length === 0) {
            logger.info('Nenhum template encontrado.');
            return;
        }

        logger.section('Templates disponíveis');
        if (options.verbose) {
            for (const t of templates as any[]) {
                console.log(`  ${t.type} - ${t.file.replace('.yaml', '')}`);
                const content = t.content;
                if (content.name) console.log(`    Name: ${content.name}`);
                if (content.description) console.log(`    Description: ${content.description}`);
                if (content.createdAt) console.log(`    CreatedAt: ${content.createdAt}`);
            }
        } else {
            for (const t of templates as any[]) {
                console.log(`  ${t.type} - ${t.file.replace('.yaml', '')}`);
            }
        }
    });

// Install template subcommand
planCommand
    .command('install-template <template>')
    .description('Instalar um template de plano para o diretório atual ou diretório alvo')
    .option('-t, --type <type>', 'Tipo de template (global, stages, prompts, ai)')
    .option('-n, --name <name>', 'Nome do arquivo/plan a ser gerado (sem .yaml)')
    .option('--target <dir>', 'Diretório de destino (default: current working dir)')
    .option('--force', 'Sobrescrever arquivo de destino se já existir')
    .option('--open', 'Abrir o arquivo gerado no editor (usa $EDITOR ou code)')
    .option('--dry-run', 'Mostrar o que seria feito sem escrever arquivos')
    .action(async (template, options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const pagiaFolder = configManager.getPagiaFolder();
        const targetDir = options.target ? options.target : process.cwd();
        const fileName = options.name || template;

        try {
            const result = await installTemplateInteractive(pagiaFolder, template, targetDir, { type: options.type, name: fileName, force: options.force, dryRun: options.dryRun });

            if (result.canceled) {
                logger.info('Cancelado pelo usuário.');
                return;
            }

            if (options.dryRun) {
                logger.info(`DRY-RUN: arquivo seria criado em: ${result.path}`);
                return;
            }

            logger.info(`Template instalado em: ${result.path}`);

            if (options.open) {
                try {
                    const editor = process.env.EDITOR || 'code';
                    const { spawn } = await import('child_process');
                    (spawn(editor, [result.path || ''], { stdio: 'ignore', detached: true }) as any).unref();
                    logger.info('Abrindo arquivo no editor...');
                } catch (err) {
                    logger.warn('Não foi possível abrir o editor automaticamente.');
                }
            }
        } catch (err) {
            logger.error(err instanceof Error ? err.message : String(err));
            process.exit(1);
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
            // Extract JSON from response - find the first { and last }
            const content = response.content;
            const firstBrace = content.indexOf('{');
            const lastBrace = content.lastIndexOf('}');

            if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
                throw new Error('No valid JSON object found in response');
            }

            const jsonContent = content.substring(firstBrace, lastBrace + 1);
            const generated = JSON.parse(jsonContent);
            plan.objectives = generated.objectives || [];
            plan.stages = generated.stages || [];
            plan.milestones = generated.milestones || [];
        } catch (e) {
            // Log error for debugging only if debug mode
            if (process.env.PAGIA_DEBUG === 'true') {
                console.error('Failed to parse AI response:', e);
                console.error('Raw response:', response.content);
            }
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
        // Extract JSON from response - find the first { and last }
        const content = response.content;
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonContent = content.substring(firstBrace, lastBrace + 1);
            const generated = JSON.parse(jsonContent);
            interpretation = generated.interpretation || '';
            tasks = generated.tasks || [];
            confidence = generated.confidence || 0.8;
        }
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
        // Extract JSON from response - find the first { and last }
        const content = response.content;
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonContent = content.substring(firstBrace, lastBrace + 1);
            const generated = JSON.parse(jsonContent);
            analysis = generated.analysis || analysis;
            recommendations = generated.recommendations || [];
        }
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

// List templates helper
export function listTemplates(pagiaFolder: string, type?: string): Array<{ type: string, file: string }> {
    const types = type ? [type] : ['global', 'stages', 'prompts', 'ai'];
    const results: Array<{ type: string, file: string }> = [];

    for (const t of types) {
        const folder = join(pagiaFolder, 'plans', t);
        if (!existsSync(folder)) continue;
        const files = readdirSync(folder).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.md'));
        for (const f of files) {
            if (f.startsWith('example-')) continue; // skip examples by default
            results.push({ type: t, file: f });
        }
    }

    return results;
}

export function listTemplatesDetailed(pagiaFolder: string, type?: string): Array<{ type: string, file: string, content: any }> {
    const basic = listTemplates(pagiaFolder, type);
    const results: Array<{ type: string, file: string, content: any }> = [];

    for (const b of basic) {
        try {
            const full = join(pagiaFolder, 'plans', b.type, b.file);
            if (b.file.endsWith('.md')) {
                const raw = readFileSync(full, 'utf-8');
                results.push({ type: b.type, file: b.file, content: { _raw: raw } });
            } else {
                const content = parseYaml(readFileSync(full, 'utf-8'));
                results.push({ type: b.type, file: b.file, content });
            }
        } catch (e) {
            // ignore parse errors but include minimal info
            results.push({ type: b.type, file: b.file, content: {} });
        }
    }

    return results;
}

// Install template utility
export async function installTemplate(pagiaFolder: string, templateName: string, targetDir: string, opts?: { type?: string; name?: string; force?: boolean; dryRun?: boolean }): Promise<string> {
    const types = opts?.type ? [opts.type] : ['global', 'stages', 'prompts', 'ai'];
    let found: { fullPath: string, type: string, file: string } | null = null;

    for (const t of types) {
        const folder = join(pagiaFolder, 'plans', t);
        if (!existsSync(folder)) continue;
        const possible = [
            join(folder, `${templateName}.yaml`),
            join(folder, `${templateName}.yml`),
            join(folder, `${templateName}.md`),
        ];
        for (const p of possible) {
            if (existsSync(p)) {
                found = { fullPath: p, type: t, file: p.split(/[\\/]/).pop()! };
                break;
            }
        }
        if (found) break;
    }

    if (!found) {
        throw new Error(`Template não encontrado: ${templateName}`);
    }

    // Read, ensure name is set, write to target
    if (found.file.endsWith('.md')) {
        const raw = readFileSync(found.fullPath, 'utf-8');
        const planName = opts?.name || templateName;
        // Replace template label if present: (Template: ...)
        const modified = raw.replace(/\(Template:\s*[^)]+\)/i, `(Template: ${planName})`);
        const targetPath = join(targetDir, `${sanitizeFilename(planName)}.md`);
        if (existsSync(targetPath) && !opts?.force && !opts?.dryRun) {
            throw new Error(`Arquivo de destino já existe: ${targetPath}. Use --force para sobrescrever.`);
        }
        if (opts?.dryRun) {
            return targetPath;
        }
        writeFileSync(targetPath, modified, 'utf-8');
        return targetPath;
    }

    const content = parseYaml(readFileSync(found.fullPath, 'utf-8')) as any;
    content.name = opts?.name || content.name || templateName;

    const targetPath = join(targetDir, `${sanitizeFilename(content.name)}.yaml`);
    if (existsSync(targetPath) && !opts?.force && !opts?.dryRun) {
        throw new Error(`Arquivo de destino já existe: ${targetPath}. Use --force para sobrescrever.`);
    }
    if (opts?.dryRun) {
        return targetPath;
    }
    writeFileSync(targetPath, stringifyYaml(content, { indent: 2 }), 'utf-8');

    return targetPath;
}

// Interactive installer: asks before overwriting when appropriate
export async function installTemplateInteractive(pagiaFolder: string, templateName: string, targetDir: string, opts?: { type?: string; name?: string; force?: boolean; dryRun?: boolean }): Promise<{ canceled: boolean; path?: string }> {
    // First compute the target path via dry-run
    const targetPath = await installTemplate(pagiaFolder, templateName, targetDir, { ...(opts || {}), dryRun: true });

    // If dryRun, return the path without prompting
    if (opts?.dryRun) return { canceled: false, path: targetPath };

    // If target exists and not forced, prompt
    if (existsSync(targetPath) && !opts?.force) {
        const answer = await inquirer.prompt([{ type: 'confirm', name: 'ok', message: `Arquivo ${targetPath} já existe. Deseja sobrescrever?`, default: false }]);
        if (!answer.ok) return { canceled: true, path: targetPath };
        // else proceed with force
        const res = await installTemplate(pagiaFolder, templateName, targetDir, { ...(opts || {}), force: true });
        return { canceled: false, path: res };
    }

    // Otherwise just install
    const res = await installTemplate(pagiaFolder, templateName, targetDir, opts);
    return { canceled: false, path: res };
}

// Exported utility to generate a plan file programmatically (used by CLI and tests)
export async function generatePlanFile(pagiaFolder: string, type: string, name: string, template?: string): Promise<string> {
    const folder = join(pagiaFolder, 'plans', getPlanFolder(type));
    // ensure folder exists
    try { require('fs').mkdirSync(folder, { recursive: true }); } catch (e) { /* ignore */ }

    const targetPath = join(folder, `${sanitizeFilename(name)}.yaml`);

    // If a template is provided and exists, copy and set the name
    if (template) {
        const templatePath = join(folder, `${template}.yaml`);
        if (!existsSync(templatePath)) {
            throw new Error(`Template não encontrado: ${templatePath}`);
        }
        const content = parseYaml(readFileSync(templatePath, 'utf-8')) as any;
        content.name = name;
        writeFileSync(targetPath, stringifyYaml(content, { indent: 2 }), 'utf-8');
        return targetPath;
    }

    // Otherwise scaffold minimal plan depending on type
    let planObj: any;
    switch (type) {
        case 'global':
            planObj = await createGlobalPlan(name, false, {});
            break;
        case 'stage':
            planObj = await createStagePlan(name, false, {});
            break;
        case 'prompt':
            planObj = await createPromptPlan(name, { aiProvider: null });
            break;
        case 'ai':
            planObj = await createAIPlan(name, { aiProvider: null });
            break;
        default:
            throw new Error(`Tipo de plano inválido: ${type}`);
    }

    // Ensure top-level name
    planObj.name = name;
    writeFileSync(targetPath, stringifyYaml(planObj, { indent: 2 }), 'utf-8');
    return targetPath;
}

// Utility: convert template file name to a friendly plan name
export function humanizeTemplateName(template: string): string {
    if (!template) return 'New Plan';
    return template.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Install a template file from .pagia/plans/<type>/<name>.yaml into targetDir.
 * Returns { canceled: boolean, path?: string }
 */
export async function installTemplateCLI(
    pagiaDir: string,
    name: string,
    targetDir: string,
    opts: InstallOptions
) {
    const srcPath = join(pagiaDir, 'plans', opts.type, `${name}.yaml`);
    if (!existsSync(srcPath)) {
        throw new Error(`Template not found: ${srcPath}`);
    }

    const targetPath = join(targetDir, `${name}.yaml`);
    const targetExists = existsSync(targetPath);

    // Se existe e dryRun -> não pergunta, só retorna caminho
    if (targetExists && opts.dryRun) {
        return { canceled: false, path: targetPath };
    }

    // Se existe e não dryRun -> se force=true não pergunta, senão pergunta
    if (targetExists && !opts.dryRun && !opts.force) {
        const answer = await inquirer.prompt([
            { type: 'confirm', name: 'ok', message: `File ${targetPath} exists. Overwrite?`, default: false }
        ]);
        if (!answer.ok) {
            return { canceled: true };
        }
    }

    // Garante diretório e escreve (sobrescreve se necessário)
    mkdirSync(targetDir, { recursive: true });
    const content = readFileSync(srcPath, 'utf-8');
    writeFileSync(targetPath, content, 'utf-8');

    return { canceled: false, path: targetPath };
}


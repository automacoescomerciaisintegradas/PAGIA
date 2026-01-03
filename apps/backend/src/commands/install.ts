/**
 * PAGIA - Install Command
 * Instalação de módulos adicionais
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getConfigManager } from '../core/config-manager.js';
import { logger } from '../utils/logger.js';
import type { ModuleConfig } from '../types/index.js';

// Available modules for installation
const AVAILABLE_MODULES = [
    {
        code: 'global-plan',
        name: 'Plano de Ação Global',
        description: 'Gestão estratégica de alto nível do projeto',
        icon: '📊',
    },
    {
        code: 'stage-plan',
        name: 'Plano de Ação por Etapa',
        description: 'Detalhamento por fases e tópicos específicos',
        icon: '📋',
    },
    {
        code: 'prompt-plan',
        name: 'Plano de Ação por Prompt',
        description: 'Ações derivadas de prompts do usuário',
        icon: '💬',
    },
    {
        code: 'ai-plan',
        name: 'Plano de Ação Controlado pela IA',
        description: 'Ações autônomas gerenciadas pela IA',
        icon: '🤖',
    },
];

export const installCommand = new Command('install')
    .description('Instalar módulos do PAGIA')
    .argument('[modules...]', 'Módulos a instalar')
    .option('-a, --all', 'Instalar todos os módulos')
    .option('-v, --verbose', 'Modo verboso')
    .action(async (modules: string[], options) => {
        const configManager = getConfigManager();

        // Check if PAGIA is initialized
        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado. Execute `pagia init` primeiro.');
            process.exit(1);
        }

        const config = configManager.load()!;
        let modulesToInstall: string[] = modules;

        // If --all flag, install all modules
        if (options.all) {
            modulesToInstall = AVAILABLE_MODULES.map((m) => m.code);
        }

        // If no modules specified, show interactive selection
        if (modulesToInstall.length === 0) {
            const installedModules = config.modules.filter((m) => m.enabled).map((m) => m.code);

            const { selectedModules } = await inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'selectedModules',
                    message: 'Selecione os módulos a instalar:',
                    choices: AVAILABLE_MODULES.map((m) => ({
                        name: `${m.icon} ${m.name} - ${chalk.gray(m.description)}`,
                        value: m.code,
                        checked: installedModules.includes(m.code),
                        disabled: m.code === 'core' ? 'Obrigatório' : false,
                    })),
                },
            ]);

            modulesToInstall = selectedModules;
        }

        // Validate modules
        const invalidModules = modulesToInstall.filter(
            (m) => !AVAILABLE_MODULES.find((am) => am.code === m)
        );

        if (invalidModules.length > 0) {
            logger.error(`Módulos inválidos: ${invalidModules.join(', ')}`);
            logger.info('Módulos disponíveis:');
            AVAILABLE_MODULES.forEach((m) => {
                logger.keyValue(m.code, m.name);
            });
            process.exit(1);
        }

        // Install modules
        const spinner = logger.spin('Instalando módulos...');

        try {
            for (const moduleCode of modulesToInstall) {
                const moduleInfo = AVAILABLE_MODULES.find((m) => m.code === moduleCode)!;
                spinner.text = `Instalando ${moduleInfo.name}...`;

                await installModule(configManager.getPagiaFolder(), moduleCode, options.verbose);

                // Update config
                const moduleIndex = config.modules.findIndex((m) => m.code === moduleCode);
                if (moduleIndex >= 0) {
                    config.modules[moduleIndex].enabled = true;
                } else {
                    config.modules.push({
                        code: moduleCode,
                        name: moduleInfo.name,
                        enabled: true,
                        config: {},
                    });
                }
            }

            await configManager.save(config);

            spinner.succeed(`${modulesToInstall.length} módulo(s) instalado(s) com sucesso!`);

            // Show installed modules
            logger.newLine();
            logger.section('Módulos Instalados');
            config.modules
                .filter((m) => m.enabled)
                .forEach((m) => {
                    const info = AVAILABLE_MODULES.find((am) => am.code === m.code);
                    const icon = info?.icon || '📦';
                    logger.keyValue(icon, m.name);
                });
        } catch (error) {
            spinner.fail('Erro ao instalar módulos');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

async function installModule(
    pagiaFolder: string,
    moduleCode: string,
    verbose: boolean
): Promise<void> {
    const moduleDir = join(pagiaFolder, 'modules', moduleCode);

    // Create module directory structure
    const directories = [
        moduleDir,
        join(moduleDir, 'agents'),
        join(moduleDir, 'tasks'),
        join(moduleDir, 'workflows'),
        join(moduleDir, 'templates'),
    ];

    for (const dir of directories) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }

    // Create module config file
    const moduleConfig = {
        code: moduleCode,
        version: '1.0.0',
        enabled: true,
        settings: {},
    };

    writeFileSync(
        join(moduleDir, 'config.yaml'),
        `# ${moduleCode} Module Configuration\n` +
        `code: ${moduleCode}\n` +
        `version: "1.0.0"\n` +
        `enabled: true\n` +
        `settings: {}\n`,
        'utf-8'
    );

    // Create default agent for the module
    await createDefaultAgent(moduleDir, moduleCode);

    if (verbose) {
        logger.debug(`Módulo ${moduleCode} instalado em ${moduleDir}`);
    }
}

async function createDefaultAgent(moduleDir: string, moduleCode: string): Promise<void> {
    const agentName = getAgentNameForModule(moduleCode);
    const agentFile = join(moduleDir, 'agents', `${moduleCode}-agent.md`);

    const agentContent = `# ${agentName}

## Papel
Agente especializado em ${getModuleDescription(moduleCode)}.

## Capacidades
- Análise e planejamento
- Geração de tarefas
- Acompanhamento de progresso
- Recomendações inteligentes

## Instruções
Você é um agente especializado do PAGIA focado em ${getModuleDescription(moduleCode)}.

Siga estas diretrizes:
1. Analise o contexto do projeto antes de agir
2. Gere tarefas claras e acionáveis
3. Priorize com base no impacto
4. Mantenha rastreabilidade das decisões

## Menu
- \`/analyze\` - Analisar estado atual
- \`/plan\` - Gerar plano de ação
- \`/tasks\` - Listar tarefas
- \`/update\` - Atualizar progresso
`;

    writeFileSync(agentFile, agentContent, 'utf-8');
}

function getAgentNameForModule(moduleCode: string): string {
    const names: Record<string, string> = {
        'global-plan': 'Agente de Planejamento Global',
        'stage-plan': 'Agente de Gestão de Etapas',
        'prompt-plan': 'Agente de Interpretação de Prompts',
        'ai-plan': 'Agente Autônomo de IA',
    };
    return names[moduleCode] || 'Agente PAGIA';
}

function getModuleDescription(moduleCode: string): string {
    const descriptions: Record<string, string> = {
        'global-plan': 'planejamento estratégico de alto nível',
        'stage-plan': 'gestão de etapas e tópicos do projeto',
        'prompt-plan': 'interpretação de prompts e geração de ações',
        'ai-plan': 'decisões autônomas e aprendizado contínuo',
    };
    return descriptions[moduleCode] || 'gestão de projetos com IA';
}

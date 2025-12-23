/**
 * PAGIA - Init Command
 * Inicialização do PAGIA no projeto
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { getConfigManager } from '../core/config-manager.js';
import { logger } from '../utils/logger.js';
import type { AIProviderType, ModuleConfig } from '../types/index.js';

export const initCommand = new Command('init')
    .description('Inicializar PAGIA no projeto atual')
    .option('-y, --yes', 'Usar configurações padrão sem perguntar')
    .option('-v, --verbose', 'Modo verboso')
    .action(async (options) => {
        const configManager = getConfigManager();

        // Check if already initialized
        if (configManager.isInitialized()) {
            const { overwrite } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: chalk.yellow('PAGIA já está inicializado neste projeto. Deseja sobrescrever?'),
                    default: false,
                },
            ]);

            if (!overwrite) {
                logger.info('Operação cancelada.');
                return;
            }
        }

        let config: any = {};

        if (!options.yes) {
            // Interactive configuration
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'userName',
                    message: 'Qual é seu nome?',
                    default: process.env.USER_NAME || 'Developer',
                },
                {
                    type: 'list',
                    name: 'language',
                    message: 'Idioma de comunicação:',
                    choices: [
                        { name: 'Português (Brasil)', value: 'pt-BR' },
                        { name: 'English', value: 'en' },
                        { name: 'Español', value: 'es' },
                    ],
                    default: 'pt-BR',
                },
                {
                    type: 'list',
                    name: 'aiProvider',
                    message: 'Provedor de IA principal:',
                    choices: [
                        { name: 'Google Gemini', value: 'gemini' },
                        { name: 'OpenAI (GPT)', value: 'openai' },
                        { name: 'Anthropic (Claude)', value: 'anthropic' },
                    ],
                    default: 'gemini',
                },
                {
                    type: 'input',
                    name: 'apiKey',
                    message: (answers: any) => `API Key do ${answers.aiProvider}:`,
                    validate: (input: string) => {
                        if (!input.trim()) {
                            return 'API Key é obrigatória. Você pode configurar depois em .env';
                        }
                        return true;
                    },
                },
                {
                    type: 'checkbox',
                    name: 'modules',
                    message: 'Módulos a instalar:',
                    choices: [
                        { name: '📊 Plano de Ação Global (Alto Nível)', value: 'global-plan', checked: true },
                        { name: '📋 Plano de Ação por Etapa/Tópico', value: 'stage-plan', checked: true },
                        { name: '💬 Plano de Ação por Prompt', value: 'prompt-plan', checked: true },
                        { name: '🤖 Plano de Ação Controlado pela IA', value: 'ai-plan', checked: true },
                    ],
                },
                {
                    type: 'confirm',
                    name: 'debug',
                    message: 'Habilitar modo debug?',
                    default: false,
                },
            ]);

            config = {
                userName: answers.userName,
                language: answers.language,
                debug: answers.debug,
                aiProvider: {
                    type: answers.aiProvider as AIProviderType,
                    apiKey: answers.apiKey,
                    model: getDefaultModel(answers.aiProvider),
                },
                modules: createModulesConfig(answers.modules),
            };
        }

        // Initialize PAGIA
        const spinner = logger.spin('Inicializando PAGIA...');

        try {
            const finalConfig = await configManager.initialize(config);

            spinner.succeed('PAGIA inicializado com sucesso!');

            // Show summary
            logger.newLine();
            logger.box(
                `${chalk.bold('PAGIA Configurado!')}\n\n` +
                `${chalk.gray('Usuário:')} ${finalConfig.userName}\n` +
                `${chalk.gray('Idioma:')} ${finalConfig.language}\n` +
                `${chalk.gray('Provedor IA:')} ${finalConfig.aiProvider.type}\n` +
                `${chalk.gray('Modelo:')} ${finalConfig.aiProvider.model}\n` +
                `${chalk.gray('Módulos:')} ${finalConfig.modules.filter((m) => m.enabled).length} ativos`,
                { title: '✅ Inicialização Completa', borderColor: 'green' }
            );

            logger.newLine();
            logger.info('Próximos passos:');
            logger.list([
                'pagia status - Ver status do projeto',
                'pagia plan create - Criar um plano de ação',
                'pagia agent list - Listar agentes disponíveis',
            ]);
        } catch (error) {
            spinner.fail('Erro ao inicializar PAGIA');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

function getDefaultModel(provider: string): string {
    switch (provider) {
        case 'gemini':
            return 'gemini-2.0-flash-exp';
        case 'openai':
            return 'gpt-4o';
        case 'anthropic':
            return 'claude-3-5-sonnet-20241022';
        default:
            return 'gemini-2.0-flash-exp';
    }
}

function createModulesConfig(selectedModules: string[]): ModuleConfig[] {
    const allModules = [
        { code: 'core', name: 'Core', enabled: true, config: {} },
        { code: 'global-plan', name: 'Plano de Ação Global', enabled: false, config: {} },
        { code: 'stage-plan', name: 'Plano de Ação por Etapa', enabled: false, config: {} },
        { code: 'prompt-plan', name: 'Plano de Ação por Prompt', enabled: false, config: {} },
        { code: 'ai-plan', name: 'Plano de Ação Controlado pela IA', enabled: false, config: {} },
    ];

    return allModules.map((module) => ({
        ...module,
        enabled: module.code === 'core' || selectedModules.includes(module.code),
    }));
}

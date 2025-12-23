/**
 * PAGIA - Config Command
 * Gerenciamento de configurações
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getConfigManager } from '../core/config-manager.js';
import { logger } from '../utils/logger.js';
import type { AIProviderType } from '../types/index.js';

export const configCommand = new Command('config')
    .description('Gerenciar configurações do PAGIA');

// View configuration
configCommand
    .command('view')
    .description('Exibir configuração atual')
    .option('--json', 'Exibir em formato JSON')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const config = configManager.load()!;

        if (options.json) {
            console.log(JSON.stringify(config, null, 2));
        } else {
            logger.section('Configuração do PAGIA');

            console.log(chalk.bold('📁 Geral'));
            logger.keyValue('Pasta PAGIA', config.pagiaFolder);
            logger.keyValue('Idioma', config.language);
            logger.keyValue('Usuário', config.userName);
            logger.keyValue('Debug', config.debug ? 'Ativado' : 'Desativado');
            logger.newLine();

            console.log(chalk.bold('🤖 Provedor de IA'));
            logger.keyValue('Tipo', config.aiProvider.type);
            logger.keyValue('Modelo', config.aiProvider.model);
            logger.keyValue('Temperatura', String(config.aiProvider.temperature || 0.7));
            logger.keyValue('Max Tokens', String(config.aiProvider.maxTokens || 8192));
            logger.newLine();

            console.log(chalk.bold('📦 Módulos'));
            config.modules.forEach((m) => {
                const status = m.enabled ? chalk.green('✓') : chalk.gray('○');
                console.log(`  ${status} ${m.name} ${chalk.gray(`(${m.code})`)}`);
            });
        }
    });

// Set configuration value
configCommand
    .command('set <key> <value>')
    .description('Definir valor de configuração')
    .action(async (key, value) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        try {
            // Parse value if it looks like JSON
            let parsedValue: unknown = value;
            if (value === 'true') parsedValue = true;
            else if (value === 'false') parsedValue = false;
            else if (!isNaN(Number(value))) parsedValue = Number(value);

            await configManager.set(key, parsedValue);
            logger.success(`Configuração ${chalk.cyan(key)} atualizada para ${chalk.green(String(value))}`);
        } catch (error) {
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Get configuration value
configCommand
    .command('get <key>')
    .description('Obter valor de configuração')
    .action(async (key) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const value = configManager.get(key);

        if (value === undefined) {
            logger.warn(`Configuração ${chalk.cyan(key)} não encontrada`);
        } else {
            console.log(typeof value === 'object' ? JSON.stringify(value, null, 2) : value);
        }
    });

// Configure AI provider
configCommand
    .command('ai')
    .description('Configurar provedor de IA')
    .action(async () => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const config = configManager.load()!;

        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'type',
                message: 'Provedor de IA:',
                choices: [
                    { name: 'Google Gemini', value: 'gemini' },
                    { name: 'OpenAI (GPT)', value: 'openai' },
                    { name: 'Anthropic (Claude)', value: 'anthropic' },
                ],
                default: config.aiProvider.type,
            },
            {
                type: 'input',
                name: 'apiKey',
                message: (ans: any) => `API Key do ${ans.type}:`,
                default: config.aiProvider.apiKey,
            },
            {
                type: 'list',
                name: 'model',
                message: 'Modelo:',
                choices: (ans: any) => getModelChoices(ans.type),
                default: config.aiProvider.model,
            },
            {
                type: 'number',
                name: 'temperature',
                message: 'Temperatura (0.0 - 2.0):',
                default: config.aiProvider.temperature || 0.7,
                validate: (input: number) => input >= 0 && input <= 2 ? true : 'Valor deve estar entre 0 e 2',
            },
            {
                type: 'number',
                name: 'maxTokens',
                message: 'Max Tokens:',
                default: config.aiProvider.maxTokens || 8192,
            },
        ]);

        await configManager.update({
            aiProvider: {
                type: answers.type as AIProviderType,
                apiKey: answers.apiKey,
                model: answers.model,
                temperature: answers.temperature,
                maxTokens: answers.maxTokens,
            },
        });

        logger.success('Configuração de IA atualizada!');
    });

// Reset configuration
configCommand
    .command('reset')
    .description('Redefinir configuração para padrões')
    .option('--force', 'Não pedir confirmação')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        if (!options.force) {
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: chalk.yellow('Isso irá redefinir todas as configurações. Continuar?'),
                    default: false,
                },
            ]);

            if (!confirm) {
                logger.info('Operação cancelada.');
                return;
            }
        }

        await configManager.initialize({});
        logger.success('Configuração redefinida para padrões!');
    });

// Helper function for model choices
function getModelChoices(provider: string): { name: string; value: string }[] {
    switch (provider) {
        case 'gemini':
            return [
                { name: 'Gemini 2.0 Flash (Experimental)', value: 'gemini-2.0-flash-exp' },
                { name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
                { name: 'Gemini 2.0 Flash Thinking', value: 'gemini-2.0-flash-thinking-exp' },
            ];
        case 'openai':
            return [
                { name: 'GPT-4o', value: 'gpt-4o' },
                { name: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
                { name: 'o1 Preview', value: 'o1-preview' },
                { name: 'o1 Mini', value: 'o1-mini' },
            ];
        case 'anthropic':
            return [
                { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
                { name: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
                { name: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
            ];
        default:
            return [];
    }
}

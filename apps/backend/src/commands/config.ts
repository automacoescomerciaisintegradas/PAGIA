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
                    { name: '🔮 Google Gemini', value: 'gemini' },
                    { name: '🤖 OpenAI (GPT)', value: 'openai' },
                    { name: '🧠 Anthropic (Claude)', value: 'anthropic' },
                    { name: '⚡ Groq', value: 'groq' },
                    { name: '🦙 Ollama (Local)', value: 'ollama' },
                    { name: '🌊 DeepSeek', value: 'deepseek' },
                    { name: '🌬️ Mistral AI', value: 'mistral' },
                    { name: '🔀 OpenRouter', value: 'openrouter' },
                ],
                default: config.aiProvider.type,
            },
            {
                type: 'input',
                name: 'apiKey',
                message: (ans: any) => `API Key do ${ans.type}:`,
                when: (ans: any) => ans.type !== 'ollama',
                default: config.aiProvider.apiKey,
            },
            {
                type: 'input',
                name: 'ollamaUrl',
                message: 'URL do Ollama:',
                when: (ans: any) => ans.type === 'ollama',
                default: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
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
                { name: '⭐ Gemini 3 Pro (Low) - Padrão', value: 'gemini-2.5-pro-preview-06-05' },
                { name: 'Gemini 3 Pro (High)', value: 'gemini-2.5-pro-preview-05-06' },
                { name: 'Gemini 3 Flash', value: 'gemini-2.5-flash-preview-05-20' },
                { name: 'Gemini 2.0 Flash (Experimental)', value: 'gemini-2.0-flash-exp' },
                { name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
            ];
        case 'openai':
            return [
                { name: 'GPT-4o', value: 'gpt-4o' },
                { name: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                { name: 'GPT-4.1', value: 'gpt-4.1' },
                { name: 'o1 Preview', value: 'o1-preview' },
                { name: 'o1 Mini', value: 'o1-mini' },
                { name: 'o3 Mini', value: 'o3-mini' },
            ];
        case 'anthropic':
            return [
                { name: '⭐ Claude Sonnet 4.5', value: 'claude-sonnet-4-20250514' },
                { name: 'Claude Sonnet 4.5 (Thinking)', value: 'claude-sonnet-4-20250514-thinking' },
                { name: 'Claude Opus 4.5', value: 'claude-opus-4-20250514' },
                { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
                { name: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
            ];
        case 'groq':
            return [
                { name: 'LLaMA 3.3 70B Versatile', value: 'llama-3.3-70b-versatile' },
                { name: 'LLaMA 3.1 70B', value: 'llama-3.1-70b-versatile' },
                { name: 'LLaMA 3.1 8B', value: 'llama-3.1-8b-instant' },
                { name: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
                { name: 'Gemma 2 9B', value: 'gemma2-9b-it' },
            ];
        case 'ollama':
            return [
                { name: 'LLaMA 3.2', value: 'llama3.2' },
                { name: 'LLaMA 3.1', value: 'llama3.1' },
                { name: 'Mistral', value: 'mistral' },
                { name: 'Qwen 2.5', value: 'qwen2.5' },
                { name: 'Phi-3', value: 'phi3' },
                { name: 'CodeGemma', value: 'codegemma' },
                { name: 'DeepSeek Coder v2', value: 'deepseek-coder-v2' },
            ];
        case 'deepseek':
            return [
                { name: 'DeepSeek Chat', value: 'deepseek-chat' },
                { name: 'DeepSeek Coder', value: 'deepseek-coder' },
            ];
        case 'mistral':
            return [
                { name: 'Mistral Large', value: 'mistral-large-latest' },
                { name: 'Mistral Medium', value: 'mistral-medium-latest' },
                { name: 'Mistral Small', value: 'mistral-small-latest' },
                { name: 'Codestral', value: 'codestral-latest' },
            ];
        case 'openrouter':
            return [
                { name: '⭐ Claude Sonnet 4.5', value: 'anthropic/claude-sonnet-4' },
                { name: 'Claude Sonnet 4.5 (Thinking)', value: 'anthropic/claude-sonnet-4:thinking' },
                { name: 'Claude Opus 4.5 (Thinking)', value: 'anthropic/claude-opus-4:thinking' },
                { name: 'GPT-4o', value: 'openai/gpt-4o' },
                { name: 'LLaMA 3.1 405B', value: 'meta-llama/llama-3.1-405b-instruct' },
                { name: 'Gemini Pro 1.5', value: 'google/gemini-pro-1.5' },
            ];
        default:
            return [];
    }
}

/**
 * PAGIA - UI Command
 * Interface interativa para gerenciamento de configuração
 * Similar ao 'ccr ui' do claude-code-router
 * 
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import { logger } from '../utils/logger.js';
import { getRouterManager } from '../core/router-manager.js';
import { getCredentialsManager } from '../core/credentials.js';
import { getGlobalConfig } from '../core/global-config.js';
import type { ProviderConfig, RouterConfig } from '../core/router-types.js';

// Menu options
const MAIN_MENU_OPTIONS = [
    { value: 'view-config', name: '📋 Ver configuração atual' },
    { value: 'switch-models', name: '🔄 Trocar modelos por tipo' },
    { value: 'add-model', name: '➕ Adicionar novo modelo' },
    { value: 'add-provider', name: '🏢 Criar novo provedor' },
    { value: 'manage-credentials', name: '🔑 Gerenciar credenciais' },
    { value: 'export-preset', name: '📦 Exportar preset' },
    { value: 'import-preset', name: '📥 Importar preset' },
    { value: 'activate', name: '⚡ Gerar variáveis de ambiente' },
    { value: 'settings', name: '⚙️  Configurações gerais' },
    new inquirer.Separator(),
    { value: 'exit', name: '🚪 Sair' },
];

const ROUTER_TYPES = [
    { value: 'default', name: 'Default', description: 'Modelo padrão para tarefas gerais' },
    { value: 'background', name: 'Background', description: 'Tarefas em segundo plano' },
    { value: 'think', name: 'Think', description: 'Raciocínio/planejamento' },
    { value: 'longContext', name: 'Long Context', description: 'Contexto longo (> 60K tokens)' },
    { value: 'webSearch', name: 'Web Search', description: 'Pesquisa na web' },
    { value: 'image', name: 'Image', description: 'Tarefas com imagens' },
    { value: 'code', name: 'Code', description: 'Geração de código' },
];

export const uiCommand = new Command('ui')
    .description('Interface interativa para gerenciamento de configuração (estilo ccr ui)')
    .action(async () => {
        await runInteractiveUI();
    });

async function runInteractiveUI(): Promise<void> {
    const router = getRouterManager();
    const credentials = getCredentialsManager();
    const globalConfig = getGlobalConfig();

    await router.initialize();
    await globalConfig.initialize();

    let running = true;

    while (running) {
        console.clear();
        showHeader();

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'O que você deseja fazer?',
                choices: MAIN_MENU_OPTIONS,
                pageSize: 12,
            },
        ]);

        switch (action) {
            case 'view-config':
                await viewConfiguration(router);
                break;
            case 'switch-models':
                await switchModels(router);
                break;
            case 'add-model':
                await addModel(router);
                break;
            case 'add-provider':
                await addProvider(router, credentials);
                break;
            case 'manage-credentials':
                await manageCredentials(credentials);
                break;
            case 'export-preset':
                await exportPreset(router);
                break;
            case 'import-preset':
                await importPreset(router);
                break;
            case 'activate':
                await showActivation(router);
                break;
            case 'settings':
                await manageSettings(router, globalConfig);
                break;
            case 'exit':
                running = false;
                console.log(chalk.green('\n👋 Até logo!\n'));
                break;
        }
    }
}

function showHeader(): void {
    console.log(
        boxen(
            chalk.cyan.bold('PAGIA Configuration UI') + '\n' +
            chalk.dim('Gerenciamento interativo de modelos e provedores'),
            {
                padding: 1,
                margin: { top: 0, bottom: 1, left: 0, right: 0 },
                borderStyle: 'round',
                borderColor: 'cyan',
            }
        )
    );
}

async function viewConfiguration(router: ReturnType<typeof getRouterManager>): Promise<void> {
    const config = router.getConfig();

    console.log('');
    console.log(chalk.bold.cyan('  📋 Configuração Atual'));
    console.log(chalk.gray('  ═'.repeat(40)));

    // Providers
    console.log('');
    console.log(chalk.bold('  Provedores:'));
    if (config.providers.length === 0) {
        console.log(chalk.yellow('    Nenhum provedor configurado.'));
    } else {
        for (const p of config.providers) {
            const status = p.enabled !== false ? chalk.green('●') : chalk.gray('○');
            console.log(`    ${status} ${chalk.cyan(p.name.padEnd(12))} ${chalk.gray(p.models.length + ' modelos')}`);
        }
    }

    // Router configuration
    console.log('');
    console.log(chalk.bold('  Roteamento:'));
    for (const rt of ROUTER_TYPES) {
        const route = (config.router as any)[rt.value];
        if (route && typeof route === 'object' && 'provider' in route) {
            console.log(`    ${chalk.cyan(rt.name.padEnd(14))} → ${route.provider}/${chalk.bold(route.model)}`);
        }
    }

    // Settings
    console.log('');
    console.log(chalk.bold('  Configurações:'));
    console.log(`    API Timeout: ${config.settings.apiTimeout || 120000}ms`);
    console.log(`    Log Level:   ${config.settings.logLevel || 'info'}`);

    console.log('');
    await pressEnterToContinue();
}

async function switchModels(router: ReturnType<typeof getRouterManager>): Promise<void> {
    const config = router.getConfig();

    if (config.providers.length === 0) {
        console.log(chalk.yellow('\n⚠️  Nenhum provedor configurado. Adicione um provedor primeiro.\n'));
        await pressEnterToContinue();
        return;
    }

    const { routerType } = await inquirer.prompt([
        {
            type: 'list',
            name: 'routerType',
            message: 'Qual tipo de roteador você quer configurar?',
            choices: ROUTER_TYPES.map(rt => ({
                name: `${rt.name} - ${rt.description}`,
                value: rt.value,
            })),
        },
    ]);

    const { provider } = await inquirer.prompt([
        {
            type: 'list',
            name: 'provider',
            message: 'Selecione o provedor:',
            choices: config.providers.map(p => ({
                name: `${p.name} (${p.models.length} modelos)`,
                value: p.name,
            })),
        },
    ]);

    const selectedProvider = config.providers.find(p => p.name === provider)!;

    const { model } = await inquirer.prompt([
        {
            type: 'list',
            name: 'model',
            message: 'Selecione o modelo:',
            choices: selectedProvider.models,
        },
    ]);

    await router.setRouter(routerType as keyof RouterConfig, provider, model);

    console.log(chalk.green(`\n✅ ${routerType} configurado para ${provider}/${model}\n`));
    await pressEnterToContinue();
}

async function addModel(router: ReturnType<typeof getRouterManager>): Promise<void> {
    const config = router.getConfig();

    if (config.providers.length === 0) {
        console.log(chalk.yellow('\n⚠️  Nenhum provedor configurado. Adicione um provedor primeiro.\n'));
        await pressEnterToContinue();
        return;
    }

    const { provider } = await inquirer.prompt([
        {
            type: 'list',
            name: 'provider',
            message: 'Adicionar modelo a qual provedor?',
            choices: config.providers.map(p => p.name),
        },
    ]);

    const { modelName } = await inquirer.prompt([
        {
            type: 'input',
            name: 'modelName',
            message: 'Nome do modelo:',
            validate: (input) => input.length > 0 || 'Nome do modelo é obrigatório',
        },
    ]);

    await router.addModel(provider, modelName);

    console.log(chalk.green(`\n✅ Modelo "${modelName}" adicionado ao ${provider}\n`));
    await pressEnterToContinue();
}

async function addProvider(
    router: ReturnType<typeof getRouterManager>,
    credentials: ReturnType<typeof getCredentialsManager>
): Promise<void> {
    const knownProviders = [
        { name: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/chat/completions', models: 'gemini-2.0-flash-exp, gemini-1.5-pro-latest' },
        { name: 'openai', url: 'https://api.openai.com/v1/chat/completions', models: 'gpt-4-turbo, gpt-4o, gpt-4o-mini' },
        { name: 'anthropic', url: 'https://api.anthropic.com/v1/messages', models: 'claude-3-opus-20240229, claude-3-5-sonnet-20241022' },
        { name: 'groq', url: 'https://api.groq.com/openai/v1/chat/completions', models: 'llama3-70b-8192, llama3-8b-8192' },
        { name: 'deepseek', url: 'https://api.deepseek.com/chat/completions', models: 'deepseek-chat, deepseek-coder' },
        { name: 'mistral', url: 'https://api.mistral.ai/v1/chat/completions', models: 'mistral-large-latest, codestral-latest' },
        { name: 'openrouter', url: 'https://openrouter.ai/api/v1/chat/completions', models: 'anthropic/claude-sonnet-4, openai/gpt-4o' },
        { name: 'ollama', url: 'http://localhost:11434/api/chat', models: 'llama3, codellama, mistral' },
    ];

    const { providerChoice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'providerChoice',
            message: 'Selecione o provedor:',
            choices: [
                ...knownProviders.map(p => ({ name: p.name, value: p })),
                new inquirer.Separator(),
                { name: 'Outro (customizado)', value: 'custom' },
            ],
        },
    ]);

    let providerName: string;
    let apiUrl: string;
    let defaultModels: string;

    if (providerChoice === 'custom') {
        const { customName, customUrl, customModels } = await inquirer.prompt([
            {
                type: 'input',
                name: 'customName',
                message: 'Nome do provedor:',
                validate: (input) => input.length > 0 || 'Nome é obrigatório',
            },
            {
                type: 'input',
                name: 'customUrl',
                message: 'URL base da API:',
                validate: (input) => input.startsWith('http') || 'URL deve começar com http',
            },
            {
                type: 'input',
                name: 'customModels',
                message: 'Modelos (separados por vírgula):',
            },
        ]);

        providerName = customName;
        apiUrl = customUrl;
        defaultModels = customModels;
    } else {
        providerName = providerChoice.name;
        apiUrl = providerChoice.url;
        defaultModels = providerChoice.models;
    }

    // Check for stored credentials
    let apiKey: string = '';
    const storedKey = await credentials.getApiKey(providerName as any);

    if (storedKey) {
        const { useStored } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'useStored',
                message: `Usar API key armazenada para ${providerName}?`,
                default: true,
            },
        ]);

        if (useStored) {
            apiKey = storedKey;
        }
    }

    if (!apiKey) {
        const { inputKey } = await inquirer.prompt([
            {
                type: 'password',
                name: 'inputKey',
                message: 'API key:',
                mask: '*',
                validate: (input) => input.length > 5 || 'API key é obrigatória',
            },
        ]);
        apiKey = inputKey;
    }

    // Confirm models
    const { models } = await inquirer.prompt([
        {
            type: 'input',
            name: 'models',
            message: 'Modelos disponíveis:',
            default: defaultModels,
        },
    ]);

    // Transformer configuration
    const { configureTransformer } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'configureTransformer',
            message: 'Configurar transformador?',
            default: false,
        },
    ]);

    let transformer = undefined;
    if (configureTransformer) {
        const { transformerType } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'transformerType',
                message: 'Selecione os transformadores:',
                choices: [
                    'openai', 'anthropic', 'gemini', 'deepseek', 'groq',
                    'openrouter', 'mistral', 'ollama', 'maxtoken', 'tooluse',
                ],
            },
        ]);

        if (transformerType.length > 0) {
            transformer = { use: transformerType };
        }
    }

    const provider: ProviderConfig = {
        name: providerName,
        api_base_url: apiUrl,
        api_key: apiKey,
        models: models.split(',').map((m: string) => m.trim()),
        transformer,
        enabled: true,
    };

    await router.addProvider(provider);

    console.log(chalk.green(`\n✅ Provedor "${providerName}" adicionado com sucesso!\n`));
    await pressEnterToContinue();
}

async function manageCredentials(
    credentials: ReturnType<typeof getCredentialsManager>
): Promise<void> {
    const options = [
        { value: 'status', name: '📋 Ver status' },
        { value: 'add', name: '➕ Adicionar credencial' },
        { value: 'remove', name: '❌ Remover credencial' },
        { value: 'import', name: '📥 Importar do .env' },
        { value: 'back', name: '← Voltar' },
    ];

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Gerenciamento de Credenciais:',
            choices: options,
        },
    ]);

    switch (action) {
        case 'status': {
            const providers = await credentials.listProviders();
            console.log('');
            console.log(chalk.bold('  Credenciais Armazenadas:'));
            if (providers.length === 0) {
                console.log(chalk.yellow('    Nenhuma credencial armazenada.'));
            } else {
                for (const p of providers) {
                    const cred = await credentials.get(p);
                    if (cred) {
                        console.log(`    ${chalk.green('✓')} ${p}: ${cred.apiKey.substring(0, 6)}...`);
                    }
                }
            }
            console.log('');
            break;
        }

        case 'add': {
            const providerList = ['gemini', 'openai', 'anthropic', 'groq', 'deepseek', 'mistral', 'openrouter'];

            const { provider } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'provider',
                    message: 'Provedor:',
                    choices: providerList,
                },
            ]);

            const { apiKey } = await inquirer.prompt([
                {
                    type: 'password',
                    name: 'apiKey',
                    message: 'API Key:',
                    mask: '*',
                },
            ]);

            await credentials.store(provider, apiKey);
            console.log(chalk.green(`\n✅ Credencial para ${provider} armazenada.\n`));
            break;
        }

        case 'remove': {
            const providers = await credentials.listProviders();
            if (providers.length === 0) {
                console.log(chalk.yellow('\nNenhuma credencial para remover.\n'));
                break;
            }

            const { provider } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'provider',
                    message: 'Remover credencial de:',
                    choices: providers,
                },
            ]);

            await credentials.delete(provider);
            console.log(chalk.green(`\n✅ Credencial de ${provider} removida.\n`));
            break;
        }

        case 'import': {
            const imported = await credentials.importFromEnvironment();
            if (imported.length === 0) {
                console.log(chalk.yellow('\nNenhuma nova credencial encontrada no ambiente.\n'));
            } else {
                console.log(chalk.green(`\n✅ ${imported.length} credenciais importadas: ${imported.join(', ')}\n`));
            }
            break;
        }
    }

    await pressEnterToContinue();
}

async function exportPreset(router: ReturnType<typeof getRouterManager>): Promise<void> {
    const { name, description, author, tags } = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Nome do preset:',
            validate: (input) => input.length > 0 || 'Nome é obrigatório',
        },
        {
            type: 'input',
            name: 'description',
            message: 'Descrição (opcional):',
        },
        {
            type: 'input',
            name: 'author',
            message: 'Autor (opcional):',
        },
        {
            type: 'input',
            name: 'tags',
            message: 'Tags (separadas por vírgula, opcional):',
        },
    ]);

    const presetPath = await router.exportPreset(name, {
        description: description || undefined,
        author: author || undefined,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : undefined,
    });

    console.log(chalk.green(`\n✅ Preset exportado: ${presetPath}`));
    console.log(chalk.gray('   Nota: API keys foram substituídas por placeholders.\n'));

    await pressEnterToContinue();
}

async function importPreset(router: ReturnType<typeof getRouterManager>): Promise<void> {
    const presets = router.listPresets();

    if (presets.length === 0) {
        console.log(chalk.yellow('\nNenhum preset disponível.\n'));
        await pressEnterToContinue();
        return;
    }

    const { preset } = await inquirer.prompt([
        {
            type: 'list',
            name: 'preset',
            message: 'Selecione o preset:',
            choices: presets,
        },
    ]);

    const manifest = router.getPreset(preset);
    if (!manifest) {
        console.log(chalk.red('\n❌ Preset não encontrado.\n'));
        await pressEnterToContinue();
        return;
    }

    // Collect inputs
    const inputs: Record<string, string> = {};
    if (manifest.inputs) {
        for (const input of manifest.inputs) {
            const { value } = await inquirer.prompt([
                {
                    type: input.type === 'password' ? 'password' : 'input',
                    name: 'value',
                    message: `${input.name}:`,
                    mask: input.type === 'password' ? '*' : undefined,
                },
            ]);
            inputs[input.name] = value;
        }
    }

    // Not implementing full install here - would need preset path
    console.log(chalk.yellow('\n⚠️  Instalação de presets externos ainda não implementada.\n'));
    await pressEnterToContinue();
}

async function showActivation(router: ReturnType<typeof getRouterManager>): Promise<void> {
    const { shell } = await inquirer.prompt([
        {
            type: 'list',
            name: 'shell',
            message: 'Qual shell você está usando?',
            choices: [
                { name: 'PowerShell', value: 'powershell' },
                { name: 'CMD', value: 'cmd' },
                { name: 'Bash/Zsh', value: 'bash' },
            ],
        },
    ]);

    try {
        const script = router.getActivationScript(shell);

        console.log('');
        console.log(chalk.bold.cyan('  ⚡ Script de Ativação'));
        console.log(chalk.gray('  ─'.repeat(40)));
        console.log('');
        console.log(chalk.white(script));
        console.log('');
        console.log(chalk.gray('  Copie e cole no seu terminal para ativar.'));
        console.log('');

    } catch (error: any) {
        console.log(chalk.red(`\n❌ Erro: ${error.message}\n`));
    }

    await pressEnterToContinue();
}

async function manageSettings(
    router: ReturnType<typeof getRouterManager>,
    globalConfig: ReturnType<typeof getGlobalConfig>
): Promise<void> {
    const config = router.getConfig();
    const settings = globalConfig.getSettings();

    const { setting } = await inquirer.prompt([
        {
            type: 'list',
            name: 'setting',
            message: 'Qual configuração deseja alterar?',
            choices: [
                { name: `API Timeout: ${config.settings.apiTimeout || 120000}ms`, value: 'apiTimeout' },
                { name: `Log Level: ${config.settings.logLevel || 'info'}`, value: 'logLevel' },
                { name: `Telemetria: ${config.settings.disableTelemetry ? 'Desabilitada' : 'Habilitada'}`, value: 'telemetry' },
                { name: `Long Context Threshold: ${config.router.longContextThreshold || 60000} tokens`, value: 'longContextThreshold' },
                new inquirer.Separator(),
                { name: '← Voltar', value: 'back' },
            ],
        },
    ]);

    if (setting === 'back') return;

    switch (setting) {
        case 'apiTimeout': {
            const { value } = await inquirer.prompt([
                {
                    type: 'number',
                    name: 'value',
                    message: 'API Timeout (ms):',
                    default: config.settings.apiTimeout || 120000,
                },
            ]);
            config.settings.apiTimeout = value;
            break;
        }

        case 'logLevel': {
            const { value } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'value',
                    message: 'Log Level:',
                    choices: ['debug', 'info', 'warn', 'error'],
                },
            ]);
            config.settings.logLevel = value;
            break;
        }

        case 'telemetry': {
            const { value } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'value',
                    message: 'Desabilitar telemetria?',
                    default: config.settings.disableTelemetry,
                },
            ]);
            config.settings.disableTelemetry = value;
            break;
        }

        case 'longContextThreshold': {
            const { value } = await inquirer.prompt([
                {
                    type: 'number',
                    name: 'value',
                    message: 'Long Context Threshold (tokens):',
                    default: config.router.longContextThreshold || 60000,
                },
            ]);
            config.router.longContextThreshold = value;
            break;
        }
    }

    await router.saveConfig(config);
    console.log(chalk.green('\n✅ Configuração salva!\n'));
    await pressEnterToContinue();
}

async function pressEnterToContinue(): Promise<void> {
    await inquirer.prompt([
        {
            type: 'input',
            name: 'continue',
            message: 'Pressione Enter para continuar...',
        },
    ]);
}

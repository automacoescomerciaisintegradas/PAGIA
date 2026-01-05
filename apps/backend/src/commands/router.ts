/**
 * PAGIA - Router Command
 * Gerenciamento de roteamento de modelos estilo claude-code-router
 * 
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { getRouterManager } from '../core/router-manager.js';
import { getCredentialsManager } from '../core/credentials.js';
import type { ProviderConfig, RouterConfig } from '../core/router-types.js';

// Available router types for model assignment
const ROUTER_TYPES: Array<{ value: keyof RouterConfig; name: string; description: string }> = [
    { value: 'default', name: 'Default', description: 'Modelo padrão para tarefas gerais' },
    { value: 'background', name: 'Background', description: 'Tarefas em segundo plano (pode ser mais barato)' },
    { value: 'think', name: 'Think', description: 'Raciocínio/planejamento (requer mais capacidade)' },
    { value: 'longContext', name: 'Long Context', description: 'Contexto longo (> 60K tokens)' },
    { value: 'webSearch', name: 'Web Search', description: 'Pesquisa na web' },
    { value: 'image', name: 'Image', description: 'Tarefas com imagens' },
    { value: 'code', name: 'Code', description: 'Geração de código' },
];

export const routerCommand = new Command('router')
    .description('Gerenciar roteamento de modelos de IA (estilo claude-code-router)')
    .addHelpText('after', `
${chalk.bold('Exemplos:')}
  ${chalk.cyan('pagia router status')}           Ver configuração atual de roteamento
  ${chalk.cyan('pagia router switch')}           Trocar modelo para um tipo de roteador
  ${chalk.cyan('pagia router provider add')}     Adicionar novo provedor
  ${chalk.cyan('pagia router model add')}        Adicionar modelo a um provedor
  ${chalk.cyan('pagia router preset export')}    Exportar configuração como preset
  ${chalk.cyan('pagia router activate')}         Gerar variáveis de ambiente

${chalk.bold('Tipos de Roteamento:')}
  ${ROUTER_TYPES.map(t => `${chalk.green(t.value.padEnd(14))} ${t.description}`).join('\n  ')}
`);

// ==================== STATUS COMMAND ====================

routerCommand
    .command('status')
    .description('Ver configuração atual de roteamento')
    .action(async () => {
        const router = getRouterManager();
        await router.initialize();

        const config = router.getConfig();

        console.log('');
        console.log(chalk.bold('  🔀 Configuração de Roteamento'));
        console.log(chalk.gray('  ─'.repeat(35)));
        console.log('');

        // Show providers
        console.log(chalk.bold('  📦 Provedores Configurados:'));
        if (config.providers.length === 0) {
            console.log(chalk.yellow('    Nenhum provedor configurado.'));
            console.log(chalk.gray('    Use "pagia router provider add" para adicionar.'));
        } else {
            for (const provider of config.providers) {
                const status = provider.enabled !== false ? chalk.green('✓') : chalk.gray('○');
                const models = provider.models.slice(0, 3).join(', ');
                const moreModels = provider.models.length > 3 ? `+${provider.models.length - 3}` : '';
                console.log(`    ${status} ${chalk.cyan(provider.name.padEnd(12))} ${chalk.gray(models)} ${chalk.dim(moreModels)}`);
            }
        }

        console.log('');
        console.log(chalk.bold('  🎯 Roteamento de Modelos:'));

        const routerConfig = config.router;
        for (const rt of ROUTER_TYPES) {
            const route = (routerConfig as any)[rt.value];
            if (route && typeof route === 'object' && 'provider' in route) {
                console.log(`    ${chalk.cyan(rt.name.padEnd(14))} ${route.provider}/${chalk.bold(route.model)}`);
            } else if (rt.value === 'default') {
                console.log(`    ${chalk.cyan(rt.name.padEnd(14))} ${chalk.yellow('Não configurado')}`);
            }
        }

        if (routerConfig.longContextThreshold) {
            console.log(`    ${chalk.gray('Threshold:')}      ${routerConfig.longContextThreshold} tokens`);
        }

        console.log('');
        console.log(chalk.bold('  ⚙️  Configurações:'));
        console.log(`    ${chalk.gray('API Timeout:')}   ${config.settings.apiTimeout || 120000}ms`);
        console.log(`    ${chalk.gray('Telemetria:')}    ${config.settings.disableTelemetry ? 'Desabilitada' : 'Habilitada'}`);
        console.log(`    ${chalk.gray('Log Level:')}     ${config.settings.logLevel || 'info'}`);

        console.log('');
    });

// ==================== SWITCH COMMAND ====================

routerCommand
    .command('switch [type] [provider] [model]')
    .description('Trocar modelo para um tipo de roteador')
    .action(async (type?: string, provider?: string, model?: string) => {
        const router = getRouterManager();
        await router.initialize();

        const config = router.getConfig();

        try {
            // If type not specified, show interactive selection
            if (!type) {
                const { selectedType } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'selectedType',
                        message: 'Selecione o tipo de roteador:',
                        choices: ROUTER_TYPES.map(t => ({
                            name: `${t.name} - ${t.description}`,
                            value: t.value,
                        })),
                    },
                ]);
                type = selectedType;
            }

            // Validate type
            if (!ROUTER_TYPES.find(t => t.value === type)) {
                logger.error(`Tipo inválido: ${type}`);
                console.log(chalk.yellow(`Tipos válidos: ${ROUTER_TYPES.map(t => t.value).join(', ')}`));
                return;
            }

            // If provider not specified, show selection
            if (!provider) {
                if (config.providers.length === 0) {
                    logger.error('Nenhum provedor configurado.');
                    console.log(chalk.gray('Use "pagia router provider add" para adicionar um provedor.'));
                    return;
                }

                const { selectedProvider } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'selectedProvider',
                        message: 'Selecione o provedor:',
                        choices: config.providers.map(p => ({
                            name: `${p.name} - ${p.models.length} modelos`,
                            value: p.name,
                        })),
                    },
                ]);
                provider = selectedProvider;
            }

            // Get provider config
            const providerConfig = config.providers.find(p => p.name === provider);
            if (!providerConfig) {
                logger.error(`Provedor não encontrado: ${provider}`);
                return;
            }

            // If model not specified, show selection
            if (!model) {
                const { selectedModel } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'selectedModel',
                        message: 'Selecione o modelo:',
                        choices: providerConfig.models,
                    },
                ]);
                model = selectedModel;
            }

            // Validate model exists
            if (!providerConfig.models.includes(model!)) {
                logger.warn(`Modelo "${model}" não está na lista do provedor.`);
                const { addModel } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'addModel',
                        message: 'Deseja adicionar este modelo ao provedor?',
                        default: true,
                    },
                ]);

                if (addModel) {
                    await router.addModel(provider!, model!);
                }
            }

            // Set the router
            await router.setRouter(type as keyof RouterConfig, provider!, model!);

            logger.success(`Roteador "${type}" configurado: ${provider}/${model}`);

        } catch (error: any) {
            logger.error(`Falha ao configurar roteador: ${error.message}`);
            process.exitCode = 1;
        }
    });

// ==================== PROVIDER COMMANDS ====================

const providerCommand = routerCommand
    .command('provider')
    .description('Gerenciar provedores de IA');

providerCommand
    .command('add [name]')
    .description('Adicionar novo provedor')
    .option('-u, --url <url>', 'URL base da API')
    .option('-k, --key <apiKey>', 'API key')
    .option('-m, --models <models>', 'Lista de modelos (separados por vírgula)')
    .action(async (name?: string, options?: { url?: string; key?: string; models?: string }) => {
        const router = getRouterManager();
        await router.initialize();

        const credentials = getCredentialsManager();

        try {
            // Interactive mode if no name provided
            if (!name) {
                const knownProviders = [
                    { name: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/chat/completions' },
                    { name: 'openai', url: 'https://api.openai.com/v1/chat/completions' },
                    { name: 'anthropic', url: 'https://api.anthropic.com/v1/messages' },
                    { name: 'groq', url: 'https://api.groq.com/openai/v1/chat/completions' },
                    { name: 'deepseek', url: 'https://api.deepseek.com/chat/completions' },
                    { name: 'mistral', url: 'https://api.mistral.ai/v1/chat/completions' },
                    { name: 'openrouter', url: 'https://openrouter.ai/api/v1/chat/completions' },
                    { name: 'ollama', url: 'http://localhost:11434/api/chat' },
                    { name: 'custom', url: '' },
                ];

                const { providerChoice } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'providerChoice',
                        message: 'Selecione o provedor:',
                        choices: knownProviders.map(p => ({
                            name: p.name === 'custom' ? 'Outro (customizado)' : p.name,
                            value: p.name,
                        })),
                    },
                ]);

                if (providerChoice === 'custom') {
                    const { customName } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'customName',
                            message: 'Nome do provedor:',
                            validate: (input) => input.length > 0 || 'Nome é obrigatório',
                        },
                    ]);
                    name = customName;
                } else {
                    name = providerChoice;
                    options = options || {};
                    options.url = knownProviders.find(p => p.name === providerChoice)?.url;
                }
            }

            // Get URL if not provided
            let apiUrl = options?.url;
            if (!apiUrl) {
                const { inputUrl } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'inputUrl',
                        message: 'URL base da API:',
                        validate: (input) => input.startsWith('http') || 'URL deve começar com http',
                    },
                ]);
                apiUrl = inputUrl;
            }

            // Get API key - try from credentials first
            let apiKey = options?.key;
            if (!apiKey) {
                const storedKey = await credentials.getApiKey(name as any);
                if (storedKey) {
                    const { useStored } = await inquirer.prompt([
                        {
                            type: 'confirm',
                            name: 'useStored',
                            message: `Usar API key armazenada para ${name}?`,
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
                        },
                    ]);
                    apiKey = inputKey;
                }
            }

            // Get models
            let models: string[] = [];
            if (options?.models) {
                models = options.models.split(',').map(m => m.trim());
            } else {
                const { inputModels } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'inputModels',
                        message: 'Modelos disponíveis (separados por vírgula):',
                        default: getDefaultModels(name!),
                    },
                ]);
                models = inputModels.split(',').map((m: string) => m.trim());
            }

            const provider: ProviderConfig = {
                name: name!,
                api_base_url: apiUrl!,
                api_key: apiKey!,
                models,
                enabled: true,
            };

            await router.addProvider(provider);

            logger.success(`Provedor "${name}" adicionado com ${models.length} modelos.`);

        } catch (error: any) {
            logger.error(`Falha ao adicionar provedor: ${error.message}`);
            process.exitCode = 1;
        }
    });

providerCommand
    .command('remove [name]')
    .description('Remover um provedor')
    .action(async (name?: string) => {
        const router = getRouterManager();
        await router.initialize();

        try {
            if (!name) {
                const providers = router.getProviders();
                if (providers.length === 0) {
                    console.log(chalk.yellow('Nenhum provedor configurado.'));
                    return;
                }

                const { selectedProvider } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'selectedProvider',
                        message: 'Selecione o provedor para remover:',
                        choices: providers.map(p => p.name),
                    },
                ]);
                name = selectedProvider;
            }

            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Tem certeza que deseja remover "${name}"?`,
                    default: false,
                },
            ]);

            if (!confirm) {
                console.log(chalk.blue('Operação cancelada.'));
                return;
            }

            const removed = await router.removeProvider(name!);

            if (removed) {
                logger.success(`Provedor "${name}" removido.`);
            } else {
                console.log(chalk.yellow(`Provedor "${name}" não encontrado.`));
            }

        } catch (error: any) {
            logger.error(`Falha ao remover provedor: ${error.message}`);
            process.exitCode = 1;
        }
    });

providerCommand
    .command('list')
    .description('Listar todos os provedores')
    .action(async () => {
        const router = getRouterManager();
        await router.initialize();

        const providers = router.getProviders();

        console.log('');
        console.log(chalk.bold('  📦 Provedores Configurados'));
        console.log(chalk.gray('  ─'.repeat(35)));
        console.log('');

        if (providers.length === 0) {
            console.log(chalk.yellow('  Nenhum provedor configurado.'));
            console.log(chalk.gray('  Use "pagia router provider add" para adicionar.'));
        } else {
            for (const provider of providers) {
                const status = provider.enabled !== false ? chalk.green('✓') : chalk.gray('○');
                console.log(`  ${status} ${chalk.bold(provider.name)}`);
                console.log(`    ${chalk.gray('URL:')} ${provider.api_base_url}`);
                console.log(`    ${chalk.gray('Modelos:')} ${provider.models.join(', ')}`);
                console.log('');
            }
        }
    });

// ==================== MODEL COMMANDS ====================

const modelCommand = routerCommand
    .command('model')
    .description('Gerenciar modelos');

modelCommand
    .command('add <provider> <model>')
    .description('Adicionar modelo a um provedor')
    .action(async (provider: string, model: string) => {
        const router = getRouterManager();
        await router.initialize();

        const added = await router.addModel(provider, model);

        if (added) {
            logger.success(`Modelo "${model}" adicionado ao provedor "${provider}".`);
        } else {
            logger.error(`Provedor "${provider}" não encontrado.`);
        }
    });

modelCommand
    .command('remove <provider> <model>')
    .description('Remover modelo de um provedor')
    .action(async (provider: string, model: string) => {
        const router = getRouterManager();
        await router.initialize();

        const removed = await router.removeModel(provider, model);

        if (removed) {
            logger.success(`Modelo "${model}" removido do provedor "${provider}".`);
        } else {
            logger.error(`Modelo ou provedor não encontrado.`);
        }
    });

// ==================== PRESET COMMANDS ====================

const presetCommand = routerCommand
    .command('preset')
    .description('Gerenciar presets de configuração');

presetCommand
    .command('export <name>')
    .description('Exportar configuração atual como preset')
    .option('-d, --description <desc>', 'Descrição do preset')
    .option('-a, --author <author>', 'Autor do preset')
    .option('-t, --tags <tags>', 'Tags (separadas por vírgula)')
    .action(async (name: string, options: { description?: string; author?: string; tags?: string }) => {
        const router = getRouterManager();
        await router.initialize();

        try {
            const presetPath = await router.exportPreset(name, {
                description: options.description,
                author: options.author,
                tags: options.tags?.split(',').map(t => t.trim()),
            });

            logger.success(`Preset "${name}" exportado para: ${presetPath}`);
            console.log(chalk.gray('Nota: API keys foram substituídas por placeholders.'));

        } catch (error: any) {
            logger.error(`Falha ao exportar preset: ${error.message}`);
            process.exitCode = 1;
        }
    });

presetCommand
    .command('list')
    .description('Listar presets instalados')
    .action(async () => {
        const router = getRouterManager();
        await router.initialize();

        const presets = router.listPresets();

        console.log('');
        console.log(chalk.bold('  📋 Presets Instalados'));
        console.log(chalk.gray('  ─'.repeat(30)));
        console.log('');

        if (presets.length === 0) {
            console.log(chalk.yellow('  Nenhum preset instalado.'));
        } else {
            for (const preset of presets) {
                const manifest = router.getPreset(preset);
                if (manifest) {
                    console.log(`  ${chalk.cyan(preset)}`);
                    if (manifest.description) {
                        console.log(`    ${chalk.gray(manifest.description)}`);
                    }
                    if (manifest.tags && manifest.tags.length > 0) {
                        console.log(`    ${chalk.dim(manifest.tags.join(', '))}`);
                    }
                }
            }
        }

        console.log('');
    });

presetCommand
    .command('info <name>')
    .description('Ver informações de um preset')
    .action(async (name: string) => {
        const router = getRouterManager();
        await router.initialize();

        const manifest = router.getPreset(name);

        if (!manifest) {
            logger.error(`Preset "${name}" não encontrado.`);
            return;
        }

        console.log('');
        console.log(chalk.bold(`  📋 Preset: ${manifest.name}`));
        console.log(chalk.gray('  ─'.repeat(30)));
        console.log('');
        console.log(`  ${chalk.gray('Versão:')}       ${manifest.version}`);
        console.log(`  ${chalk.gray('Descrição:')}    ${manifest.description || '-'}`);
        console.log(`  ${chalk.gray('Autor:')}        ${manifest.author || '-'}`);
        console.log(`  ${chalk.gray('Tags:')}         ${manifest.tags?.join(', ') || '-'}`);
        console.log(`  ${chalk.gray('Criado em:')}    ${manifest.createdAt}`);
        console.log(`  ${chalk.gray('Provedores:')}   ${manifest.config.providers.length}`);
        console.log('');

        if (manifest.inputs && manifest.inputs.length > 0) {
            console.log(chalk.bold('  Inputs necessários:'));
            for (const input of manifest.inputs) {
                console.log(`    - ${input.name}: ${input.description}`);
            }
            console.log('');
        }
    });

presetCommand
    .command('delete <name>')
    .description('Deletar um preset')
    .action(async (name: string) => {
        const router = getRouterManager();
        await router.initialize();

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Tem certeza que deseja deletar o preset "${name}"?`,
                default: false,
            },
        ]);

        if (!confirm) {
            console.log(chalk.blue('Operação cancelada.'));
            return;
        }

        const deleted = router.deletePreset(name);

        if (deleted) {
            logger.success(`Preset "${name}" deletado.`);
        } else {
            logger.error(`Preset "${name}" não encontrado.`);
        }
    });

// ==================== ACTIVATE COMMAND ====================

routerCommand
    .command('activate')
    .description('Gerar variáveis de ambiente para ativar o roteador')
    .option('-s, --shell <shell>', 'Shell (bash, powershell, cmd)', 'powershell')
    .action(async (options: { shell: 'bash' | 'powershell' | 'cmd' }) => {
        const router = getRouterManager();
        await router.initialize();

        try {
            const script = router.getActivationScript(options.shell);

            console.log('');
            console.log(chalk.bold('  🔓 Script de Ativação'));
            console.log(chalk.gray('  ─'.repeat(30)));
            console.log('');
            console.log(chalk.gray('  Execute o seguinte comando para ativar:'));
            console.log('');

            if (options.shell === 'powershell') {
                console.log(chalk.cyan('  # PowerShell:'));
                console.log(chalk.white('  ' + script.split('\n').join('\n  ')));
            } else if (options.shell === 'cmd') {
                console.log(chalk.cyan('  # CMD:'));
                console.log(chalk.white('  ' + script.split('\n').join('\n  ')));
            } else {
                console.log(chalk.cyan('  # Bash/Zsh:'));
                console.log(chalk.white(`  eval "$(pagia router activate --shell bash)"`));
            }

            console.log('');
            console.log(chalk.gray('  Variáveis configuradas:'));

            const envVars = router.getEnvironmentVariables();
            for (const [key, value] of Object.entries(envVars)) {
                const maskedValue = key.includes('KEY') ? value.substring(0, 6) + '...' : value;
                console.log(`    ${chalk.green(key)} = ${chalk.dim(maskedValue)}`);
            }

            console.log('');

        } catch (error: any) {
            logger.error(`Falha ao gerar script: ${error.message}`);
            process.exitCode = 1;
        }
    });

// ==================== INIT COMMAND ====================

routerCommand
    .command('init')
    .description('Inicializar configuração do roteador com base nas credenciais')
    .action(async () => {
        const router = getRouterManager();

        console.log('');
        console.log(chalk.blue('🔄 Inicializando configuração do roteador...'));

        await router.initialize();

        const config = router.getConfig();

        logger.success('Configuração do roteador inicializada!');
        console.log(chalk.gray(`  ${config.providers.length} provedores configurados.`));
        console.log('');
        console.log(chalk.gray('Use "pagia router status" para ver a configuração.'));
        console.log('');
    });

// ==================== HELPER FUNCTIONS ====================

function getDefaultModels(providerName: string): string {
    const defaults: Record<string, string> = {
        gemini: 'gemini-2.0-flash-exp, gemini-1.5-pro-latest',
        openai: 'gpt-4-turbo, gpt-4o, gpt-4o-mini',
        anthropic: 'claude-3-opus-20240229, claude-3-5-sonnet-20241022',
        groq: 'llama3-70b-8192, mixtral-8x7b-32768',
        deepseek: 'deepseek-chat, deepseek-coder',
        mistral: 'mistral-large-latest, codestral-latest',
        openrouter: 'anthropic/claude-sonnet-4, openai/gpt-4o',
        ollama: 'llama3, codellama, mistral',
    };

    return defaults[providerName] || 'model-name';
}

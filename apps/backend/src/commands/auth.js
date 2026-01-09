/**
 * PAGIA - Auth Command
 * Gerenciamento de autenticação e credenciais
 * Seguindo padrão de CLIs como Claude Code, Cursor e Windsurf
 *
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { getCredentialsManager } from '../core/credentials.js';
import { getGlobalConfig } from '../core/global-config.js';
// Available providers for authentication
const PROVIDERS = [
    { value: 'gemini', name: 'Google Gemini', envVar: 'GEMINI_API_KEY' },
    { value: 'openai', name: 'OpenAI', envVar: 'OPENAI_API_KEY' },
    { value: 'anthropic', name: 'Anthropic Claude', envVar: 'ANTHROPIC_API_KEY' },
    { value: 'groq', name: 'Groq', envVar: 'GROQ_API_KEY' },
    { value: 'deepseek', name: 'DeepSeek', envVar: 'DEEPSEEK_API_KEY' },
    { value: 'mistral', name: 'Mistral AI', envVar: 'MISTRAL_API_KEY' },
    { value: 'openrouter', name: 'OpenRouter', envVar: 'OPENROUTER_API_KEY' },
    { value: 'ollama', name: 'Ollama (Local)', envVar: 'OLLAMA_HOST' },
    { value: 'qwen', name: 'Alibaba Qwen', envVar: 'QWEN_API_KEY' },
    { value: 'nvidia', name: 'NVIDIA NIM', envVar: 'NVIDIA_API_KEY' },
    { value: 'together', name: 'Together AI', envVar: 'TOGETHER_API_KEY' },
    { value: 'replicate', name: 'Replicate', envVar: 'REPLICATE_API_KEY' },
    { value: 'zai', name: 'ZAI / GLM (Zhipu AI)', envVar: 'ZAI_API_KEY' },
    { value: 'coder', name: 'AI Coder', envVar: 'CODER_API_KEY' },
    { value: 'claude-coder', name: 'Claude Coder', envVar: 'ANTHROPIC_API_KEY' },
];
export const authCommand = new Command('auth')
    .description('Gerenciar autenticação e credenciais de provedores de IA')
    .addHelpText('after', `
${chalk.bold('Exemplos:')}
  ${chalk.cyan('pagia auth login')}            Autenticar com um provedor de IA
  ${chalk.cyan('pagia auth login gemini')}     Autenticar especificamente com Gemini
  ${chalk.cyan('pagia auth logout openai')}    Remover credenciais do OpenAI
  ${chalk.cyan('pagia auth status')}           Ver status de autenticação
  ${chalk.cyan('pagia auth import')}           Importar credenciais do .env

${chalk.bold('Provedores Suportados:')}
  ${PROVIDERS.map(p => `${chalk.green(p.value.padEnd(12))} ${p.name}`).join('\n  ')}
`);
// Login command
authCommand
    .command('login [provider]')
    .description('Autenticar com um provedor de IA')
    .option('-k, --key <apiKey>', 'API key (não recomendado, prefira entrada interativa)')
    .option('--base-url <url>', 'URL base customizada (para provedores self-hosted)')
    .option('--model <model>', 'Modelo padrão para o provedor')
    .action(async (provider, options) => {
    const credentials = getCredentialsManager();
    try {
        let selectedProvider;
        let apiKey;
        // If provider not specified, ask user
        if (!provider) {
            // Mostrar lista de provedores disponíveis
            console.log(chalk.cyan.bold('\n📋 Provedores de IA Disponíveis:\n'));
            PROVIDERS.forEach((p, i) => {
                const num = String(i + 1).padStart(2, ' ');
                console.log(chalk.gray(`  ${num}. `) + chalk.white(p.name) + chalk.gray(` (${p.value})`));
            });
            console.log('');
            const { providerChoice } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'providerChoice',
                    message: 'Digite o número ou nome do provedor (ex: 1 ou gemini):',
                    validate: (input) => {
                        const trimmed = input.trim();
                        // Verificar se é um número
                        const num = parseInt(trimmed, 10);
                        if (!isNaN(num) && num >= 1 && num <= PROVIDERS.length) {
                            return true;
                        }
                        // Verificar se é um nome válido
                        const found = PROVIDERS.find(p => p.value.toLowerCase() === trimmed.toLowerCase() ||
                            p.name.toLowerCase() === trimmed.toLowerCase());
                        if (found) {
                            return true;
                        }
                        return `Entrada inválida. Use um número (1-${PROVIDERS.length}) ou nome do provedor.`;
                    },
                },
            ]);
            // Converter entrada para provedor
            const trimmed = providerChoice.trim();
            const num = parseInt(trimmed, 10);
            if (!isNaN(num) && num >= 1 && num <= PROVIDERS.length) {
                selectedProvider = PROVIDERS[num - 1].value;
            }
            else {
                const found = PROVIDERS.find(p => p.value.toLowerCase() === trimmed.toLowerCase() ||
                    p.name.toLowerCase() === trimmed.toLowerCase());
                selectedProvider = found.value;
            }
        }
        else {
            // Validate provider
            const validProvider = PROVIDERS.find(p => p.value === provider.toLowerCase());
            if (!validProvider) {
                logger.error(`Provedor inválido: ${provider}`);
                console.log(chalk.yellow(`Provedores válidos: ${PROVIDERS.map(p => p.value).join(', ')}`));
                process.exitCode = 1;
                return;
            }
            selectedProvider = validProvider.value;
        }
        // Get provider info
        const providerInfo = PROVIDERS.find(p => p.value === selectedProvider);
        // Get API key
        if (options.key) {
            apiKey = options.key;
            console.log(chalk.yellow('⚠️  Aviso: Passar API key na linha de comando pode ser inseguro.'));
        }
        else {
            // Check if already has credentials
            const existing = await credentials.get(selectedProvider);
            if (existing) {
                const { confirmOverwrite } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmOverwrite',
                        message: `Já existe uma credencial para ${providerInfo.name}. Deseja substituir?`,
                        default: false,
                    },
                ]);
                if (!confirmOverwrite) {
                    console.log(chalk.blue('Operação cancelada.'));
                    return;
                }
            }
            // Interactive API key input
            const { inputKey } = await inquirer.prompt([
                {
                    type: 'password',
                    name: 'inputKey',
                    message: `Digite sua API key do ${providerInfo.name}:`,
                    mask: '*',
                    validate: (input) => {
                        if (!input || input.length < 10) {
                            return 'API key muito curta. Verifique se está correta.';
                        }
                        // Validate format
                        if (!credentials.validateApiKey(selectedProvider, input)) {
                            return `Formato de API key inválido para ${providerInfo.name}.`;
                        }
                        return true;
                    },
                },
            ]);
            apiKey = inputKey;
        }
        // Store credentials
        await credentials.store(selectedProvider, apiKey, {
            baseUrl: options.baseUrl,
            model: options.model,
        });
        console.log('');
        logger.success(`Autenticado com sucesso no ${providerInfo.name}!`);
        console.log(chalk.gray(`Credenciais armazenadas de forma segura.`));
        // Update global config default provider
        const globalConfig = getGlobalConfig();
        await globalConfig.initialize();
        await globalConfig.set('ai.defaultProvider', selectedProvider);
        console.log(chalk.gray(`${providerInfo.name} definido como provedor padrão.`));
    }
    catch (error) {
        logger.error(`Falha na autenticação: ${error.message}`);
        process.exitCode = 1;
    }
});
// Logout command
authCommand
    .command('logout [provider]')
    .description('Remover credenciais de um provedor')
    .option('-a, --all', 'Remover todas as credenciais')
    .action(async (provider, options) => {
    const credentials = getCredentialsManager();
    try {
        if (options.all) {
            const { confirmAll } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmAll',
                    message: 'Tem certeza que deseja remover TODAS as credenciais?',
                    default: false,
                },
            ]);
            if (!confirmAll) {
                console.log(chalk.blue('Operação cancelada.'));
                return;
            }
            const allProviders = await credentials.listProviders();
            for (const p of allProviders) {
                await credentials.delete(p);
            }
            logger.success(`Removidas ${allProviders.length} credenciais.`);
            return;
        }
        if (!provider) {
            // Ask which provider to logout
            const storedProviders = await credentials.listProviders();
            if (storedProviders.length === 0) {
                console.log(chalk.yellow('Nenhuma credencial armazenada.'));
                return;
            }
            const { providerChoice } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'providerChoice',
                    message: 'Selecione o provedor para remover credenciais:',
                    choices: storedProviders.map(p => ({
                        name: `${PROVIDERS.find(pr => pr.value === p)?.name || p} (${p})`,
                        value: p,
                    })),
                },
            ]);
            provider = providerChoice;
        }
        const deleted = await credentials.delete(provider);
        if (deleted) {
            logger.success(`Credenciais do ${provider} removidas.`);
        }
        else {
            console.log(chalk.yellow(`Nenhuma credencial encontrada para ${provider}.`));
        }
    }
    catch (error) {
        logger.error(`Falha ao remover credenciais: ${error.message}`);
        process.exitCode = 1;
    }
});
// Status command
authCommand
    .command('status')
    .description('Ver status de autenticação de todos os provedores')
    .action(async () => {
    const credentials = getCredentialsManager();
    const globalConfig = getGlobalConfig();
    await globalConfig.initialize();
    const settings = globalConfig.getSettings();
    const defaultProvider = settings.ai.defaultProvider;
    console.log('');
    console.log(chalk.bold('  📋 Status de Autenticação'));
    console.log(chalk.gray('  ─'.repeat(30)));
    console.log('');
    for (const provider of PROVIDERS) {
        const credential = await credentials.get(provider.value);
        const isDefault = provider.value === defaultProvider;
        let statusIcon;
        let statusText;
        if (credential) {
            statusIcon = chalk.green('✓');
            const keyPreview = credential.apiKey.substring(0, 6) + '...' + credential.apiKey.slice(-4);
            statusText = chalk.green(`Autenticado`) + chalk.gray(` (${keyPreview})`);
        }
        else {
            statusIcon = chalk.gray('○');
            statusText = chalk.gray('Não configurado');
        }
        const defaultBadge = isDefault ? chalk.cyan(' [padrão]') : '';
        console.log(`  ${statusIcon} ${provider.name.padEnd(18)} ${statusText}${defaultBadge}`);
    }
    console.log('');
    console.log(chalk.gray('  Use "pagia auth login <provider>" para autenticar.'));
    console.log('');
});
// Import from environment
authCommand
    .command('import')
    .description('Importar credenciais de variáveis de ambiente (.env)')
    .action(async () => {
    const credentials = getCredentialsManager();
    console.log('');
    console.log(chalk.blue('🔍 Procurando credenciais em variáveis de ambiente...'));
    console.log('');
    const imported = await credentials.importFromEnvironment();
    if (imported.length === 0) {
        console.log(chalk.yellow('Nenhuma nova credencial encontrada no ambiente.'));
        console.log(chalk.gray('Configure variáveis como GEMINI_API_KEY, OPENAI_API_KEY, etc.'));
    }
    else {
        console.log(chalk.green(`✓ Importadas ${imported.length} credenciais:`));
        for (const provider of imported) {
            const info = PROVIDERS.find(p => p.value === provider);
            console.log(chalk.gray(`  • ${info?.name || provider}`));
        }
    }
    console.log('');
});
// Set default provider
authCommand
    .command('default [provider]')
    .description('Definir o provedor de IA padrão')
    .action(async (provider) => {
    const credentials = getCredentialsManager();
    const globalConfig = getGlobalConfig();
    await globalConfig.initialize();
    try {
        if (!provider) {
            // Show interactive selection
            const storedProviders = await credentials.listProviders();
            if (storedProviders.length === 0) {
                console.log(chalk.yellow('Nenhuma credencial armazenada. Use "pagia auth login" primeiro.'));
                return;
            }
            const { providerChoice } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'providerChoice',
                    message: 'Selecione o provedor padrão:',
                    choices: storedProviders.map(p => ({
                        name: `${PROVIDERS.find(pr => pr.value === p)?.name || p}`,
                        value: p,
                    })),
                },
            ]);
            provider = providerChoice;
        }
        // Validate provider exists
        const hasCredential = await credentials.has(provider);
        if (!hasCredential) {
            console.log(chalk.yellow(`Nenhuma credencial encontrada para ${provider}.`));
            console.log(chalk.gray('Use "pagia auth login" para adicionar credenciais primeiro.'));
            return;
        }
        await globalConfig.set('ai.defaultProvider', provider);
        const info = PROVIDERS.find(p => p.value === provider);
        logger.success(`${info?.name || provider} definido como provedor padrão.`);
    }
    catch (error) {
        logger.error(`Falha ao definir provedor: ${error.message}`);
        process.exitCode = 1;
    }
});
// Whoami command
authCommand
    .command('whoami')
    .description('Mostrar informações do usuário atual')
    .action(async () => {
    const globalConfig = getGlobalConfig();
    await globalConfig.initialize();
    const settings = globalConfig.getSettings();
    const credentials = getCredentialsManager();
    console.log('');
    console.log(chalk.bold('  👤 Informações do Usuário'));
    console.log(chalk.gray('  ─'.repeat(30)));
    console.log('');
    console.log(`  ${chalk.gray('Nome:')}         ${settings.user.name}`);
    if (settings.user.email) {
        console.log(`  ${chalk.gray('Email:')}        ${settings.user.email}`);
    }
    console.log(`  ${chalk.gray('Idioma:')}       ${settings.editor.language}`);
    console.log(`  ${chalk.gray('Provedor IA:')}  ${settings.ai.defaultProvider}`);
    console.log(`  ${chalk.gray('Modelo:')}       ${settings.ai.defaultModel}`);
    const storedProviders = await credentials.listProviders();
    console.log(`  ${chalk.gray('Credenciais:')}  ${storedProviders.length} provedor(es) configurado(s)`);
    console.log('');
    console.log(`  ${chalk.gray('Config Dir:')}   ${globalConfig.getConfigDir()}`);
    console.log('');
});
//# sourceMappingURL=auth.js.map
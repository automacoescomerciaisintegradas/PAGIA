/**
 * PAGIA - Chat Command
 * Estilo Claude Code - limpo e profissional
 *
 * @author Automações Comerciais Integradas
 */
import { Command } from 'commander';
import * as readline from 'readline';
import chalk from 'chalk';
import { MultiProvider } from '../providers/multi-provider.js';
import { getCLIConfig } from '../core/cli-config.js';
// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let provider;
let history = [];
let startTime;
// ═══════════════════════════════════════════════════════════════
// UI - Claude Code Style
// ═══════════════════════════════════════════════════════════════
function clearLine() {
    process.stdout.write('\r\x1b[K');
}
function printWelcome() {
    // Interface minimalista - apenas informação essencial
    console.log('');
    console.log(chalk.cyan.bold('  PAGIA') + chalk.gray(' - Framework CLI de agentes de IA'));
    console.log(chalk.gray(`  Provider: ${chalk.green(provider.name)} | Diretório: ${process.cwd()}`));
    console.log(chalk.gray('  Use /help para comandos. Ctrl+C para sair.'));
    console.log('');
}
function printResponse(content) {
    console.log('');
    console.log(chalk.green.bold('✦ PAGIA'));
    console.log('');
    for (const line of content.split('\n')) {
        console.log('  ' + line);
    }
    console.log('');
}
function printError(msg) {
    console.log('');
    console.log(chalk.red('Erro: ') + msg);
    console.log('');
}
function printInfo(msg) {
    console.log(chalk.blue('ℹ ') + msg);
}
function printSuccess(msg) {
    console.log(chalk.green('✓ ') + msg);
}
function printGoodbye() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    console.log('');
    console.log(chalk.cyan('─'.repeat(50)));
    console.log(chalk.bold(' Até logo!'));
    console.log(chalk.gray(` Mensagens: ${history.filter(h => h.role === 'assistant').length} | Duração: ${mins}m ${secs}s`));
    console.log(chalk.cyan('─'.repeat(50)));
    console.log('');
}
// ═══════════════════════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════════════════════
function handleCommand(input) {
    const [cmd, ...args] = input.split(' ');
    switch (cmd.toLowerCase()) {
        case '/help':
        case '/h':
            console.log('');
            console.log(chalk.bold(' Comandos:'));
            console.log('');
            console.log('  /help, /h         Mostra esta ajuda');
            console.log('  /providers        Lista providers');
            console.log('  /switch <nome>    Troca provider');
            console.log('  /model <nome>     Define modelo');
            console.log('  /config           Mostra configuração');
            console.log('  /clear            Limpa conversa');
            console.log('  /exit, /quit      Sair');
            console.log('');
            return true;
        case '/providers':
        case '/p':
            console.log('');
            console.log(chalk.bold(' Providers:'));
            console.log('');
            for (const p of MultiProvider.listAvailableProviders()) {
                const icon = p.configured ? chalk.green('●') : chalk.red('○');
                const curr = p.name === provider.name ? chalk.yellow(' ← atual') : '';
                console.log(`  ${icon} ${p.name.padEnd(12)} ${chalk.gray(p.model)}${curr}`);
            }
            console.log('');
            return true;
        case '/switch':
        case '/s':
            if (!args[0]) {
                printError('Uso: /switch <provider>');
                return true;
            }
            try {
                provider = new MultiProvider(args[0]);
                printSuccess(`Provider: ${provider.name}`);
            }
            catch (e) {
                printError(e.message);
            }
            return true;
        case '/model':
        case '/m':
            if (!args[0]) {
                printInfo(`Modelo: ${process.env[`${provider.name.toUpperCase()}_MODEL`] || 'padrão'}`);
            }
            else {
                process.env[`${provider.name.toUpperCase()}_MODEL`] = args[0];
                printSuccess(`Modelo: ${args[0]}`);
            }
            return true;
        case '/clear':
        case '/c':
            history = [];
            console.clear();
            printWelcome();
            printSuccess('Conversa limpa');
            return true;
        case '/config':
            const cfg = getCLIConfig();
            const profile = cfg.getActiveProfile();
            console.log('');
            console.log(chalk.bold(' Configuração (.pagia/config.yml):'));
            console.log('');
            console.log(`  Provider padrão:   ${chalk.green(cfg.getDefaultProvider())}`);
            console.log(`  Fallback:          ${cfg.get('ai_provider.fallback') || 'nenhum'}`);
            console.log(`  Profile ativo:     ${chalk.yellow(cfg.get('profile') || 'default')}`);
            console.log(`  Agentes:           ${cfg.getEnabledAgents().join(', ')}`);
            console.log(`  Modo execução:     ${cfg.getExecutionMode()}`);
            console.log(`  MCP habilitado:    ${cfg.isEnabled('mcp') ? 'sim' : 'não'}`);
            console.log(`  TDD habilitado:    ${cfg.isEnabled('tdd') ? 'sim' : 'não'}`);
            console.log(`  LLM Gateway:       ${cfg.isEnabled('llm_gateway') ? 'sim' : 'não'}`);
            console.log('');
            return true;
        case '/exit':
        case '/quit':
        case '/q':
            printGoodbye();
            process.exit(0);
        default:
            return false;
    }
}
// ═══════════════════════════════════════════════════════════════
// AI
// ═══════════════════════════════════════════════════════════════
async function ask(question) {
    history.push({ role: 'user', content: question });
    let prompt = question;
    if (history.length > 2) {
        prompt = history.slice(-8).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
    }
    const result = await provider.ask(prompt, {
        systemPrompt: 'Você é o PAGIA, assistente de IA para desenvolvimento de software. Responda em português brasileiro de forma clara e útil.',
        temperature: 0.7,
        maxTokens: 4096,
    });
    history.push({ role: 'assistant', content: result });
    return result;
}
// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function run(providerName) {
    startTime = Date.now();
    // Load config from .pagia/config.yml
    const config = getCLIConfig();
    const defaultProvider = config.getDefaultProvider();
    const interfaceConfig = config.getInterfaceConfig();
    try {
        // Use provider from args, or from config.yml
        provider = new MultiProvider((providerName || defaultProvider));
    }
    catch (e) {
        console.error(chalk.red('\n' + e.message));
        console.log('\nProviders disponíveis:');
        MultiProvider.listAvailableProviders().forEach(p => {
            console.log(`  ${p.configured ? '●' : '○'} ${p.name}`);
        });
        process.exit(1);
    }
    // Não limpar a tela - manter o banner do index.ts visível
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });
    // Handle process interruption
    rl.on('SIGINT', () => {
        rl.close();
    });
    const promptUser = () => {
        // Display input box with hint
        console.log('');
        console.log(chalk.cyan('╭──────────────────────────────────────────────────────────────────────────────────╮'));
        process.stdout.write(chalk.cyan('│ ') + chalk.cyan.bold('> ') + chalk.gray('Digite sua mensagem ou @caminho/do/arquivo') + ' '.repeat(30) + '\r' + chalk.cyan('│ ') + chalk.cyan.bold('> '));
        rl.question('', async (input) => {
            console.log(chalk.cyan('╰──────────────────────────────────────────────────────────────────────────────────╯'));
            const q = input.trim();
            if (!q) {
                promptUser();
                return;
            }
            if (q.startsWith('/')) {
                if (!handleCommand(q)) {
                    printError(`Comando desconhecido: ${q.split(' ')[0]}`);
                }
                promptUser();
                return;
            }
            // Spinner
            const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            let i = 0;
            const spinner = setInterval(() => {
                process.stdout.write(`\r${chalk.gray(frames[i++ % 10] + ' Pensando...')}`);
            }, 100);
            try {
                const answer = await ask(q);
                clearInterval(spinner);
                process.stdout.write('\r                    \r'); // Clean spinner line
                printResponse(answer);
            }
            catch (e) {
                clearInterval(spinner);
                process.stdout.write('\r                    \r'); // Clean spinner line
                printError(e.message);
            }
            promptUser();
        });
    };
    rl.on('close', () => {
        printGoodbye();
        process.exit(0);
    });
    promptUser();
}
// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════
export const chatCommand = new Command('chat')
    .description('Conversar com o PAGIA')
    .option('-p, --provider <nome>', 'Provider de IA')
    .action(async (opts) => {
    await run(opts.provider);
});
export async function startDefaultREPL() {
    await run();
}
//# sourceMappingURL=chat.js.map
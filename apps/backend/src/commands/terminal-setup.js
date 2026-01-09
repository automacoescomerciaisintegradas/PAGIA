/**
 * PAGIA - Terminal Setup Command
 * Comando para configuração de terminais modernos
 *
 * Suporta: Kitty, Alacritty, Ghostty, Warp, Zed, Windows Terminal, iTerm2, Hyper
 *
 * @author Automações Comerciais Integradas
 */
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { terminalService } from '../services/terminal-service.js';
export const terminalCommand = new Command('terminal-setup')
    .description('Configurar terminal para uso com PAGIA')
    .option('-d, --detect', 'Apenas detectar terminal atual')
    .option('-l, --list', 'Listar terminais suportados')
    .option('--keybindings', 'Aplicar keybindings PAGIA')
    .option('--theme', 'Aplicar tema PAGIA Premium')
    .option('--all', 'Aplicar todas as configurações')
    .argument('[terminal]', 'Terminal específico para configurar')
    .action(async (terminal, options) => {
    console.log(chalk.cyan.bold('\n🖥️  PAGIA Terminal Setup\n'));
    // Listar terminais suportados
    if (options.list) {
        await listSupportedTerminals();
        return;
    }
    // Detectar terminal atual
    if (options.detect) {
        await detectCurrentTerminal();
        return;
    }
    // Se nenhum terminal especificado, executar modo interativo
    if (!terminal) {
        await interactiveSetup(options);
        return;
    }
    // Configurar terminal específico
    await configureTerminal(terminal, options);
});
/**
 * Lista todos os terminais suportados
 */
async function listSupportedTerminals() {
    const supported = terminalService.listSupported();
    const detected = await terminalService.detectAll();
    console.log(chalk.white.bold('Terminais Suportados:\n'));
    const terminalIcons = {
        'kitty': '🐱',
        'alacritty': '⚡',
        'ghostty': '👻',
        'warp': '🚀',
        'zed': '⚡',
        'windows-terminal': '🪟',
        'iterm2': '🍎',
        'hyper': '💫',
        'vscode': '💻',
    };
    for (const info of detected) {
        const icon = terminalIcons[info.name.toLowerCase()] || '📦';
        const status = info.detected
            ? chalk.green('✓ Detectado')
            : chalk.gray('○ Não encontrado');
        const version = info.version ? chalk.gray(` v${info.version}`) : '';
        console.log(`  ${icon} ${chalk.cyan.bold(info.name)}${version}`);
        console.log(`     ${status}`);
        if (info.detected && info.configPath) {
            console.log(`     ${chalk.gray('Config:')} ${info.configPath}`);
        }
        if (info.features.length > 0) {
            console.log(`     ${chalk.gray('Features:')} ${info.features.slice(0, 3).join(', ')}...`);
        }
        console.log('');
    }
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('\nUso:'));
    console.log(`  ${chalk.cyan('pagia terminal-setup')} ${chalk.gray('............')} Modo interativo`);
    console.log(`  ${chalk.cyan('pagia terminal-setup kitty')} ${chalk.gray('.....')} Configurar Kitty`);
    console.log(`  ${chalk.cyan('pagia terminal-setup --theme')} ${chalk.gray('...')} Aplicar tema PAGIA`);
    console.log(`  ${chalk.cyan('pagia terminal-setup --detect')} ${chalk.gray('..')} Detectar terminal atual`);
}
/**
 * Detecta o terminal atual
 */
async function detectCurrentTerminal() {
    console.log(chalk.white('🔍 Detectando terminal atual...\n'));
    const current = await terminalService.detectCurrent();
    if (current) {
        console.log(chalk.green.bold(`✓ Terminal detectado: ${current.name}`));
        if (current.version) {
            console.log(`  ${chalk.gray('Versão:')} ${current.version}`);
        }
        if (current.configPath) {
            console.log(`  ${chalk.gray('Config:')} ${current.configPath}`);
        }
        console.log(`\n${chalk.gray('Features:')}`);
        current.features.forEach(f => console.log(`  • ${f}`));
        console.log(chalk.gray('\n─'.repeat(50)));
        console.log(`\nPara configurar: ${chalk.cyan(`pagia terminal-setup ${current.name.toLowerCase().replace(' ', '-')}`)}`);
    }
    else {
        console.log(chalk.yellow('⚠️  Não foi possível detectar o terminal automaticamente.'));
        console.log(chalk.gray('\nVariáveis de ambiente verificadas:'));
        console.log(`  TERM_PROGRAM: ${process.env.TERM_PROGRAM || chalk.gray('não definido')}`);
        console.log(`  WT_SESSION: ${process.env.WT_SESSION ? chalk.green('sim') : chalk.gray('não')}`);
        console.log(`  KITTY_WINDOW_ID: ${process.env.KITTY_WINDOW_ID || chalk.gray('não definido')}`);
        console.log(`  ALACRITTY_SOCKET: ${process.env.ALACRITTY_SOCKET || chalk.gray('não definido')}`);
        console.log(chalk.gray('\n─'.repeat(50)));
        console.log(`\nUse ${chalk.cyan('pagia terminal-setup --list')} para ver terminais suportados.`);
    }
}
/**
 * Modo interativo de configuração
 */
async function interactiveSetup(options) {
    // Primeiro, tentar detectar o terminal atual
    const current = await terminalService.detectCurrent();
    const detected = await terminalService.detectAll();
    const installedTerminals = detected.filter(t => t.detected);
    if (installedTerminals.length === 0) {
        console.log(chalk.yellow('⚠️  Nenhum terminal suportado detectado.'));
        console.log(chalk.gray('\nTerminais suportados: Kitty, Alacritty, Ghostty, Warp, Zed, Windows Terminal, iTerm2, Hyper'));
        return;
    }
    const terminalChoices = installedTerminals.map(t => ({
        name: `${t.name}${current?.name === t.name ? chalk.green(' (atual)') : ''}${t.version ? chalk.gray(` v${t.version}`) : ''}`,
        value: t.name.toLowerCase().replace(' ', '-'),
    }));
    // Perguntar qual terminal configurar
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'terminal',
            message: 'Qual terminal você deseja configurar?',
            choices: terminalChoices,
            default: current?.name.toLowerCase().replace(' ', '-'),
        },
        {
            type: 'checkbox',
            name: 'configs',
            message: 'O que você deseja configurar?',
            choices: [
                { name: '🎨 Tema PAGIA Premium (cores)', value: 'theme', checked: true },
                { name: '⌨️  Keybindings (atalhos de teclado)', value: 'keybindings', checked: true },
                { name: '🔤 Fonte (JetBrains Mono com ligatures)', value: 'font', checked: false },
            ],
        },
        {
            type: 'confirm',
            name: 'proceed',
            message: 'Aplicar configurações?',
            default: true,
        },
    ]);
    if (!answers.proceed) {
        console.log(chalk.yellow('\n⚠️  Configuração cancelada.'));
        return;
    }
    // Aplicar configurações
    const configOptions = {};
    if (answers.configs.includes('theme')) {
        configOptions.theme = terminalService.getDefaultTheme();
    }
    if (answers.configs.includes('keybindings')) {
        configOptions.keybindings = terminalService.getDefaultKeybindings();
    }
    if (answers.configs.includes('font')) {
        configOptions.font = {
            family: 'JetBrains Mono',
            size: 14,
            ligatures: true,
        };
    }
    console.log(chalk.cyan('\n⏳ Aplicando configurações...\n'));
    const result = await terminalService.configure(answers.terminal, configOptions);
    if (result.success) {
        console.log(chalk.green.bold('✅ Configuração aplicada com sucesso!\n'));
        console.log(result.message);
        if (result.configPath) {
            console.log(chalk.gray(`\nArquivo criado: ${result.configPath}`));
        }
        // Mostrar preview do tema
        if (answers.configs.includes('theme')) {
            console.log(chalk.gray('\n─'.repeat(50)));
            showThemePreview();
        }
    }
    else {
        console.log(chalk.red.bold('❌ Erro ao aplicar configuração'));
        console.log(chalk.red(result.message));
    }
}
/**
 * Configura um terminal específico
 */
async function configureTerminal(terminal, options) {
    const configOptions = {};
    // Se --all, aplicar tudo
    if (options.all) {
        configOptions.theme = terminalService.getDefaultTheme();
        configOptions.keybindings = terminalService.getDefaultKeybindings();
        configOptions.font = {
            family: 'JetBrains Mono',
            size: 14,
            ligatures: true,
        };
    }
    else {
        // Opções específicas
        if (options.theme) {
            configOptions.theme = terminalService.getDefaultTheme();
        }
        if (options.keybindings) {
            configOptions.keybindings = terminalService.getDefaultKeybindings();
        }
    }
    // Se nenhuma opção específica, aplicar tema e keybindings por padrão
    if (Object.keys(configOptions).length === 0) {
        configOptions.theme = terminalService.getDefaultTheme();
        configOptions.keybindings = terminalService.getDefaultKeybindings();
    }
    console.log(chalk.cyan(`⏳ Configurando ${terminal}...\n`));
    const result = await terminalService.configure(terminal, configOptions);
    if (result.success) {
        console.log(chalk.green.bold('✅ Configuração aplicada com sucesso!\n'));
        console.log(result.message);
        if (result.configPath) {
            console.log(chalk.gray(`\nArquivo criado: ${result.configPath}`));
        }
        // Mostrar preview do tema
        if (configOptions.theme) {
            console.log(chalk.gray('\n─'.repeat(50)));
            showThemePreview();
        }
    }
    else {
        console.log(chalk.red.bold('❌ Erro ao aplicar configuração'));
        console.log(chalk.red(result.message));
    }
}
/**
 * Mostra preview do tema
 */
function showThemePreview() {
    const theme = terminalService.getDefaultTheme();
    console.log(chalk.white.bold('\n🎨 Preview do Tema PAGIA Premium:\n'));
    // Cores normais
    console.log('  ' +
        chalk.hex(theme.colors.black).bgHex(theme.colors.black)('  ') + ' ' +
        chalk.hex(theme.colors.red).bgHex(theme.colors.red)('  ') + ' ' +
        chalk.hex(theme.colors.green).bgHex(theme.colors.green)('  ') + ' ' +
        chalk.hex(theme.colors.yellow).bgHex(theme.colors.yellow)('  ') + ' ' +
        chalk.hex(theme.colors.blue).bgHex(theme.colors.blue)('  ') + ' ' +
        chalk.hex(theme.colors.magenta).bgHex(theme.colors.magenta)('  ') + ' ' +
        chalk.hex(theme.colors.cyan).bgHex(theme.colors.cyan)('  ') + ' ' +
        chalk.hex(theme.colors.white).bgHex(theme.colors.white)('  ') +
        chalk.gray('  Normal'));
    // Cores brilhantes
    console.log('  ' +
        chalk.hex(theme.colors.brightBlack).bgHex(theme.colors.brightBlack)('  ') + ' ' +
        chalk.hex(theme.colors.brightRed).bgHex(theme.colors.brightRed)('  ') + ' ' +
        chalk.hex(theme.colors.brightGreen).bgHex(theme.colors.brightGreen)('  ') + ' ' +
        chalk.hex(theme.colors.brightYellow).bgHex(theme.colors.brightYellow)('  ') + ' ' +
        chalk.hex(theme.colors.brightBlue).bgHex(theme.colors.brightBlue)('  ') + ' ' +
        chalk.hex(theme.colors.brightMagenta).bgHex(theme.colors.brightMagenta)('  ') + ' ' +
        chalk.hex(theme.colors.brightCyan).bgHex(theme.colors.brightCyan)('  ') + ' ' +
        chalk.hex(theme.colors.brightWhite).bgHex(theme.colors.brightWhite)('  ') +
        chalk.gray('  Bright'));
    console.log(chalk.gray('\n  Background: ') + chalk.hex(theme.background)(theme.background));
    console.log(chalk.gray('  Foreground: ') + chalk.hex(theme.foreground)(theme.foreground));
    console.log(chalk.gray('  Cursor:     ') + chalk.hex(theme.cursor)(theme.cursor));
}
// Alias para o comando
export const terminalSetupCommand = terminalCommand;
//# sourceMappingURL=terminal-setup.js.map
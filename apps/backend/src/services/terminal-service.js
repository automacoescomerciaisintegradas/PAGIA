/**
 * PAGIA - Terminal Configuration Service
 * Serviço para detecção e configuração de terminais modernos
 *
 * Terminais suportados:
 * - Kitty
 * - Alacritty
 * - Ghostty
 * - Warp
 * - Zed (terminal embutido)
 * - Windows Terminal
 * - iTerm2
 * - Hyper
 *
 * @author Automações Comerciais Integradas
 */
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { homedir, platform } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
// Tema PAGIA Premium
const PAGIA_THEME = {
    name: 'PAGIA Premium',
    background: '#0d1117',
    foreground: '#c9d1d9',
    cursor: '#58a6ff',
    selection: '#264f78',
    colors: {
        black: '#0d1117',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#c9d1d9',
        brightBlack: '#484f58',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#f0f6fc',
    },
};
// Keybindings padrão para PAGIA
const PAGIA_KEYBINDINGS = [
    { key: 'shift+enter', action: 'send_text', description: 'Nova linha sem executar' },
    { key: 'ctrl+shift+c', action: 'copy', description: 'Copiar seleção' },
    { key: 'ctrl+shift+v', action: 'paste', description: 'Colar' },
    { key: 'ctrl+shift+t', action: 'new_tab', description: 'Nova aba' },
    { key: 'ctrl+shift+w', action: 'close_tab', description: 'Fechar aba' },
    { key: 'ctrl+tab', action: 'next_tab', description: 'Próxima aba' },
    { key: 'ctrl+shift+tab', action: 'prev_tab', description: 'Aba anterior' },
    { key: 'ctrl+plus', action: 'increase_font', description: 'Aumentar fonte' },
    { key: 'ctrl+minus', action: 'decrease_font', description: 'Diminuir fonte' },
    { key: 'ctrl+0', action: 'reset_font', description: 'Resetar fonte' },
];
export class TerminalService {
    homeDir;
    os;
    supportedTerminals;
    constructor() {
        this.homeDir = homedir();
        this.os = platform();
        this.supportedTerminals = new Map([
            ['kitty', this.detectKitty.bind(this)],
            ['alacritty', this.detectAlacritty.bind(this)],
            ['ghostty', this.detectGhostty.bind(this)],
            ['warp', this.detectWarp.bind(this)],
            ['zed', this.detectZed.bind(this)],
            ['windows-terminal', this.detectWindowsTerminal.bind(this)],
            ['iterm2', this.detectITerm2.bind(this)],
            ['hyper', this.detectHyper.bind(this)],
            ['vscode', this.detectVSCode.bind(this)],
        ]);
    }
    /**
     * Lista todos os terminais suportados
     */
    listSupported() {
        return Array.from(this.supportedTerminals.keys());
    }
    /**
     * Detecta todos os terminais instalados
     */
    async detectAll() {
        const results = [];
        for (const [name, detector] of this.supportedTerminals) {
            try {
                const info = await detector();
                results.push(info);
            }
            catch (error) {
                results.push({
                    name,
                    detected: false,
                    features: [],
                });
            }
        }
        return results;
    }
    /**
     * Detecta o terminal atual
     */
    async detectCurrent() {
        // Verificar variáveis de ambiente
        const termProgram = process.env.TERM_PROGRAM || '';
        const termEmulator = process.env.TERMINAL_EMULATOR || '';
        const wtSession = process.env.WT_SESSION; // Windows Terminal
        const kittyWindow = process.env.KITTY_WINDOW_ID;
        const alacrittySocket = process.env.ALACRITTY_SOCKET;
        const ghosttyResources = process.env.GHOSTTY_RESOURCES_DIR;
        const warpSession = process.env.WARP_SESSION_ID;
        const zedTerm = process.env.ZED_TERM;
        if (kittyWindow) {
            return this.detectKitty();
        }
        if (alacrittySocket) {
            return this.detectAlacritty();
        }
        if (ghosttyResources) {
            return this.detectGhostty();
        }
        if (warpSession) {
            return this.detectWarp();
        }
        if (zedTerm) {
            return this.detectZed();
        }
        if (wtSession) {
            return this.detectWindowsTerminal();
        }
        if (termProgram === 'iTerm.app') {
            return this.detectITerm2();
        }
        if (termProgram === 'Hyper') {
            return this.detectHyper();
        }
        // VSCode integrated terminal
        if (termProgram === 'vscode' || process.env.VSCODE_INJECTION || process.env.VSCODE_GIT_IPC_HANDLE) {
            return this.detectVSCode();
        }
        return null;
    }
    /**
     * Configura um terminal específico
     */
    async configure(terminal, config) {
        const configFunctions = {
            'kitty': this.configureKitty.bind(this),
            'alacritty': this.configureAlacritty.bind(this),
            'ghostty': this.configureGhostty.bind(this),
            'warp': this.configureWarp.bind(this),
            'zed': this.configureZed.bind(this),
            'windows-terminal': this.configureWindowsTerminal.bind(this),
            'iterm2': this.configureITerm2.bind(this),
            'hyper': this.configureHyper.bind(this),
            'vscode': this.configureVSCode.bind(this),
        };
        // Normalizar nome do terminal
        const normalizedTerminal = this.normalizeTerminalName(terminal);
        const configFunc = configFunctions[normalizedTerminal];
        if (!configFunc) {
            const supportedList = Object.keys(configFunctions).join(', ');
            return { success: false, message: `Terminal '${terminal}' não suportado. Use: ${supportedList}` };
        }
        return configFunc(config);
    }
    /**
     * Normaliza nome do terminal para formato padrão
     */
    normalizeTerminalName(name) {
        const normalized = name.toLowerCase().trim();
        // Mapeamento de aliases
        const aliases = {
            'windowsterminal': 'windows-terminal',
            'wt': 'windows-terminal',
            'win-terminal': 'windows-terminal',
            'iterm': 'iterm2',
            'vs-code': 'vscode',
            'code': 'vscode',
        };
        return aliases[normalized] || normalized;
    }
    /**
     * Aplica keybindings para um terminal
     */
    async applyKeybindings(terminal, keybindings) {
        const bindings = keybindings || PAGIA_KEYBINDINGS;
        return this.configure(terminal, { keybindings: bindings });
    }
    /**
     * Aplica tema PAGIA para um terminal
     */
    async applyTheme(terminal, theme) {
        const themeConfig = theme || PAGIA_THEME;
        return this.configure(terminal, { theme: themeConfig });
    }
    /**
     * Obtém o tema PAGIA padrão
     */
    getDefaultTheme() {
        return PAGIA_THEME;
    }
    /**
     * Obtém os keybindings padrão
     */
    getDefaultKeybindings() {
        return PAGIA_KEYBINDINGS;
    }
    // ================== Detectores de Terminal ==================
    async detectKitty() {
        const configPath = this.os === 'win32'
            ? join(this.homeDir, '.config', 'kitty', 'kitty.conf')
            : join(this.homeDir, '.config', 'kitty', 'kitty.conf');
        let version;
        try {
            const { stdout } = await execAsync('kitty --version');
            version = stdout.trim().split(' ')[1];
        }
        catch { /* não instalado */ }
        const detected = !!process.env.KITTY_WINDOW_ID || version !== undefined;
        return {
            name: 'Kitty',
            detected,
            version,
            configPath: detected ? configPath : undefined,
            features: ['GPU acceleration', 'Ligatures', 'Tabs', 'Splits', 'Unicode', 'Images'],
        };
    }
    async detectAlacritty() {
        let configPath;
        if (this.os === 'win32') {
            configPath = join(this.homeDir, 'AppData', 'Roaming', 'alacritty', 'alacritty.toml');
        }
        else if (this.os === 'darwin') {
            configPath = join(this.homeDir, '.config', 'alacritty', 'alacritty.toml');
        }
        else {
            configPath = join(this.homeDir, '.config', 'alacritty', 'alacritty.toml');
        }
        let version;
        try {
            const { stdout } = await execAsync('alacritty --version');
            version = stdout.trim().split(' ')[1];
        }
        catch { /* não instalado */ }
        const detected = !!process.env.ALACRITTY_SOCKET || version !== undefined;
        return {
            name: 'Alacritty',
            detected,
            version,
            configPath: detected ? configPath : undefined,
            features: ['GPU acceleration', 'Minimal', 'Vi mode', 'Scrollback search', 'TOML config'],
        };
    }
    async detectGhostty() {
        let configPath;
        if (this.os === 'darwin') {
            configPath = join(this.homeDir, 'Library', 'Application Support', 'com.mitchellh.ghostty', 'config');
        }
        else {
            configPath = join(this.homeDir, '.config', 'ghostty', 'config');
        }
        let version;
        try {
            const { stdout } = await execAsync('ghostty --version');
            version = stdout.trim();
        }
        catch { /* não instalado */ }
        const detected = !!process.env.GHOSTTY_RESOURCES_DIR || version !== undefined;
        return {
            name: 'Ghostty',
            detected,
            version,
            configPath: detected ? configPath : undefined,
            features: ['GPU acceleration', 'Native macOS', 'Zig-based', 'Fast', 'Modern'],
        };
    }
    async detectWarp() {
        const configPath = this.os === 'darwin'
            ? join(this.homeDir, '.warp', 'themes')
            : join(this.homeDir, '.warp', 'themes');
        const detected = !!process.env.WARP_SESSION_ID;
        return {
            name: 'Warp',
            detected,
            configPath: detected ? configPath : undefined,
            features: ['AI-powered', 'Blocks', 'Workflows', 'Modern UI', 'Collaboration'],
        };
    }
    async detectZed() {
        const configPath = this.os === 'darwin'
            ? join(this.homeDir, '.config', 'zed', 'settings.json')
            : join(this.homeDir, '.config', 'zed', 'settings.json');
        const detected = !!process.env.ZED_TERM;
        return {
            name: 'Zed',
            detected,
            configPath: detected ? configPath : undefined,
            features: ['Editor-integrated', 'Fast', 'Collaborative', 'GPU-rendered'],
        };
    }
    async detectWindowsTerminal() {
        const configPath = join(this.homeDir, 'AppData', 'Local', 'Packages', 'Microsoft.WindowsTerminal_8wekyb3d8bbwe', 'LocalState', 'settings.json');
        const detected = !!process.env.WT_SESSION;
        let exists = false;
        try {
            await fs.access(configPath);
            exists = true;
        }
        catch { /* arquivo não existe */ }
        return {
            name: 'Windows Terminal',
            detected: detected || exists,
            configPath: (detected || exists) ? configPath : undefined,
            features: ['Tabs', 'Panes', 'Profiles', 'GPU acceleration', 'Customizable'],
        };
    }
    async detectITerm2() {
        const configPath = join(this.homeDir, 'Library', 'Preferences', 'com.googlecode.iterm2.plist');
        const detected = process.env.TERM_PROGRAM === 'iTerm.app';
        return {
            name: 'iTerm2',
            detected,
            configPath: detected ? configPath : undefined,
            features: ['Profiles', 'Triggers', 'tmux integration', 'Shell integration', 'Hotkey window'],
        };
    }
    async detectHyper() {
        const configPath = join(this.homeDir, '.hyper.js');
        const detected = process.env.TERM_PROGRAM === 'Hyper';
        return {
            name: 'Hyper',
            detected,
            configPath: detected ? configPath : undefined,
            features: ['Electron-based', 'Plugins', 'Themes', 'Cross-platform'],
        };
    }
    async detectVSCode() {
        let configPath;
        if (this.os === 'win32') {
            configPath = join(this.homeDir, 'AppData', 'Roaming', 'Code', 'User', 'settings.json');
        }
        else if (this.os === 'darwin') {
            configPath = join(this.homeDir, 'Library', 'Application Support', 'Code', 'User', 'settings.json');
        }
        else {
            configPath = join(this.homeDir, '.config', 'Code', 'User', 'settings.json');
        }
        const detected = process.env.TERM_PROGRAM === 'vscode' ||
            !!process.env.VSCODE_INJECTION ||
            !!process.env.VSCODE_GIT_IPC_HANDLE;
        return {
            name: 'VSCode',
            detected,
            configPath: detected ? configPath : undefined,
            features: ['Integrated terminal', 'Multi-terminal', 'Split panes', 'Extensions', 'Customizable'],
        };
    }
    // ================== Configuradores de Terminal ==================
    async configureKitty(config) {
        const configPath = join(this.homeDir, '.config', 'kitty', 'pagia.conf');
        let content = `# PAGIA Terminal Configuration for Kitty\n`;
        content += `# Gerado automaticamente por PAGIA\n\n`;
        if (config.theme) {
            content += `# Tema PAGIA\n`;
            content += `background ${config.theme.background}\n`;
            content += `foreground ${config.theme.foreground}\n`;
            content += `cursor ${config.theme.cursor}\n`;
            content += `selection_background ${config.theme.selection}\n`;
            content += `\n# Cores\n`;
            content += `color0 ${config.theme.colors.black}\n`;
            content += `color1 ${config.theme.colors.red}\n`;
            content += `color2 ${config.theme.colors.green}\n`;
            content += `color3 ${config.theme.colors.yellow}\n`;
            content += `color4 ${config.theme.colors.blue}\n`;
            content += `color5 ${config.theme.colors.magenta}\n`;
            content += `color6 ${config.theme.colors.cyan}\n`;
            content += `color7 ${config.theme.colors.white}\n`;
            content += `color8 ${config.theme.colors.brightBlack}\n`;
            content += `color9 ${config.theme.colors.brightRed}\n`;
            content += `color10 ${config.theme.colors.brightGreen}\n`;
            content += `color11 ${config.theme.colors.brightYellow}\n`;
            content += `color12 ${config.theme.colors.brightBlue}\n`;
            content += `color13 ${config.theme.colors.brightMagenta}\n`;
            content += `color14 ${config.theme.colors.brightCyan}\n`;
            content += `color15 ${config.theme.colors.brightWhite}\n\n`;
        }
        if (config.keybindings) {
            content += `# Keybindings\n`;
            for (const kb of config.keybindings) {
                const kittyKey = this.convertKeyToKitty(kb.key);
                content += `map ${kittyKey} ${kb.action}  # ${kb.description}\n`;
            }
        }
        if (config.font) {
            content += `\n# Fonte\n`;
            content += `font_family ${config.font.family}\n`;
            content += `font_size ${config.font.size}\n`;
            if (config.font.ligatures) {
                content += `disable_ligatures never\n`;
            }
        }
        try {
            await fs.mkdir(dirname(configPath), { recursive: true });
            await fs.writeFile(configPath, content, 'utf-8');
            return {
                success: true,
                message: `✅ Configuração Kitty salva! Adicione 'include pagia.conf' ao seu kitty.conf`,
                configPath
            };
        }
        catch (error) {
            return { success: false, message: `Erro ao salvar: ${error}` };
        }
    }
    async configureAlacritty(config) {
        let configPath;
        if (this.os === 'win32') {
            configPath = join(this.homeDir, 'AppData', 'Roaming', 'alacritty', 'pagia.toml');
        }
        else {
            configPath = join(this.homeDir, '.config', 'alacritty', 'pagia.toml');
        }
        let content = `# PAGIA Terminal Configuration for Alacritty\n`;
        content += `# Gerado automaticamente por PAGIA\n\n`;
        if (config.theme) {
            content += `[colors.primary]\n`;
            content += `background = "${config.theme.background}"\n`;
            content += `foreground = "${config.theme.foreground}"\n\n`;
            content += `[colors.cursor]\n`;
            content += `cursor = "${config.theme.cursor}"\n\n`;
            content += `[colors.selection]\n`;
            content += `background = "${config.theme.selection}"\n\n`;
            content += `[colors.normal]\n`;
            content += `black = "${config.theme.colors.black}"\n`;
            content += `red = "${config.theme.colors.red}"\n`;
            content += `green = "${config.theme.colors.green}"\n`;
            content += `yellow = "${config.theme.colors.yellow}"\n`;
            content += `blue = "${config.theme.colors.blue}"\n`;
            content += `magenta = "${config.theme.colors.magenta}"\n`;
            content += `cyan = "${config.theme.colors.cyan}"\n`;
            content += `white = "${config.theme.colors.white}"\n\n`;
            content += `[colors.bright]\n`;
            content += `black = "${config.theme.colors.brightBlack}"\n`;
            content += `red = "${config.theme.colors.brightRed}"\n`;
            content += `green = "${config.theme.colors.brightGreen}"\n`;
            content += `yellow = "${config.theme.colors.brightYellow}"\n`;
            content += `blue = "${config.theme.colors.brightBlue}"\n`;
            content += `magenta = "${config.theme.colors.brightMagenta}"\n`;
            content += `cyan = "${config.theme.colors.brightCyan}"\n`;
            content += `white = "${config.theme.colors.brightWhite}"\n\n`;
        }
        if (config.font) {
            content += `[font]\n`;
            content += `size = ${config.font.size}\n\n`;
            content += `[font.normal]\n`;
            content += `family = "${config.font.family}"\n`;
        }
        if (config.keybindings) {
            content += `\n[[keyboard.bindings]]\n`;
            for (const kb of config.keybindings) {
                const alacrittyKey = this.convertKeyToAlacritty(kb.key);
                content += `# ${kb.description}\n`;
                content += `key = "${alacrittyKey.key}"\n`;
                if (alacrittyKey.mods)
                    content += `mods = "${alacrittyKey.mods}"\n`;
                content += `action = "${kb.action}"\n\n`;
            }
        }
        try {
            await fs.mkdir(dirname(configPath), { recursive: true });
            await fs.writeFile(configPath, content, 'utf-8');
            return {
                success: true,
                message: `✅ Configuração Alacritty salva! Importe com 'import = ["~/.config/alacritty/pagia.toml"]'`,
                configPath
            };
        }
        catch (error) {
            return { success: false, message: `Erro ao salvar: ${error}` };
        }
    }
    async configureGhostty(config) {
        let configPath;
        if (this.os === 'darwin') {
            configPath = join(this.homeDir, 'Library', 'Application Support', 'com.mitchellh.ghostty', 'pagia-config');
        }
        else {
            configPath = join(this.homeDir, '.config', 'ghostty', 'pagia-config');
        }
        let content = `# PAGIA Terminal Configuration for Ghostty\n`;
        content += `# Gerado automaticamente por PAGIA\n\n`;
        if (config.theme) {
            content += `background = ${config.theme.background}\n`;
            content += `foreground = ${config.theme.foreground}\n`;
            content += `cursor-color = ${config.theme.cursor}\n`;
            content += `selection-background = ${config.theme.selection}\n\n`;
            content += `palette = 0=${config.theme.colors.black}\n`;
            content += `palette = 1=${config.theme.colors.red}\n`;
            content += `palette = 2=${config.theme.colors.green}\n`;
            content += `palette = 3=${config.theme.colors.yellow}\n`;
            content += `palette = 4=${config.theme.colors.blue}\n`;
            content += `palette = 5=${config.theme.colors.magenta}\n`;
            content += `palette = 6=${config.theme.colors.cyan}\n`;
            content += `palette = 7=${config.theme.colors.white}\n`;
            content += `palette = 8=${config.theme.colors.brightBlack}\n`;
            content += `palette = 9=${config.theme.colors.brightRed}\n`;
            content += `palette = 10=${config.theme.colors.brightGreen}\n`;
            content += `palette = 11=${config.theme.colors.brightYellow}\n`;
            content += `palette = 12=${config.theme.colors.brightBlue}\n`;
            content += `palette = 13=${config.theme.colors.brightMagenta}\n`;
            content += `palette = 14=${config.theme.colors.brightCyan}\n`;
            content += `palette = 15=${config.theme.colors.brightWhite}\n\n`;
        }
        if (config.font) {
            content += `font-family = ${config.font.family}\n`;
            content += `font-size = ${config.font.size}\n`;
        }
        if (config.keybindings) {
            content += `\n# Keybindings\n`;
            for (const kb of config.keybindings) {
                const ghosttyKey = this.convertKeyToGhostty(kb.key);
                content += `keybind = ${ghosttyKey}=${kb.action}  # ${kb.description}\n`;
            }
        }
        try {
            await fs.mkdir(dirname(configPath), { recursive: true });
            await fs.writeFile(configPath, content, 'utf-8');
            return {
                success: true,
                message: `✅ Configuração Ghostty salva! Adicione 'config-file = pagia-config' ao seu config`,
                configPath
            };
        }
        catch (error) {
            return { success: false, message: `Erro ao salvar: ${error}` };
        }
    }
    async configureWarp(config) {
        const themesDir = join(this.homeDir, '.warp', 'themes');
        const configPath = join(themesDir, 'pagia.yaml');
        let content = `# PAGIA Theme for Warp\n`;
        content += `# Gerado automaticamente por PAGIA\n\n`;
        if (config.theme) {
            content += `accent: "${config.theme.colors.blue}"\n`;
            content += `background: "${config.theme.background}"\n`;
            content += `foreground: "${config.theme.foreground}"\n`;
            content += `cursor: "${config.theme.cursor}"\n`;
            content += `terminal_colors:\n`;
            content += `  normal:\n`;
            content += `    black: "${config.theme.colors.black}"\n`;
            content += `    red: "${config.theme.colors.red}"\n`;
            content += `    green: "${config.theme.colors.green}"\n`;
            content += `    yellow: "${config.theme.colors.yellow}"\n`;
            content += `    blue: "${config.theme.colors.blue}"\n`;
            content += `    magenta: "${config.theme.colors.magenta}"\n`;
            content += `    cyan: "${config.theme.colors.cyan}"\n`;
            content += `    white: "${config.theme.colors.white}"\n`;
            content += `  bright:\n`;
            content += `    black: "${config.theme.colors.brightBlack}"\n`;
            content += `    red: "${config.theme.colors.brightRed}"\n`;
            content += `    green: "${config.theme.colors.brightGreen}"\n`;
            content += `    yellow: "${config.theme.colors.brightYellow}"\n`;
            content += `    blue: "${config.theme.colors.brightBlue}"\n`;
            content += `    magenta: "${config.theme.colors.brightMagenta}"\n`;
            content += `    cyan: "${config.theme.colors.brightCyan}"\n`;
            content += `    white: "${config.theme.colors.brightWhite}"\n`;
        }
        try {
            await fs.mkdir(themesDir, { recursive: true });
            await fs.writeFile(configPath, content, 'utf-8');
            return {
                success: true,
                message: `✅ Tema Warp salvo! Selecione 'PAGIA' em Settings > Appearance > Themes`,
                configPath
            };
        }
        catch (error) {
            return { success: false, message: `Erro ao salvar: ${error}` };
        }
    }
    async configureZed(config) {
        const configPath = join(this.homeDir, '.config', 'zed', 'themes', 'pagia.json');
        const theme = {
            name: 'PAGIA Premium',
            author: 'Automações Comerciais Integradas',
            themes: [{
                    name: 'PAGIA Premium',
                    appearance: 'dark',
                    style: {}
                }]
        };
        if (config.theme) {
            theme.themes[0].style = {
                background: config.theme.background,
                'editor.background': config.theme.background,
                'terminal.background': config.theme.background,
                'terminal.foreground': config.theme.foreground,
            };
        }
        try {
            await fs.mkdir(dirname(configPath), { recursive: true });
            await fs.writeFile(configPath, JSON.stringify(theme, null, 2), 'utf-8');
            return {
                success: true,
                message: `✅ Tema Zed salvo! Selecione 'PAGIA Premium' nas configurações do Zed`,
                configPath
            };
        }
        catch (error) {
            return { success: false, message: `Erro ao salvar: ${error}` };
        }
    }
    async configureWindowsTerminal(config) {
        const configDir = join(this.homeDir, 'AppData', 'Local', 'Packages', 'Microsoft.WindowsTerminal_8wekyb3d8bbwe', 'LocalState');
        const schemePath = join(configDir, 'pagia-scheme.json');
        const scheme = {
            name: 'PAGIA Premium',
        };
        if (config.theme) {
            Object.assign(scheme, {
                background: config.theme.background,
                foreground: config.theme.foreground,
                cursorColor: config.theme.cursor,
                selectionBackground: config.theme.selection,
                black: config.theme.colors.black,
                red: config.theme.colors.red,
                green: config.theme.colors.green,
                yellow: config.theme.colors.yellow,
                blue: config.theme.colors.blue,
                purple: config.theme.colors.magenta,
                cyan: config.theme.colors.cyan,
                white: config.theme.colors.white,
                brightBlack: config.theme.colors.brightBlack,
                brightRed: config.theme.colors.brightRed,
                brightGreen: config.theme.colors.brightGreen,
                brightYellow: config.theme.colors.brightYellow,
                brightBlue: config.theme.colors.brightBlue,
                brightPurple: config.theme.colors.brightMagenta,
                brightCyan: config.theme.colors.brightCyan,
                brightWhite: config.theme.colors.brightWhite,
            });
        }
        try {
            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(schemePath, JSON.stringify(scheme, null, 2), 'utf-8');
            let instructions = `✅ Esquema Windows Terminal salvo!\n`;
            instructions += `   Para usar, adicione ao seu settings.json:\n`;
            instructions += `   1. Copie o conteúdo de ${schemePath}\n`;
            instructions += `   2. Adicione em "schemes": [...]\n`;
            instructions += `   3. Defina "colorScheme": "PAGIA Premium" no perfil desejado`;
            return { success: true, message: instructions, configPath: schemePath };
        }
        catch (error) {
            return { success: false, message: `Erro ao salvar: ${error}` };
        }
    }
    async configureITerm2(config) {
        const configPath = join(this.homeDir, 'pagia.itermcolors');
        // iTerm2 usa formato XML plist para cores
        let content = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        content += `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n`;
        content += `<plist version="1.0">\n<dict>\n`;
        if (config.theme) {
            const colors = [
                { name: 'Ansi 0 Color', color: config.theme.colors.black },
                { name: 'Ansi 1 Color', color: config.theme.colors.red },
                { name: 'Ansi 2 Color', color: config.theme.colors.green },
                { name: 'Ansi 3 Color', color: config.theme.colors.yellow },
                { name: 'Ansi 4 Color', color: config.theme.colors.blue },
                { name: 'Ansi 5 Color', color: config.theme.colors.magenta },
                { name: 'Ansi 6 Color', color: config.theme.colors.cyan },
                { name: 'Ansi 7 Color', color: config.theme.colors.white },
                { name: 'Ansi 8 Color', color: config.theme.colors.brightBlack },
                { name: 'Ansi 9 Color', color: config.theme.colors.brightRed },
                { name: 'Ansi 10 Color', color: config.theme.colors.brightGreen },
                { name: 'Ansi 11 Color', color: config.theme.colors.brightYellow },
                { name: 'Ansi 12 Color', color: config.theme.colors.brightBlue },
                { name: 'Ansi 13 Color', color: config.theme.colors.brightMagenta },
                { name: 'Ansi 14 Color', color: config.theme.colors.brightCyan },
                { name: 'Ansi 15 Color', color: config.theme.colors.brightWhite },
                { name: 'Background Color', color: config.theme.background },
                { name: 'Foreground Color', color: config.theme.foreground },
                { name: 'Cursor Color', color: config.theme.cursor },
            ];
            for (const { name, color } of colors) {
                const rgb = this.hexToRgb(color);
                content += `\t<key>${name}</key>\n`;
                content += `\t<dict>\n`;
                content += `\t\t<key>Alpha Component</key>\n\t\t<real>1</real>\n`;
                content += `\t\t<key>Blue Component</key>\n\t\t<real>${rgb.b / 255}</real>\n`;
                content += `\t\t<key>Green Component</key>\n\t\t<real>${rgb.g / 255}</real>\n`;
                content += `\t\t<key>Red Component</key>\n\t\t<real>${rgb.r / 255}</real>\n`;
                content += `\t</dict>\n`;
            }
        }
        content += `</dict>\n</plist>\n`;
        try {
            await fs.writeFile(configPath, content, 'utf-8');
            return {
                success: true,
                message: `✅ Tema iTerm2 salvo em ${configPath}!\n   Importe via iTerm2 > Preferences > Profiles > Colors > Color Presets > Import`,
                configPath
            };
        }
        catch (error) {
            return { success: false, message: `Erro ao salvar: ${error}` };
        }
    }
    async configureHyper(config) {
        const configPath = join(this.homeDir, '.hyper-pagia.js');
        let content = `// PAGIA Theme for Hyper\n`;
        content += `// Gerado automaticamente por PAGIA\n`;
        content += `// Copie estas configurações para seu .hyper.js\n\n`;
        content += `module.exports = {\n`;
        content += `  config: {\n`;
        if (config.theme) {
            content += `    // Cores PAGIA\n`;
            content += `    backgroundColor: '${config.theme.background}',\n`;
            content += `    foregroundColor: '${config.theme.foreground}',\n`;
            content += `    cursorColor: '${config.theme.cursor}',\n`;
            content += `    selectionColor: '${config.theme.selection}',\n`;
            content += `    colors: {\n`;
            content += `      black: '${config.theme.colors.black}',\n`;
            content += `      red: '${config.theme.colors.red}',\n`;
            content += `      green: '${config.theme.colors.green}',\n`;
            content += `      yellow: '${config.theme.colors.yellow}',\n`;
            content += `      blue: '${config.theme.colors.blue}',\n`;
            content += `      magenta: '${config.theme.colors.magenta}',\n`;
            content += `      cyan: '${config.theme.colors.cyan}',\n`;
            content += `      white: '${config.theme.colors.white}',\n`;
            content += `      lightBlack: '${config.theme.colors.brightBlack}',\n`;
            content += `      lightRed: '${config.theme.colors.brightRed}',\n`;
            content += `      lightGreen: '${config.theme.colors.brightGreen}',\n`;
            content += `      lightYellow: '${config.theme.colors.brightYellow}',\n`;
            content += `      lightBlue: '${config.theme.colors.brightBlue}',\n`;
            content += `      lightMagenta: '${config.theme.colors.brightMagenta}',\n`;
            content += `      lightCyan: '${config.theme.colors.brightCyan}',\n`;
            content += `      lightWhite: '${config.theme.colors.brightWhite}',\n`;
            content += `    },\n`;
        }
        if (config.font) {
            content += `    fontFamily: '${config.font.family}',\n`;
            content += `    fontSize: ${config.font.size},\n`;
        }
        content += `  },\n`;
        content += `};\n`;
        try {
            await fs.writeFile(configPath, content, 'utf-8');
            return {
                success: true,
                message: `✅ Configuração Hyper salva em ${configPath}!\n   Copie as configurações para seu ~/.hyper.js`,
                configPath
            };
        }
        catch (error) {
            return { success: false, message: `Erro ao salvar: ${error}` };
        }
    }
    async configureVSCode(config) {
        let settingsPath;
        if (this.os === 'win32') {
            settingsPath = join(this.homeDir, 'AppData', 'Roaming', 'Code', 'User', 'settings.json');
        }
        else if (this.os === 'darwin') {
            settingsPath = join(this.homeDir, 'Library', 'Application Support', 'Code', 'User', 'settings.json');
        }
        else {
            settingsPath = join(this.homeDir, '.config', 'Code', 'User', 'settings.json');
        }
        // Gerar configurações de tema para VSCode
        const vscodeSettings = {
            'workbench.colorCustomizations': {},
        };
        if (config.theme) {
            vscodeSettings['workbench.colorCustomizations'] = {
                'terminal.background': config.theme.background,
                'terminal.foreground': config.theme.foreground,
                'terminalCursor.foreground': config.theme.cursor,
                'terminal.selectionBackground': config.theme.selection,
                'terminal.ansiBlack': config.theme.colors.black,
                'terminal.ansiRed': config.theme.colors.red,
                'terminal.ansiGreen': config.theme.colors.green,
                'terminal.ansiYellow': config.theme.colors.yellow,
                'terminal.ansiBlue': config.theme.colors.blue,
                'terminal.ansiMagenta': config.theme.colors.magenta,
                'terminal.ansiCyan': config.theme.colors.cyan,
                'terminal.ansiWhite': config.theme.colors.white,
                'terminal.ansiBrightBlack': config.theme.colors.brightBlack,
                'terminal.ansiBrightRed': config.theme.colors.brightRed,
                'terminal.ansiBrightGreen': config.theme.colors.brightGreen,
                'terminal.ansiBrightYellow': config.theme.colors.brightYellow,
                'terminal.ansiBrightBlue': config.theme.colors.brightBlue,
                'terminal.ansiBrightMagenta': config.theme.colors.brightMagenta,
                'terminal.ansiBrightCyan': config.theme.colors.brightCyan,
                'terminal.ansiBrightWhite': config.theme.colors.brightWhite,
            };
        }
        if (config.font) {
            vscodeSettings['terminal.integrated.fontFamily'] = config.font.family;
            vscodeSettings['terminal.integrated.fontSize'] = config.font.size;
        }
        // Salvar em arquivo separado para referência
        const snippetPath = join(dirname(settingsPath), 'pagia-terminal-settings.json');
        try {
            await fs.mkdir(dirname(snippetPath), { recursive: true });
            await fs.writeFile(snippetPath, JSON.stringify(vscodeSettings, null, 2), 'utf-8');
            let instructions = `✅ Configurações VSCode salvas!\n`;
            instructions += `   Para usar, adicione ao seu settings.json:\n`;
            instructions += `   1. Abra Command Palette (Ctrl+Shift+P)\n`;
            instructions += `   2. Digite "Preferences: Open Settings (JSON)"\n`;
            instructions += `   3. Copie o conteúdo de ${snippetPath}\n`;
            instructions += `   4. Cole dentro do seu settings.json`;
            return { success: true, message: instructions, configPath: snippetPath };
        }
        catch (error) {
            return { success: false, message: `Erro ao salvar: ${error}` };
        }
    }
    // ================== Helpers ==================
    convertKeyToKitty(key) {
        return key
            .replace('ctrl+', 'ctrl+')
            .replace('shift+', 'shift+')
            .replace('alt+', 'alt+')
            .replace('plus', 'plus')
            .replace('minus', 'minus');
    }
    convertKeyToAlacritty(key) {
        const parts = key.split('+');
        const mainKey = parts.pop().toUpperCase();
        const mods = parts.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join('|');
        return { key: mainKey, mods: mods || undefined };
    }
    convertKeyToGhostty(key) {
        return key
            .replace('ctrl+', 'ctrl+')
            .replace('shift+', 'shift+')
            .replace('alt+', 'alt+');
    }
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            }
            : { r: 0, g: 0, b: 0 };
    }
}
// Exportar instância singleton
export const terminalService = new TerminalService();
//# sourceMappingURL=terminal-service.js.map
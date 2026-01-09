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
export interface TerminalInfo {
    name: string;
    detected: boolean;
    version?: string;
    configPath?: string;
    features: string[];
}
export interface KeyBinding {
    key: string;
    action: string;
    description: string;
}
export interface TerminalConfig {
    terminal: string;
    theme?: TerminalTheme;
    keybindings?: KeyBinding[];
    font?: FontConfig;
    shell?: string;
}
export interface TerminalTheme {
    name: string;
    background: string;
    foreground: string;
    cursor: string;
    selection: string;
    colors: {
        black: string;
        red: string;
        green: string;
        yellow: string;
        blue: string;
        magenta: string;
        cyan: string;
        white: string;
        brightBlack: string;
        brightRed: string;
        brightGreen: string;
        brightYellow: string;
        brightBlue: string;
        brightMagenta: string;
        brightCyan: string;
        brightWhite: string;
    };
}
export interface FontConfig {
    family: string;
    size: number;
    ligatures: boolean;
}
export declare class TerminalService {
    private homeDir;
    private os;
    private supportedTerminals;
    constructor();
    /**
     * Lista todos os terminais suportados
     */
    listSupported(): string[];
    /**
     * Detecta todos os terminais instalados
     */
    detectAll(): Promise<TerminalInfo[]>;
    /**
     * Detecta o terminal atual
     */
    detectCurrent(): Promise<TerminalInfo | null>;
    /**
     * Configura um terminal específico
     */
    configure(terminal: string, config: Partial<TerminalConfig>): Promise<{
        success: boolean;
        message: string;
        configPath?: string;
    }>;
    /**
     * Normaliza nome do terminal para formato padrão
     */
    private normalizeTerminalName;
    /**
     * Aplica keybindings para um terminal
     */
    applyKeybindings(terminal: string, keybindings?: KeyBinding[]): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Aplica tema PAGIA para um terminal
     */
    applyTheme(terminal: string, theme?: TerminalTheme): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Obtém o tema PAGIA padrão
     */
    getDefaultTheme(): TerminalTheme;
    /**
     * Obtém os keybindings padrão
     */
    getDefaultKeybindings(): KeyBinding[];
    private detectKitty;
    private detectAlacritty;
    private detectGhostty;
    private detectWarp;
    private detectZed;
    private detectWindowsTerminal;
    private detectITerm2;
    private detectHyper;
    private detectVSCode;
    private configureKitty;
    private configureAlacritty;
    private configureGhostty;
    private configureWarp;
    private configureZed;
    private configureWindowsTerminal;
    private configureITerm2;
    private configureHyper;
    private configureVSCode;
    private convertKeyToKitty;
    private convertKeyToAlacritty;
    private convertKeyToGhostty;
    private hexToRgb;
}
export declare const terminalService: TerminalService;
//# sourceMappingURL=terminal-service.d.ts.map
/**
 * PAGIA - Logger Utility
 * Sistema de logging com cores e níveis premium
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';

export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

interface LoggerOptions {
    debug?: boolean;
    silent?: boolean;
}

class Logger {
    private debugMode: boolean;
    private silentMode: boolean;
    private currentSpinner: Ora | null = null;

    constructor(options: LoggerOptions = {}) {
        this.debugMode = options.debug || process.env.PAGIA_DEBUG === 'true';
        this.silentMode = options.silent || false;
    }

    private log(level: LogLevel, message: string, ...args: unknown[]): void {
        if (this.silentMode) return;
        if (level === 'debug' && !this.debugMode) return;

        const timestamp = chalk.gray(`[${new Date().toLocaleTimeString()}]`);
        let prefix: string;
        let colorFn: (text: string) => string;

        switch (level) {
            case 'debug':
                prefix = chalk.magenta('🔍 DEBUG');
                colorFn = chalk.magenta;
                break;
            case 'info':
                prefix = chalk.blue('ℹ INFO');
                colorFn = chalk.blue;
                break;
            case 'success':
                prefix = chalk.green('✓ SUCCESS');
                colorFn = chalk.green;
                break;
            case 'warn':
                prefix = chalk.yellow('⚠ WARN');
                colorFn = chalk.yellow;
                break;
            case 'error':
                prefix = chalk.red('✖ ERROR');
                colorFn = chalk.red;
                break;
        }

        console.log(`${timestamp} ${prefix} ${colorFn(message)}`, ...args);
    }

    debug(message: string, ...args: unknown[]): void {
        this.log('debug', message, ...args);
    }

    info(message: string, ...args: unknown[]): void {
        this.log('info', message, ...args);
    }

    success(message: string, ...args: unknown[]): void {
        this.log('success', message, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        this.log('warn', message, ...args);
    }

    error(message: string, ...args: unknown[]): void {
        this.log('error', message, ...args);
    }

    /**
     * Start a spinner with a message
     */
    spin(message: string): Ora {
        if (this.currentSpinner) {
            try { this.currentSpinner.stop(); } catch { /* ignore */ }
        }

        this.currentSpinner = ora({
            text: message,
            color: 'cyan',
            spinner: 'dots',
        }).start();

        return this.currentSpinner;
    }

    /**
     * Stop current spinner with success
     */
    spinSuccess(message?: string): void {
        if (this.currentSpinner) {
            try { this.currentSpinner.succeed(message); } catch { /* ignore */ }
            this.currentSpinner = null;
        }
    }

    /**
     * Stop current spinner with failure
     */
    spinFail(message?: string): void {
        if (this.currentSpinner) {
            try { this.currentSpinner.fail(message); } catch { /* ignore */ }
            this.currentSpinner = null;
        }
    }

    /**
     * Stop current spinner
     */
    spinStop(): void {
        if (this.currentSpinner) {
            try { this.currentSpinner.stop(); } catch { /* ignore */ }
            this.currentSpinner = null;
        }
    }

    /**
     * Display a boxed message with premium styling
     */
    box(message: string, options?: { title?: string; borderColor?: string; padding?: number }): void {
        if (this.silentMode) return;

        console.log(
            boxen(message, {
                padding: options?.padding ?? 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: (options?.borderColor as any) || 'cyan',
                title: options?.title,
                titleAlignment: 'center',
            })
        );
    }

    /**
     * Display a welcome banner like Qoder/iFlow
     */
    welcome(version: string, cwd: string): void {
        const welcomeMsg = `Bem-vindo ao PAGIA CLI! ${chalk.cyan(version)}\n\nDiretório: ${chalk.gray(cwd)}`;

        console.log(
            boxen(welcomeMsg, {
                padding: 1,
                margin: { top: 1, bottom: 0, left: 1, right: 1 },
                borderStyle: 'round',
                borderColor: 'cyan',
                width: 60
            })
        );
    }

    /**
     * Display a version update notice
     */
    updateNotice(current: string, latest: string, features: string[]): void {
        console.log(`\n ✨ ${chalk.yellow('Nova versão')} ${chalk.green(latest)} ${chalk.yellow('disponível!')} ${chalk.gray(`(instalada: ${current})`)}`);
        features.forEach(f => console.log(chalk.gray(`  - ${f}`)));
        console.log(chalk.cyan(`\n Execute \`pagia update cli\` para atualizar para a versão mais recente.\n`));
    }

    /**
     * Display the big ASCII banner
     */
    banner(): void {
        const text = figlet.textSync('PAGIA', {
            font: 'ANSI Shadow',
            horizontalLayout: 'fitted',
        });

        // Split text into lines to apply gradient colors manually
        const lines = text.split('\n');
        const colors = [chalk.cyan, chalk.cyanBright, chalk.blue, chalk.blueBright, chalk.magenta];

        console.log('');
        lines.forEach((line, i) => {
            const color = colors[i % colors.length];
            console.log(color(line));
        });

        console.log(chalk.gray('  Framework CLI modular de agentes de IA para gestão de projetos de software.'));
        console.log(chalk.gray('  Inspirado no BMAD Method com planejamento multi-nível inteligente.\n'));
    }

    /**
     * Display getting started tips
     */
    tips(tips: string[]): void {
        console.log(chalk.bold('Dicas para começar:'));
        tips.forEach((tip, i) => {
            console.log(`${chalk.cyan(i + 1)}. ${tip}`);
        });
        console.log('');
    }

    /**
     * Display a section header
     */
    section(title: string): void {
        if (this.silentMode) return;
        console.log();
        console.log(chalk.cyan.bold(`━━━ ${title} ━━━`));
        console.log();
    }

    /**
     * Display a list of items
     */
    list(items: string[], bullet = '•'): void {
        if (this.silentMode) return;
        items.forEach((item) => {
            console.log(`  ${chalk.cyan(bullet)} ${item}`);
        });
    }

    /**
     * Display a key-value pair
     */
    keyValue(key: string, value: string): void {
        if (this.silentMode) return;
        console.log(`  ${chalk.gray(key + ':')} ${chalk.white(value)}`);
    }

    /**
     * Display a table
     */
    table(data: Record<string, string>[]): void {
        if (this.silentMode) return;
        console.table(data);
    }

    /**
     * Create a new line
     */
    newLine(count = 1): void {
        if (this.silentMode) return;
        for (let i = 0; i < count; i++) {
            console.log();
        }
    }

    /**
     * Set debug mode
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    /**
     * Set silent mode
     */
    setSilentMode(enabled: boolean): void {
        this.silentMode = enabled;
    }
}

// Singleton instance
const logger = new Logger();

export { Logger, logger };


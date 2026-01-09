/**
 * PAGIA - Logger Utility
 * Sistema de logging com cores e níveis premium
 */
import { Ora } from 'ora';
export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';
interface LoggerOptions {
    debug?: boolean;
    silent?: boolean;
}
declare class Logger {
    private debugMode;
    private silentMode;
    private currentSpinner;
    constructor(options?: LoggerOptions);
    private log;
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    success(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    /**
     * Start a spinner with a message
     */
    spin(message: string): Ora;
    /**
     * Stop current spinner with success
     */
    spinSuccess(message?: string): void;
    /**
     * Stop current spinner with failure
     */
    spinFail(message?: string): void;
    /**
     * Stop current spinner
     */
    spinStop(): void;
    /**
     * Display a boxed message with premium styling
     */
    box(message: string, options?: {
        title?: string;
        borderColor?: string;
        padding?: number;
    }): void;
    /**
     * Display a welcome banner like Qoder/iFlow
     */
    welcome(version: string, cwd: string): void;
    /**
     * Display a version update notice
     */
    updateNotice(current: string, latest: string, features: string[]): void;
    /**
     * Display the big ASCII banner
     */
    banner(): void;
    /**
     * Display getting started tips
     */
    tips(tips: string[]): void;
    /**
     * Display a section header
     */
    section(title: string): void;
    /**
     * Display a list of items
     */
    list(items: string[], bullet?: string): void;
    /**
     * Display a key-value pair
     */
    keyValue(key: string, value: string): void;
    /**
     * Display a table
     */
    table(data: Record<string, string>[]): void;
    /**
     * Create a new line
     */
    newLine(count?: number): void;
    /**
     * Set debug mode
     */
    setDebugMode(enabled: boolean): void;
    /**
     * Set silent mode
     */
    setSilentMode(enabled: boolean): void;
}
declare const logger: Logger;
export { Logger, logger };
//# sourceMappingURL=logger.d.ts.map
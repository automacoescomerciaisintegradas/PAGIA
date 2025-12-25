/**
 * PAGIA - Ingest Tool Integration
 * Integração com a ferramenta CLI ingest para parsing de código
 * 
 * @see https://github.com/sammcj/ingest
 * @module utils/ingest-tool
 * @author Automações Comerciais Integradas
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { logger } from './logger.js';

const execAsync = promisify(exec);

/**
 * Opções para o comando ingest
 */
export interface IngestOptions {
    /** Diretório ou arquivo a processar */
    path: string;
    /** Padrões glob para incluir */
    include?: string[];
    /** Padrões glob para excluir */
    exclude?: string[];
    /** Incluir diff do git */
    gitDiff?: boolean;
    /** Incluir log do git */
    gitLog?: boolean;
    /** Comprimir código usando Tree-sitter */
    compress?: boolean;
    /** Arquivo de saída */
    output?: string;
    /** Processar URLs web */
    web?: boolean;
    /** Domínios permitidos para crawling */
    webDomains?: string[];
    /** Profundidade do crawling */
    webDepth?: number;
    /** Saída em JSON */
    json?: boolean;
}

/**
 * Resultado do comando ingest
 */
export interface IngestResult {
    success: boolean;
    content?: string;
    tokens?: number;
    error?: string;
    outputPath?: string;
}

/**
 * Estatísticas de VRAM
 */
export interface VRAMStats {
    model: string;
    estimatedVRAM?: string;
    maxContext?: number;
    fitsInMemory?: boolean;
}

/**
 * Classe IngestTool - Wrapper para o CLI ingest
 */
export class IngestTool {
    private static instance: IngestTool;
    private ingestPath: string = 'ingest';
    private isAvailable: boolean = false;
    private cacheDir: string;

    private constructor() {
        this.cacheDir = join(process.cwd(), '.pagia', 'ingest-cache');
    }

    /**
     * Obtém instância singleton
     */
    static getInstance(): IngestTool {
        if (!IngestTool.instance) {
            IngestTool.instance = new IngestTool();
        }
        return IngestTool.instance;
    }

    /**
     * Inicializa e verifica disponibilidade do ingest
     */
    async initialize(): Promise<boolean> {
        try {
            // Verificar se ingest está disponível
            const { stdout } = await execAsync('ingest --version');
            logger.info(`Ingest disponível: ${stdout.trim()}`);
            this.isAvailable = true;

            // Criar diretório de cache
            await mkdir(this.cacheDir, { recursive: true });

            return true;
        } catch (error) {
            logger.warn('Ingest CLI não encontrado. Instale com: wsl -e bash -c "sudo mv ingest /usr/local/bin/"');
            this.isAvailable = false;
            return false;
        }
    }

    /**
     * Verifica se o ingest está disponível
     */
    checkAvailability(): boolean {
        return this.isAvailable;
    }

    /**
     * Executa o comando ingest
     */
    async run(options: IngestOptions): Promise<IngestResult> {
        if (!this.isAvailable) {
            await this.initialize();
            if (!this.isAvailable) {
                return { success: false, error: 'Ingest CLI não disponível' };
            }
        }

        try {
            const args = this.buildArgs(options);
            const command = `ingest ${args.join(' ')}`;

            logger.debug(`Executando: ${command}`);

            const { stdout, stderr } = await execAsync(command, {
                maxBuffer: 50 * 1024 * 1024, // 50MB buffer
                timeout: 300000, // 5 minutos
            });

            // Extrair contagem de tokens do output
            const tokenMatch = stderr.match(/(\d+[\d,]*)\s*Tokens/);
            const tokens = tokenMatch ? parseInt(tokenMatch[1].replace(/,/g, '')) : undefined;

            // Se output foi especificado, ler do arquivo
            let content = stdout;
            if (options.output && existsSync(options.output)) {
                content = await readFile(options.output, 'utf-8');
            }

            return {
                success: true,
                content,
                tokens,
                outputPath: options.output,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Erro ao executar ingest: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Constrói argumentos do comando
     */
    private buildArgs(options: IngestOptions): string[] {
        const args: string[] = [];

        // Padrões de inclusão
        if (options.include?.length) {
            for (const pattern of options.include) {
                args.push('-i', `"${pattern}"`);
            }
        }

        // Padrões de exclusão
        if (options.exclude?.length) {
            for (const pattern of options.exclude) {
                args.push('-e', `"${pattern}"`);
            }
        }

        // Git diff
        if (options.gitDiff) {
            args.push('-d');
        }

        // Git log
        if (options.gitLog) {
            args.push('--git-log');
        }

        // Comprimir código
        if (options.compress) {
            args.push('--compress');
        }

        // Saída para arquivo
        if (options.output) {
            args.push('-o', `"${options.output}"`);
        }

        // Modo web
        if (options.web) {
            args.push('--web');

            if (options.webDomains?.length) {
                args.push('--web-domains', options.webDomains.join(','));
            }

            if (options.webDepth) {
                args.push('--web-depth', String(options.webDepth));
            }
        }

        // Saída JSON
        if (options.json) {
            args.push('--json');
        }

        // Caminho
        args.push(`"${options.path}"`);

        return args;
    }

    /**
     * Processa um diretório de código
     */
    async processDirectory(
        dirPath: string,
        options?: Partial<IngestOptions>
    ): Promise<IngestResult> {
        const resolvedPath = resolve(dirPath);

        if (!existsSync(resolvedPath)) {
            return { success: false, error: `Diretório não encontrado: ${resolvedPath}` };
        }

        return this.run({
            path: resolvedPath,
            ...options,
        });
    }

    /**
     * Processa código e retorna conteúdo otimizado para LLM
     */
    async processForLLM(
        path: string,
        options?: {
            compress?: boolean;
            maxTokens?: number;
            includePatterns?: string[];
            excludePatterns?: string[];
        }
    ): Promise<IngestResult> {
        const result = await this.run({
            path,
            compress: options?.compress ?? true,
            include: options?.includePatterns,
            exclude: options?.excludePatterns || [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
                '**/*.min.js',
                '**/*.min.css',
            ],
        });

        if (!result.success || !result.content) {
            return result;
        }

        // Verificar limite de tokens
        if (options?.maxTokens && result.tokens && result.tokens > options.maxTokens) {
            logger.warn(`Conteúdo excede ${options.maxTokens} tokens (${result.tokens} tokens)`);

            // Tentar comprimir mais
            const compressedResult = await this.run({
                path,
                compress: true,
                include: options.includePatterns,
                exclude: [
                    ...(options.excludePatterns || []),
                    '**/test/**',
                    '**/tests/**',
                    '**/*.test.*',
                    '**/*.spec.*',
                ],
            });

            if (compressedResult.success && compressedResult.tokens &&
                compressedResult.tokens < result.tokens) {
                return compressedResult;
            }
        }

        return result;
    }

    /**
     * Processa uma URL ou website
     */
    async processURL(
        url: string,
        options?: {
            depth?: number;
            domains?: string[];
        }
    ): Promise<IngestResult> {
        return this.run({
            path: url,
            web: true,
            webDepth: options?.depth,
            webDomains: options?.domains,
        });
    }

    /**
     * Estima uso de VRAM para o conteúdo gerado
     */
    async estimateVRAM(
        path: string,
        model: string,
        options?: {
            memory?: number;
            quant?: string;
            context?: number;
        }
    ): Promise<VRAMStats> {
        try {
            const args = [
                '--vram',
                '--model', model,
            ];

            if (options?.memory) {
                args.push('--memory', String(options.memory));
            }
            if (options?.quant) {
                args.push('--quant', options.quant);
            }
            if (options?.context) {
                args.push('--context', String(options.context));
            }

            args.push(path);

            const command = `ingest ${args.join(' ')}`;
            const { stdout, stderr } = await execAsync(command);

            // Parse da saída
            const fullOutput = stdout + stderr;

            const vramMatch = fullOutput.match(/Estimated VRAM usage:\s*([\d.]+)\s*GB/);
            const contextMatch = fullOutput.match(/Maximum context.*:\s*(\d+)/);
            const fitsMatch = fullOutput.includes('fits within');

            return {
                model,
                estimatedVRAM: vramMatch ? `${vramMatch[1]} GB` : undefined,
                maxContext: contextMatch ? parseInt(contextMatch[1]) : undefined,
                fitsInMemory: fitsMatch,
            };
        } catch (error) {
            logger.error(`Erro ao estimar VRAM: ${error}`);
            return { model, error: String(error) } as VRAMStats;
        }
    }

    /**
     * Salva resultado em cache
     */
    async saveToCache(key: string, content: string): Promise<string> {
        const cachePath = join(this.cacheDir, `${key}.md`);
        await writeFile(cachePath, content, 'utf-8');
        return cachePath;
    }

    /**
     * Carrega do cache
     */
    async loadFromCache(key: string): Promise<string | null> {
        const cachePath = join(this.cacheDir, `${key}.md`);
        try {
            return await readFile(cachePath, 'utf-8');
        } catch {
            return null;
        }
    }

    /**
     * Gera contexto para agentes PAGIA
     */
    async generateAgentContext(
        projectPath: string,
        agentType: 'code' | 'docs' | 'test' | 'review'
    ): Promise<IngestResult> {
        const patterns: Record<string, { include: string[]; exclude: string[] }> = {
            code: {
                include: ['**/*.ts', '**/*.js', '**/*.py', '**/*.go'],
                exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.*'],
            },
            docs: {
                include: ['**/*.md', '**/*.txt', '**/*.rst', '**/docs/**'],
                exclude: ['**/node_modules/**'],
            },
            test: {
                include: ['**/*.test.*', '**/*.spec.*', '**/test/**', '**/tests/**'],
                exclude: ['**/node_modules/**'],
            },
            review: {
                include: ['**/*.ts', '**/*.js'],
                exclude: ['**/node_modules/**', '**/dist/**'],
            },
        };

        const config = patterns[agentType] || patterns.code;

        return this.processForLLM(projectPath, {
            compress: true,
            includePatterns: config.include,
            excludePatterns: config.exclude,
        });
    }
}

// Singleton exportado
export const ingestTool = IngestTool.getInstance();

/**
 * Função auxiliar para processar código rapidamente
 */
export async function ingestCode(path: string): Promise<string | null> {
    const result = await ingestTool.processForLLM(path);
    return result.success ? result.content || null : null;
}

/**
 * Função auxiliar para processar URL
 */
export async function ingestURL(url: string, depth?: number): Promise<string | null> {
    const result = await ingestTool.processURL(url, { depth });
    return result.success ? result.content || null : null;
}

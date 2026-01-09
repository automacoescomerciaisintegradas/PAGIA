/**
 * PAGIA - Ingest Tool Integration
 * Integração com a ferramenta CLI ingest para parsing de código
 *
 * @see https://github.com/sammcj/ingest
 * @module utils/ingest-tool
 * @author Automações Comerciais Integradas
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { logger } from './logger.js';
const execAsync = promisify(exec);
/**
 * Classe IngestTool - Wrapper para o CLI ingest
 */
export class IngestTool {
    static instance;
    ingestPath = 'ingest';
    isAvailable = false;
    cacheDir;
    constructor() {
        this.cacheDir = join(process.cwd(), '.pagia', 'ingest-cache');
    }
    /**
     * Obtém instância singleton
     */
    static getInstance() {
        if (!IngestTool.instance) {
            IngestTool.instance = new IngestTool();
        }
        return IngestTool.instance;
    }
    /**
     * Inicializa e verifica disponibilidade do ingest
     */
    async initialize() {
        try {
            // Verificar se ingest está disponível
            const { stdout } = await execAsync('ingest --version');
            logger.info(`Ingest disponível: ${stdout.trim()}`);
            this.isAvailable = true;
            // Criar diretório de cache
            await mkdir(this.cacheDir, { recursive: true });
            return true;
        }
        catch (error) {
            logger.warn('Ingest CLI não encontrado. Instale com: wsl -e bash -c "sudo mv ingest /usr/local/bin/"');
            this.isAvailable = false;
            return false;
        }
    }
    /**
     * Verifica se o ingest está disponível
     */
    checkAvailability() {
        return this.isAvailable;
    }
    /**
     * Executa o comando ingest
     */
    async run(options) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Erro ao executar ingest: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Constrói argumentos do comando
     */
    buildArgs(options) {
        const args = [];
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
    async processDirectory(dirPath, options) {
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
    async processForLLM(path, options) {
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
    async processURL(url, options) {
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
    async estimateVRAM(path, model, options) {
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
        }
        catch (error) {
            logger.error(`Erro ao estimar VRAM: ${error}`);
            return { model, error: String(error) };
        }
    }
    /**
     * Salva resultado em cache
     */
    async saveToCache(key, content) {
        const cachePath = join(this.cacheDir, `${key}.md`);
        await writeFile(cachePath, content, 'utf-8');
        return cachePath;
    }
    /**
     * Carrega do cache
     */
    async loadFromCache(key) {
        const cachePath = join(this.cacheDir, `${key}.md`);
        try {
            return await readFile(cachePath, 'utf-8');
        }
        catch {
            return null;
        }
    }
    /**
     * Gera contexto para agentes PAGIA
     */
    async generateAgentContext(projectPath, agentType) {
        const patterns = {
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
export async function ingestCode(path) {
    const result = await ingestTool.processForLLM(path);
    return result.success ? result.content || null : null;
}
/**
 * Função auxiliar para processar URL
 */
export async function ingestURL(url, depth) {
    const result = await ingestTool.processURL(url, { depth });
    return result.success ? result.content || null : null;
}
//# sourceMappingURL=ingest-tool.js.map
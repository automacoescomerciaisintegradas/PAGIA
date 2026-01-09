/**
 * PAGIA - File Utilities
 * Utilitários para operações de arquivo
 *
 * @module utils/file-utils
 * @author Automações Comerciais Integradas
 */
/**
 * Verifica se um arquivo existe
 */
export declare function fileExists(filePath: string): boolean;
/**
 * Verifica se um diretório existe
 */
export declare function dirExists(dirPath: string): boolean;
/**
 * Cria um diretório recursivamente
 */
export declare function ensureDir(dirPath: string): void;
/**
 * Lê conteúdo de um arquivo
 */
export declare function readFile(filePath: string): string;
/**
 * Escreve conteúdo em um arquivo
 */
export declare function writeFile(filePath: string, content: string): void;
/**
 * Lê e parseia um arquivo JSON
 */
export declare function readJson<T = unknown>(filePath: string): T;
/**
 * Escreve um objeto como JSON em um arquivo
 */
export declare function writeJson(filePath: string, data: unknown, pretty?: boolean): void;
/**
 * Lê e parseia um arquivo YAML
 */
export declare function readYaml<T = unknown>(filePath: string): T;
/**
 * Escreve um objeto como YAML em um arquivo
 */
export declare function writeYaml(filePath: string, data: unknown): void;
/**
 * Copia um arquivo
 */
export declare function copyFile(source: string, destination: string): void;
/**
 * Remove um arquivo
 */
export declare function removeFile(filePath: string): boolean;
/**
 * Remove um diretório recursivamente
 */
export declare function removeDir(dirPath: string): boolean;
/**
 * Lista arquivos em um diretório
 */
export declare function listFiles(dirPath: string, options?: {
    recursive?: boolean;
    extensions?: string[];
}): string[];
/**
 * Lista diretórios em um diretório
 */
export declare function listDirs(dirPath: string): string[];
/**
 * Obtém informações de um arquivo
 */
export declare function getFileInfo(filePath: string): {
    size: number;
    modified: Date;
    created: Date;
} | null;
/**
 * Obtém tamanho de um diretório
 */
export declare function getDirSize(dirPath: string): number;
/**
 * Busca arquivos usando padrão glob
 */
export declare function findFiles(pattern: string, options?: {
    cwd?: string;
    ignore?: string[];
}): Promise<string[]>;
/**
 * Obtém extensão de um arquivo (sem ponto)
 */
export declare function getExtension(filePath: string): string;
/**
 * Obtém nome do arquivo sem extensão
 */
export declare function getBasename(filePath: string, withExtension?: boolean): string;
/**
 * Resolve caminho relativo a um diretório base
 */
export declare function resolvePath(basePath: string, relativePath: string): string;
/**
 * Obtém caminho relativo
 */
export declare function getRelativePath(from: string, to: string): string;
/**
 * Sanitiza nome de arquivo
 */
export declare function sanitizeFilename(name: string): string;
/**
 * Gera nome único para arquivo
 */
export declare function uniqueFilename(basePath: string, name: string, extension: string): string;
/**
 * Formata tamanho de arquivo em bytes para formato legível
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Lê arquivo com fallback para valor padrão
 */
export declare function readFileOrDefault(filePath: string, defaultValue: string): string;
/**
 * Cria um backup de arquivo
 */
export declare function backupFile(filePath: string): string | null;
//# sourceMappingURL=file-utils.d.ts.map
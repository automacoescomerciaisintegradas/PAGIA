/**
 * PAGIA - File Utilities
 * Utilitários para operações de arquivo
 * 
 * @module utils/file-utils
 * @author Automações Comerciais Integradas
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync, rmSync, copyFileSync } from 'fs';
import { join, dirname, extname, basename, resolve, relative } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { glob } from 'glob';

/**
 * Verifica se um arquivo existe
 */
export function fileExists(filePath: string): boolean {
    return existsSync(filePath);
}

/**
 * Verifica se um diretório existe
 */
export function dirExists(dirPath: string): boolean {
    return existsSync(dirPath);
}

/**
 * Cria um diretório recursivamente
 */
export function ensureDir(dirPath: string): void {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Lê conteúdo de um arquivo
 */
export function readFile(filePath: string): string {
    return readFileSync(filePath, 'utf-8');
}

/**
 * Escreve conteúdo em um arquivo
 */
export function writeFile(filePath: string, content: string): void {
    ensureDir(dirname(filePath));
    writeFileSync(filePath, content, 'utf-8');
}

/**
 * Lê e parseia um arquivo JSON
 */
export function readJson<T = unknown>(filePath: string): T {
    const content = readFile(filePath);
    return JSON.parse(content) as T;
}

/**
 * Escreve um objeto como JSON em um arquivo
 */
export function writeJson(filePath: string, data: unknown, pretty: boolean = true): void {
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    writeFile(filePath, content);
}

/**
 * Lê e parseia um arquivo YAML
 */
export function readYaml<T = unknown>(filePath: string): T {
    const content = readFile(filePath);
    return parseYaml(content) as T;
}

/**
 * Escreve um objeto como YAML em um arquivo
 */
export function writeYaml(filePath: string, data: unknown): void {
    const content = stringifyYaml(data, { indent: 2, lineWidth: 120 });
    writeFile(filePath, content);
}

/**
 * Copia um arquivo
 */
export function copyFile(source: string, destination: string): void {
    ensureDir(dirname(destination));
    copyFileSync(source, destination);
}

/**
 * Remove um arquivo
 */
export function removeFile(filePath: string): boolean {
    if (existsSync(filePath)) {
        unlinkSync(filePath);
        return true;
    }
    return false;
}

/**
 * Remove um diretório recursivamente
 */
export function removeDir(dirPath: string): boolean {
    if (existsSync(dirPath)) {
        rmSync(dirPath, { recursive: true, force: true });
        return true;
    }
    return false;
}

/**
 * Lista arquivos em um diretório
 */
export function listFiles(dirPath: string, options?: { recursive?: boolean; extensions?: string[] }): string[] {
    if (!existsSync(dirPath)) {
        return [];
    }

    const files: string[] = [];
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isFile()) {
            if (options?.extensions) {
                const ext = extname(entry.name).toLowerCase().replace('.', '');
                if (options.extensions.includes(ext)) {
                    files.push(fullPath);
                }
            } else {
                files.push(fullPath);
            }
        } else if (entry.isDirectory() && options?.recursive) {
            files.push(...listFiles(fullPath, options));
        }
    }

    return files;
}

/**
 * Lista diretórios em um diretório
 */
export function listDirs(dirPath: string): string[] {
    if (!existsSync(dirPath)) {
        return [];
    }

    return readdirSync(dirPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => join(dirPath, d.name));
}

/**
 * Obtém informações de um arquivo
 */
export function getFileInfo(filePath: string): { size: number; modified: Date; created: Date } | null {
    if (!existsSync(filePath)) {
        return null;
    }

    const stats = statSync(filePath);
    return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
    };
}

/**
 * Obtém tamanho de um diretório
 */
export function getDirSize(dirPath: string): number {
    if (!existsSync(dirPath)) {
        return 0;
    }

    let size = 0;
    const files = listFiles(dirPath, { recursive: true });

    for (const file of files) {
        const info = getFileInfo(file);
        if (info) {
            size += info.size;
        }
    }

    return size;
}

/**
 * Busca arquivos usando padrão glob
 */
export async function findFiles(pattern: string, options?: { cwd?: string; ignore?: string[] }): Promise<string[]> {
    return glob(pattern, {
        cwd: options?.cwd,
        ignore: options?.ignore,
        absolute: true,
    });
}

/**
 * Obtém extensão de um arquivo (sem ponto)
 */
export function getExtension(filePath: string): string {
    return extname(filePath).toLowerCase().replace('.', '');
}

/**
 * Obtém nome do arquivo sem extensão
 */
export function getBasename(filePath: string, withExtension: boolean = false): string {
    if (withExtension) {
        return basename(filePath);
    }
    return basename(filePath, extname(filePath));
}

/**
 * Resolve caminho relativo a um diretório base
 */
export function resolvePath(basePath: string, relativePath: string): string {
    return resolve(basePath, relativePath);
}

/**
 * Obtém caminho relativo
 */
export function getRelativePath(from: string, to: string): string {
    return relative(from, to);
}

/**
 * Sanitiza nome de arquivo
 */
export function sanitizeFilename(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Gera nome único para arquivo
 */
export function uniqueFilename(basePath: string, name: string, extension: string): string {
    const sanitized = sanitizeFilename(name);
    let filename = `${sanitized}.${extension}`;
    let counter = 1;

    while (existsSync(join(basePath, filename))) {
        filename = `${sanitized}-${counter}.${extension}`;
        counter++;
    }

    return join(basePath, filename);
}

/**
 * Formata tamanho de arquivo em bytes para formato legível
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Lê arquivo com fallback para valor padrão
 */
export function readFileOrDefault(filePath: string, defaultValue: string): string {
    if (existsSync(filePath)) {
        return readFile(filePath);
    }
    return defaultValue;
}

/**
 * Cria um backup de arquivo
 */
export function backupFile(filePath: string): string | null {
    if (!existsSync(filePath)) {
        return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.${timestamp}.bak`;
    copyFile(filePath, backupPath);

    return backupPath;
}

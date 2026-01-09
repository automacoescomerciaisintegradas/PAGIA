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
export function fileExists(filePath) {
    return existsSync(filePath);
}
/**
 * Verifica se um diretório existe
 */
export function dirExists(dirPath) {
    return existsSync(dirPath);
}
/**
 * Cria um diretório recursivamente
 */
export function ensureDir(dirPath) {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}
/**
 * Lê conteúdo de um arquivo
 */
export function readFile(filePath) {
    return readFileSync(filePath, 'utf-8');
}
/**
 * Escreve conteúdo em um arquivo
 */
export function writeFile(filePath, content) {
    ensureDir(dirname(filePath));
    writeFileSync(filePath, content, 'utf-8');
}
/**
 * Lê e parseia um arquivo JSON
 */
export function readJson(filePath) {
    const content = readFile(filePath);
    return JSON.parse(content);
}
/**
 * Escreve um objeto como JSON em um arquivo
 */
export function writeJson(filePath, data, pretty = true) {
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    writeFile(filePath, content);
}
/**
 * Lê e parseia um arquivo YAML
 */
export function readYaml(filePath) {
    const content = readFile(filePath);
    return parseYaml(content);
}
/**
 * Escreve um objeto como YAML em um arquivo
 */
export function writeYaml(filePath, data) {
    const content = stringifyYaml(data, { indent: 2, lineWidth: 120 });
    writeFile(filePath, content);
}
/**
 * Copia um arquivo
 */
export function copyFile(source, destination) {
    ensureDir(dirname(destination));
    copyFileSync(source, destination);
}
/**
 * Remove um arquivo
 */
export function removeFile(filePath) {
    if (existsSync(filePath)) {
        unlinkSync(filePath);
        return true;
    }
    return false;
}
/**
 * Remove um diretório recursivamente
 */
export function removeDir(dirPath) {
    if (existsSync(dirPath)) {
        rmSync(dirPath, { recursive: true, force: true });
        return true;
    }
    return false;
}
/**
 * Lista arquivos em um diretório
 */
export function listFiles(dirPath, options) {
    if (!existsSync(dirPath)) {
        return [];
    }
    const files = [];
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        if (entry.isFile()) {
            if (options?.extensions) {
                const ext = extname(entry.name).toLowerCase().replace('.', '');
                if (options.extensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
            else {
                files.push(fullPath);
            }
        }
        else if (entry.isDirectory() && options?.recursive) {
            files.push(...listFiles(fullPath, options));
        }
    }
    return files;
}
/**
 * Lista diretórios em um diretório
 */
export function listDirs(dirPath) {
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
export function getFileInfo(filePath) {
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
export function getDirSize(dirPath) {
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
export async function findFiles(pattern, options) {
    return glob(pattern, {
        cwd: options?.cwd,
        ignore: options?.ignore,
        absolute: true,
    });
}
/**
 * Obtém extensão de um arquivo (sem ponto)
 */
export function getExtension(filePath) {
    return extname(filePath).toLowerCase().replace('.', '');
}
/**
 * Obtém nome do arquivo sem extensão
 */
export function getBasename(filePath, withExtension = false) {
    if (withExtension) {
        return basename(filePath);
    }
    return basename(filePath, extname(filePath));
}
/**
 * Resolve caminho relativo a um diretório base
 */
export function resolvePath(basePath, relativePath) {
    return resolve(basePath, relativePath);
}
/**
 * Obtém caminho relativo
 */
export function getRelativePath(from, to) {
    return relative(from, to);
}
/**
 * Sanitiza nome de arquivo
 */
export function sanitizeFilename(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
/**
 * Gera nome único para arquivo
 */
export function uniqueFilename(basePath, name, extension) {
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
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * Lê arquivo com fallback para valor padrão
 */
export function readFileOrDefault(filePath, defaultValue) {
    if (existsSync(filePath)) {
        return readFile(filePath);
    }
    return defaultValue;
}
/**
 * Cria um backup de arquivo
 */
export function backupFile(filePath) {
    if (!existsSync(filePath)) {
        return null;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.${timestamp}.bak`;
    copyFile(filePath, backupPath);
    return backupPath;
}
//# sourceMappingURL=file-utils.js.map
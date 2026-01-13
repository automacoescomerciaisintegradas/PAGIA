import fs from 'fs';
import path from 'path';

const PAGIA_DIR = path.resolve(process.cwd(), '.pagia');
const SESSIONS_DIR = path.join(PAGIA_DIR, 'sessions');

// Garantir que os diretórios existam
if (!fs.existsSync(PAGIA_DIR)) {
    fs.mkdirSync(PAGIA_DIR, { recursive: true });
}
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

export function loadSession(id: string): string[] {
    const file = path.join(SESSIONS_DIR, `${id}.json`);
    if (!fs.existsSync(file)) return [];

    try {
        const content = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(content);
        // Garantir que retorna um array, mesmo que o arquivo esteja corrompido
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`Erro ao ler sessão ${id}:`, (error as Error).message);
        return [];
    }
}

export function saveSession(id: string, history: string[]) {
    try {
        // Limitar tamanho do histórico para evitar arquivos muito grandes
        const maxHistorySize = 1000;
        if (history.length > maxHistorySize) {
            // Manter as últimas entradas mais recentes
            history = history.slice(-maxHistorySize);
        }

        const file = path.join(SESSIONS_DIR, `${id}.json`);
        fs.writeFileSync(file, JSON.stringify(history, null, 2));
        return true;
    } catch (error) {
        console.error(`Erro ao salvar sessão ${id}:`, (error as Error).message);
        return false;
    }
}

// Função para listar todas as sessões
export function listSessions(): string[] {
    try {
        if (!fs.existsSync(SESSIONS_DIR)) return [];

        const files = fs.readdirSync(SESSIONS_DIR);
        return files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
    } catch (error) {
        console.error('Erro ao listar sessões:', (error as Error).message);
        return [];
    }
}

// Função para limpar histórico antigo
export function cleanupSession(id: string, maxEntries: number = 500) {
    const history = loadSession(id);
    if (history.length > maxEntries) {
        const trimmedHistory = history.slice(-maxEntries);
        saveSession(id, trimmedHistory);
        return trimmedHistory.length;
    }
    return history.length;
}

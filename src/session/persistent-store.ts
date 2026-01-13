import fs from 'fs';
import path from 'path';

const SESSIONS_DIR = path.resolve(process.cwd(), '.pagia', 'sessions');
const COMMAND_HISTORY_FILE = path.resolve(process.cwd(), '.pagia', 'command-history.json');

// Garantir que os diretórios existam
if (!fs.existsSync(path.dirname(SESSIONS_DIR))) {
    fs.mkdirSync(path.dirname(SESSIONS_DIR), { recursive: true });
}
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

export function loadSession(id: string) {
    const file = path.join(SESSIONS_DIR, `${id}.json`);
    if (!fs.existsSync(file)) return [];
    
    try {
        const content = fs.readFileSync(file, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Erro ao ler sessão ${id}:`, (error as Error).message);
        return [];
    }
}

export function saveSession(id: string, history: any[]) {
    const file = path.join(SESSIONS_DIR, `${id}.json`);
    try {
        // Limitar tamanho do histórico para evitar arquivos muito grandes
        if (history.length > 1000) {
            history = history.slice(-1000); // Manter apenas as últimas 1000 entradas
        }
        fs.writeFileSync(file, JSON.stringify(history, null, 2));
        return true;
    } catch (error) {
        console.error(`Erro ao salvar sessão ${id}:`, (error as Error).message);
        return false;
    }
}

export function loadCommandHistory() {
    if (!fs.existsSync(COMMAND_HISTORY_FILE)) return [];
    
    try {
        const content = fs.readFileSync(COMMAND_HISTORY_FILE, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Erro ao ler histórico de comandos:', (error as Error).message);
        return [];
    }
}

export function saveCommandHistory(history: any[]) {
    try {
        // Limitar histórico de comandos
        if (history.length > 500) {
            history = history.slice(-500);
        }
        fs.writeFileSync(COMMAND_HISTORY_FILE, JSON.stringify(history, null, 2));
        return true;
    } catch (error) {
        console.error('Erro ao salvar histórico de comandos:', (error as Error).message);
        return false;
    }
}

// Função para obter lista de todas as sessões
export function listSessions() {
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

// Função para limpar sessão antiga
export function cleanupOldSessions(maxAgeDays = 30) {
    try {
        const files = fs.readdirSync(SESSIONS_DIR);
        const now = Date.now();
        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
        
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const filePath = path.join(SESSIONS_DIR, file);
                const stats = fs.statSync(filePath);
                
                if (now - stats.mtime.getTime() > maxAgeMs) {
                    fs.unlinkSync(filePath);
                    console.log(`Sessão antiga removida: ${file}`);
                }
            }
        });
    } catch (error) {
        console.error('Erro ao limpar sessões antigas:', (error as Error).message);
    }
}
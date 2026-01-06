import fs from 'fs';
import path from 'path';

const SESSIONS_DIR = path.resolve(process.cwd(), 'sessions');

export function loadSession(id: string): string[] {
    const file = path.join(SESSIONS_DIR, `${id}.json`);
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function saveSession(id: string, history: string[]) {
    if (!fs.existsSync(SESSIONS_DIR)) {
        fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
    const file = path.join(SESSIONS_DIR, `${id}.json`);
    fs.writeFileSync(file, JSON.stringify(history, null, 2));
}

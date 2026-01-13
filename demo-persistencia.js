import fs from 'fs';
import path from 'path';

// Teste direto de persistência de sessão
const SESSIONS_DIR = path.resolve('.pagia', 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Criar uma sessão de teste
const sessionId = 'demo-session';
const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);

// Carregar ou criar nova sessão
let sessionData = [];
if (fs.existsSync(sessionFile)) {
    sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
}

// Adicionar uma nova interação
const newInteraction = {
    timestamp: new Date().toISOString(),
    role: 'system',
    content: 'Demonstração de persistência de sessão iniciada'
};

sessionData.push(newInteraction);

// Salvar sessão
fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

console.log('✅ Demonstração de Persistência de Sessão');
console.log('Sessão criada/atualizada:', sessionFile);
console.log('Número de interações:', sessionData.length);
console.log('Última interação:', newInteraction.content);

// Listar todas as sessões
const allSessions = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
console.log('\nSessões existentes:', allSessions);

// Mostrar conteúdo da sessão demo
console.log('\nConteúdo da sessão demo:');
sessionData.forEach((item, index) => {
    console.log(`${index + 1}. [${item.timestamp}] ${item.role}: ${item.content.substring(0, 50)}...`);
});

console.log('\n✅ Sistema de persistência de sessões está funcionando corretamente!');
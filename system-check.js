import fs from 'fs';
import path from 'path';

// Criar estrutura de diretórios do PAGIA
const PAGIA_ROOT = '.pagia';
const SESSIONS_DIR = path.join(PAGIA_ROOT, 'sessions');
const LOGS_DIR = path.join(PAGIA_ROOT, 'logs');

// Criar diretórios se não existirem
[SESSIONS_DIR, LOGS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Função para registrar logs
function logMessage(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;
    const logFile = path.join(LOGS_DIR, `pagia-${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFileSync(logFile, logEntry);
    console.log(logEntry.trim());
}

logMessage('INFO', 'PAGIA Terminal - Sistema de Persistência Iniciado');

// Testar funcionalidades básicas
try {
    // Testar escrita de sessão
    const testSession = path.join(SESSIONS_DIR, 'test-session.json');
    const testData = ['Teste de persistência iniciado'];
    
    fs.writeFileSync(testSession, JSON.stringify(testData, null, 2));
    logMessage('INFO', 'Teste de escrita de sessão: SUCESSO');
    
    // Testar leitura de sessão
    const readData = JSON.parse(fs.readFileSync(testSession, 'utf8'));
    logMessage('INFO', `Teste de leitura de sessão: ${readData.length} itens`);
    
    // Testar variáveis de ambiente
    import('dotenv/config').then(dotenv => {
        if (process.env.GEMINI_API_KEY) {
            logMessage('INFO', 'API Key configurada: SIM');
        } else {
            logMessage('WARN', 'API Key configurada: NÃO - funcionalidade de IA limitada');
        }
    }).catch(err => {
        logMessage('ERROR', `Erro ao carregar dotenv: ${err.message}`);
    });
    
    logMessage('INFO', 'Sistema de persistência pronto para uso');
    logMessage('INFO', 'Execute: node pagia-terminal.js para iniciar o terminal interativo');
    
} catch (error) {
    logMessage('ERROR', `Erro no sistema de persistência: ${error.message}`);
    process.exit(1);
}
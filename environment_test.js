// Teste de ambiente para verificar se o sistema está funcionando
const fs = require('fs');

// Gravar diretamente em um arquivo para verificar se o sistema está funcionando
const logMessage = `Teste de ambiente realizado em: ${new Date().toISOString()}\n`;

try {
  fs.appendFileSync('environment_test_log.txt', logMessage);
  console.log('Log gravado com sucesso');
} catch (error) {
  fs.appendFileSync('environment_test_log.txt', `Erro: ${error.message}\n`);
  console.error('Erro ao gravar log:', error.message);
}
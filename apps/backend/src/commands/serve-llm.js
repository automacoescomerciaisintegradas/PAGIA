import { Command } from 'commander';
import { LLMGatewayServer } from '../llm-gateway/server.js';
import { logger } from '../utils/logger.js';
export const serveLlmCommand = new Command('serve-llm')
    .description('Inicia o servidor middleware de gateway LLM')
    .option('-p, --port <number>', 'Porta para o servidor', '3000')
    .action(async (options) => {
    try {
        const port = parseInt(options.port, 10);
        logger.info(`Iniciando PAGIA LLM Gateway na porta ${port}...`);
        const server = new LLMGatewayServer();
        server.start(port);
        // Keep process alive handled by express listen
    }
    catch (error) {
        logger.error('Falha ao iniciar o servidor:', error.message);
        process.exit(1);
    }
});
//# sourceMappingURL=serve-llm.js.map
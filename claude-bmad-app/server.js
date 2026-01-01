import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

app.use(express.static('public'));

// Gerenciador de Estado do BMAD v4
let projectState = {
    currentLayout: 'default',
    pages: [
        { id: 'index', name: 'Home', content: '<h1>Bem-vindo ao App Autoeditável</h1><p>Converse com a IA para mudar tudo aqui.</p>' }
    ],
    styles: {
        primaryColor: '#00ccff',
        backgroundColor: '#0f172a'
    }
};

io.on('connection', (socket) => {
    console.log('🚀 Cliente conectado:', socket.id);

    // Enviar estado inicial
    socket.emit('state-update', projectState);

    socket.on('chat-message', async (message) => {
        console.log('💬 Mensagem recebida:', message);

        try {
            // Invocando o Agente Claude via SDK
            const response = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                system: "Você é um Agente BMAD v4 de desenvolvimento em tempo real. Sua tarefa é analisar o pedido do usuário e retornar um objeto JSON que atualiza o estado do app. \nEstrutura esperada: \n{\n  \"thinking\": \"Seu raciocínio aqui\",\n  \"update\": {\n    \"content\": \"Novo HTML\",\n    \"styles\": { \"primaryColor\": \"#xxxxxx\" }\n  }\n}\nRetorne APENAS o JSON.",
                messages: [{ role: "user", content: message }],
            });

            const responseText = response.content[0].text;
            const data = JSON.parse(responseText);

            // Atualizar estado e propagar via Socket.io
            if (data.update) {
                projectState.pages[0].content = data.update.content || projectState.pages[0].content;
                projectState.styles = { ...projectState.styles, ...data.update.styles };

                io.emit('state-update', projectState);
                io.emit('agent-thinking', data.thinking);
            }
        } catch (error) {
            console.error('❌ Erro no Agente:', error);
            socket.emit('error', 'Ocorreu um erro ao processar sua solicitação.');
        }
    });
});

const PORT = 3005;
httpServer.listen(PORT, () => {
    console.log(`\n🌌 Servidor BMAD v4 rodando em http://localhost:${PORT}`);
});

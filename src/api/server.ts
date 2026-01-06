import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1', chatRouter);

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'PAGIA API Gateway' });
});

export function startServer() {
    app.listen(PORT, () => {
        console.log(`PAGIA API Gateway running on http://localhost:${PORT}`);
        console.log(`OpenAI-compatible endpoint: http://localhost:${PORT}/api/v1/chat/completions`);
    });
}

// Allow direct execution
// Allow direct execution
// Use a more robust check for tsx execution or just run it since it is the entry point for the 'api' script
startServer();

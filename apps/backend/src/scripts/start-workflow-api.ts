#!/usr/bin/env node
/**
 * PAGIA - Workflow API Server Starter
 * Inicia o servidor de API para workflows
 */

import { startWorkflowServer } from '../api/workflow-server.js';

const PORT = parseInt(process.env.WORKFLOW_API_PORT || '3001', 10);

startWorkflowServer(PORT).then(() => {
    console.log('Pressione Ctrl+C para parar o servidor.\n');
});

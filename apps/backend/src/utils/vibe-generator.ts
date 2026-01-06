import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { getConfigManager } from '../core/config-manager.js';
import { VIBE_TEMPLATE } from '../templates/vibe-template.js';
import { logger } from './logger.js';

export interface VibeGeneratorOptions {
    projectName: string;
    projectRoot?: string;
    vibe?: string; // Natural language description
}

export async function generateVibeProject(options: VibeGeneratorOptions) {
    const { projectName, projectRoot = process.cwd(), vibe } = options;
    const vibeDir = join(projectRoot, projectName);

    if (!existsSync(vibeDir)) mkdirSync(vibeDir, { recursive: true });
    if (!existsSync(join(vibeDir, 'src'))) mkdirSync(join(vibeDir, 'src'), { recursive: true });

    // Injeção Inteligente de Segredos
    const configManager = getConfigManager();
    const config = configManager.load();
    let envContent = '';

    if (config && config.aiProvider && config.aiProvider.apiKey) {
        const provider = config.aiProvider.type.toUpperCase();
        const apiKey = config.aiProvider.apiKey;
        envContent = `${provider}_API_KEY=${apiKey}\nCLOUDFLARE_ACCOUNT_ID=${process.env.CLOUDFLARE_ACCOUNT_ID || ''}\n`;
    }

    // Gerar arquivos do boilerplate a partir do template
    for (const [filename, content] of Object.entries(VIBE_TEMPLATE)) {
        const filePath = join(vibeDir, filename);
        const fileDir = join(vibeDir, filename.substring(0, filename.lastIndexOf('/')));

        if (filename.includes('/') && !existsSync(fileDir)) {
            mkdirSync(fileDir, { recursive: true });
        }

        let finalContent = typeof content === 'function' ? content(projectName) : content;

        if (filename === '.env' && envContent) {
            finalContent = envContent;
        }

        writeFileSync(filePath, finalContent, 'utf-8');
    }

    // If a vibe description is provided, we could potentially use an AI service 
    // to customize the generated code, but for now we just save it as a reference
    if (vibe) {
        const vibeInfo = {
            description: vibe,
            generatedAt: new Date().toISOString(),
            status: 'initial'
        };
        writeFileSync(join(vibeDir, '.vibe.json'), JSON.stringify(vibeInfo, null, 2), 'utf-8');
    }

    // Ensure .env exists
    if (!existsSync(join(vibeDir, '.env'))) {
        writeFileSync(join(vibeDir, '.env'), envContent || '# AI API Keys\n', 'utf-8');
    }

    return {
        path: vibeDir,
        success: true
    };
}

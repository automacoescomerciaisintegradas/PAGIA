import { createPrompt } from './ui/prompt.js';
import { loadSession, saveSession } from './session/store.js';
import { runGemini } from './gemini/runner.js';
import { getSkill, listSkills } from './skills/index.js';
import { runSkill } from './engine/skill-runner.js';

const args = process.argv;
const command = args[2];
const subCommand = args[3];

if (command === 'skill' && subCommand === 'list') {
    console.log('Available Skills:');
    listSkills().forEach(skill => {
        console.log(`- ${skill.name}: ${skill.description}`);
    });
} else if (command === 'skill' && subCommand === 'run') {
    // Skill Execution Mode
    const skillName = args[4];
    const promptIndex = args.indexOf('--prompt');
    const sessionIndex = args.indexOf('--session-id');

    const input =
        promptIndex !== -1
            ? args[promptIndex + 1]
            : '';

    const sessionId =
        sessionIndex !== -1
            ? args[sessionIndex + 1]
            : 'default';

    const history = loadSession(sessionId);

    try {
        const skill = getSkill(skillName);
        const result = await runSkill(skill, {
            sessionId,
            history,
            input,
        });
        console.log(result);
    } catch (error: any) {
        console.error(`Error running skill: ${error.message}`);
        process.exitCode = 1;
    }

} else if (command === 'context') {
    // Context Curation Mode
    const operation = args[3] || 'help';

    if (operation === 'build-tree') {
        const sourceDir = args[4] || '.';
        const patterns = args.slice(5); // Additional patterns can be passed

        try {
            const skill = getSkill('context-curation');
            const result = await runSkill(skill, {
                sessionId: 'context-session',
                history: [],
                input: `build-tree --sourceDir ${sourceDir} --patterns ${patterns.join(' ') || '**/*.md **/*.txt **/*.ts **/*.js'}`
            });
            console.log(result);
        } catch (error: any) {
            console.error(`Error building context tree: ${error.message}`);
            process.exitCode = 1;
        }
    } else if (operation === 'search') {
        const query = args.slice(4).join(' '); // Query can contain spaces

        if (!query) {
            console.log('Usage: pagia context search <query>');
            process.exitCode = 1;
        } else {
            try {
                const skill = getSkill('context-curation');
                const result = await runSkill(skill, {
                    sessionId: 'context-session',
                    history: [],
                    input: `search --query ${query}`
                });
                console.log(result);
            } catch (error: any) {
                console.error(`Error searching context: ${error.message}`);
                process.exitCode = 1;
            }
        }
    } else if (operation === 'add-document') {
        const filePath = args[4];
        const category = args[5] || 'documentation';

        if (!filePath) {
            console.log('Usage: pagia context add-document <filePath> [category]');
            process.exitCode = 1;
        } else {
            try {
                const skill = getSkill('context-curation');
                const result = await runSkill(skill, {
                    sessionId: 'context-session',
                    history: [],
                    input: `add-document --filePath ${filePath} --category ${category}`
                });
                console.log(result);
            } catch (error: any) {
                console.error(`Error adding document: ${error.message}`);
                process.exitCode = 1;
            }
        }
    } else if (operation === 'semantic-search') {
        const query = args.slice(4).join(' '); // Query can contain spaces

        if (!query) {
            console.log('Usage: pagia context semantic-search <query>');
            process.exitCode = 1;
        } else {
            try {
                const skill = getSkill('context-curation');
                const result = await runSkill(skill, {
                    sessionId: 'context-session',
                    history: [],
                    input: `semantic-search --query ${query}`
                });
                console.log(result);
            } catch (error: any) {
                console.error(`Error semantic searching context: ${error.message}`);
                process.exitCode = 1;
            }
        }
    } else if (operation === 'add-document') {
        const filePath = args[4];
        const category = args[5] || 'documentation';
        const tags = args[6] || ''; // Tags can be comma-separated

        if (!filePath) {
            console.log('Usage: pagia context add-document <filePath> [category] [tags]');
            console.log('Example: pagia context add-document doc.md documentation "important,api"');
            process.exitCode = 1;
        } else {
            try {
                const skill = getSkill('context-curation');
                const result = await runSkill(skill, {
                    sessionId: 'context-session',
                    history: [],
                    input: `add-document --filePath ${filePath} --category ${category} --tags ${tags}`
                });
                console.log(result);
            } catch (error: any) {
                console.error(`Error adding document: ${error.message}`);
                process.exitCode = 1;
            }
        }
    } else if (operation === 'filter') {
        const type = args[4] || undefined;
        const tag = args[5] || undefined;
        const priority = args[6] || undefined;

        try {
            const skill = getSkill('context-curation');
            let input = 'filter';
            if (type) input += ` --type ${type}`;
            if (tag) input += ` --tag ${tag}`;
            if (priority) input += ` --priority ${priority}`;

            const result = await runSkill(skill, {
                sessionId: 'context-session',
                history: [],
                input: input
            });
            console.log(result);
        } catch (error: any) {
            console.error(`Error filtering context: ${error.message}`);
            process.exitCode = 1;
        }
    } else if (operation === 'stats') {
        try {
            const skill = getSkill('context-curation');
            const result = await runSkill(skill, {
                sessionId: 'context-session',
                history: [],
                input: 'stats'
            });
            console.log(result);
        } catch (error: any) {
            console.error(`Error getting context stats: ${error.message}`);
            process.exitCode = 1;
        }
    } else if (operation === 'help') {
        console.log(`
Context Curation Commands:
  pagia context build-tree [directory] [patterns...]    Builds a context tree from files
  pagia context search <query>                         Traditional keyword search
  pagia context semantic-search <query>                Semantic search using embeddings
  pagia context add-document <filePath> [category] [tags]  Adds a document to the context tree
  pagia context filter [type] [tag] [priority]         Filter context by criteria
  pagia context stats                                  Show context tree statistics
  pagia context help                                   Shows this help message

Examples:
  pagia context build-tree . "**/*.md" "**/*.ts"
  pagia context search "authentication"
  pagia context semantic-search "user management"
  pagia context add-document readme.md documentation "important,api"
  pagia context filter code
  pagia context filter file important 2
  pagia context stats
        `);
    } else {
        console.log(`Unknown context operation: ${operation}. Use 'pagia context help' for available commands.`);
        process.exitCode = 1;
    }
} else if (args[2] === 'chat' || !args[2] || args[2].startsWith('--')) {
    // Chat Mode with Enhanced Persistence
    const sessionId =
        args.includes('--session-id')
            ? args[args.indexOf('--session-id') + 1]
            : 'default';

    let history = loadSession(sessionId);

    // Enhanced console output for Windows compatibility
    process.stdout.write(`┌─ PAGIA AI Persistente ─────────────────┐\n`);
    process.stdout.write(`│ Sessão: ${sessionId.padEnd(32)}│\n`);
    process.stdout.write(`│ Digite sua mensagem (Ctrl+C para sair) │\n`);
    process.stdout.write(`└─────────────────────────────────────────┘\n`);

    // Show session info
    if (history.length > 0) {
        process.stdout.write(`[${history.length} interações anteriores carregadas]\n\n`);
    }

    createPrompt(async (input) => {
        if (!input) return;

        // Handle special commands
        if (input.toLowerCase() === 'ajuda' || input.toLowerCase() === 'help') {
            process.stdout.write(`
Comandos especiais:
  ajuda/help    - Mostra esta ajuda
  historico     - Mostra histórico da sessão
  sessoes       - Lista sessões disponíveis
  limpar        - Limpa histórico da sessão
  sair/exit     - Sai do chat
\n`);
            return;
        }

        if (input.toLowerCase() === 'historico') {
            if (history.length === 0) {
                process.stdout.write('Nenhuma interação registrada.\n');
            } else {
                process.stdout.write('\n--- Histórico da Sessão ---\n');
                history.forEach((entry, index) => {
                    process.stdout.write(`${index + 1}. ${entry.substring(0, 60)}${entry.length > 60 ? '...' : ''}\n`);
                });
                process.stdout.write('---------------------------\n\n');
            }
            return;
        }

        if (input.toLowerCase() === 'limpar') {
            history = [];
            saveSession(sessionId, history);
            process.stdout.write('✅ Histórico da sessão limpo.\n');
            return;
        }

        // Add user input to history
        history.push(`Usuário: ${input}`);

        // Create prompt with full context
        const prompt = history.join('\n') +
            '\nAssistente: responda sempre em português do Brasil e mantenha contexto das mensagens anteriores.\n';

        try {
            process.stdout.write('PAGIA: ');
            const response = await runGemini(prompt);
            process.stdout.write(response + '\n');

            history.push(`Assistente: ${response}`);
            saveSession(sessionId, history);
        } catch (error) {
            const errorMessage = `Erro ao executar Gemini: ${(error as Error).message}`;
            process.stdout.write(errorMessage + '\n');
            history.push(`Erro: ${errorMessage}`);
            saveSession(sessionId, history);
        }
    });
}

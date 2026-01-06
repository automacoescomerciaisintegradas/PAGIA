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

} else if (args[2] === 'chat' || !args[2] || args[2].startsWith('--')) {
    // Chat Mode
    const sessionId =
        args.includes('--session-id')
            ? args[args.indexOf('--session-id') + 1]
            : 'default';

    let history = loadSession(sessionId);

    console.log(`┌─ PAGIA AI ───────────────────────────────┐`);
    console.log(`│ Sessão: ${sessionId.padEnd(29)}│`);
    console.log(`│ Digite sua mensagem (Ctrl+C para sair)   │`);
    console.log(`└──────────────────────────────────────────┘`);

    createPrompt(async (input) => {
        if (!input) return;

        history.push(`Usuário: ${input}`);

        const prompt = history.join('\n') +
            '\nAssistente: responda sempre em português do Brasil.\n';

        try {
            const response = await runGemini(prompt);
            console.log(response);

            history.push(`Assistente: ${response}`);
            saveSession(sessionId, history);
        } catch (error) {
            console.error("Erro ao executar Gemini CLI:", error);
        }
    });
}

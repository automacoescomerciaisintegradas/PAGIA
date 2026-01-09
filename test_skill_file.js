// Teste para verificar se a função de contexto está funcionando e gravar resultados em arquivo
import { getSkill } from './src/skills/index.js';
import fs from 'fs/promises';

async function testSkillAndWriteToFile() {
  try {
    const skill = getSkill('context-curation');
    const skillInfo = `Skill found: ${skill.name}\nDescription: ${skill.description}\n\n`;
    
    // Test a simple operation
    const result = await skill.run({
      sessionId: 'test',
      history: [],
      input: 'stats'
    });
    
    const resultText = `Result: ${result}\n`;
    
    // Write to file
    await fs.appendFile('skill_test_results.txt', skillInfo + resultText);
    
    console.log('Test results written to skill_test_results.txt');
  } catch (error) {
    const errorText = `Error: ${error.message}\nStack: ${error.stack}\n`;
    await fs.appendFile('skill_test_results.txt', errorText);
    console.error('Error written to skill_test_results.txt');
  }
}

testSkillAndWriteToFile();
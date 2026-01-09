// Teste simples para verificar se a função de contexto está sendo chamada
import { getSkill } from './src/skills/index.js';

async function testSkill() {
  try {
    const skill = getSkill('context-curation');
    console.log('Skill found:', skill.name);
    console.log('Description:', skill.description);
    
    // Test a simple operation
    const result = await skill.run({
      sessionId: 'test',
      history: [],
      input: 'stats'
    });
    
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSkill();
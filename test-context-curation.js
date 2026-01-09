#!/usr/bin/env node

import { contextCuration } from './src/skills/context-curation.js';

async function testContextCuration() {
  console.log('Testing Context Curation Skill...\n');
  
  // Test building context tree
  console.log('1. Building context tree...');
  const buildResult = await contextCuration.run({ 
    sessionId: 'test-session', 
    history: [], 
    input: 'build-tree --sourceDir . --patterns **/*.ts **/*.js **/*.md' 
  });
  console.log(buildResult + '\n');
  
  // Test searching in context tree
  console.log('2. Searching in context tree...');
  const searchResult = await contextCuration.run({ 
    sessionId: 'test-session', 
    history: [], 
    input: 'search --query "context"' 
  });
  console.log(searchResult + '\n');
  
  console.log('Context curation tests completed!');
}

testContextCuration().catch(console.error);
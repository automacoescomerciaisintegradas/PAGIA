const { contextCuration } = require('./dist/cli');

async function testContextCuration() {
  console.log('Testing Context Curation Skill...\n');
  
  try {
    // Test building context tree
    console.log('1. Building context tree...');
    const buildResult = await contextCuration.run({ 
      sessionId: 'test-session', 
      history: [], 
      input: 'build-tree --sourceDir .' 
    });
    console.log('Build result:', buildResult);
  } catch (error) {
    console.error('Error during build-tree operation:', error);
  }
  
  console.log('\nContext curation test completed!');
}

testContextCuration().catch(console.error);
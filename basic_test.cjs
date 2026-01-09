const fs = require('fs');

console.log('Starting test...');

try {
  fs.writeFileSync('test_result.txt', 'Test successful!');
  console.log('Test file created successfully');
} catch (error) {
  console.error('Error occurred:', error.message);
}

console.log('Test completed');
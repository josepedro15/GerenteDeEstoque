const crypto = require('crypto');

// Generate valid UUIDs
const userId = crypto.randomUUID();
const sessionId = crypto.randomUUID();
const baseUrl = 'http://localhost:3000/api/chat';

async function runTests() {
  console.log('Starting verification tests...');
  console.log(`User: ${userId}, Session: ${sessionId}`);

  // Test 1: Simple Message
  console.log('\n--- Test 1: Simple Message ---');
  try {
    const res1 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Olá, tudo bem?' }],
        userId,
        sessionId
      })
    });

    if (res1.status !== 200) {
      const txt = await res1.text();
      console.error('Test 1 Failed: Status', res1.status, txt);
      process.exit(1);
    }

    // Read stream briefly
    const text1 = await res1.text();
    console.log('Test 1 Response (partial):', text1.substring(0, 100));
    console.log('Test 1 HTTP Status OK');

  } catch (e) {
    console.error('Test 1 Exception:', e);
    process.exit(1);
  }

  // Test 2: Tool Usage
  console.log('\n--- Test 2: Tool Usage (Stock Check) ---');
  try {
    const res2 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
           { role: 'user', content: 'Qual o estoque de cimento?' }
        ],
        userId,
        sessionId
      })
    });

    if (res2.status !== 200) {
      const txt = await res2.text();
      console.error('Test 2 Failed: Status', res2.status, txt);
      process.exit(1);
    }

    const text2 = await res2.text();
    console.log('Test 2 Response (partial):', text2.substring(0, 100));
    console.log('Test 2 HTTP Status OK');

  } catch (e) {
    console.error('Test 2 Exception:', e);
    process.exit(1);
  }

  // Test 3: Follow-up with Dirty History
  console.log('\n--- Test 3: Follow-up with Dirty History ---');
  try {
    const res3 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
            { role: 'user', content: 'Qual o estoque?' },
            { role: 'assistant', content: 'O estoque é 100.', somethingElse: 'metadata' }, // Dirty extra field
            { role: 'user', content: '', someMeta: 123 }, // Empty content (should be filtered out)
            { role: 'user', content: 'Obrigado' }
        ],
        userId,
        sessionId
      })
    });

    if (res3.status !== 200) {
      const txt = await res3.text();
      console.error('Test 3 Failed: Status', res3.status, txt);
      process.exit(1);
    }

    const text3 = await res3.text();
    console.log('Test 3 Response (partial):', text3.substring(0, 100));
    console.log('Test 3 HTTP Status OK');

  } catch (e) {
    console.error('Test 3 Exception:', e);
    process.exit(1);
  }

  console.log('\nAll verification tests passed successfully.');
}

runTests();

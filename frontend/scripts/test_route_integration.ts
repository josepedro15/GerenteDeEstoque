
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testEndpoint() {
    console.log("Testing POST http://localhost:3000/api/chat ...");

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Olá, teste de conexão.' }],
                userId: 'test-user',
                sessionId: 'test-session'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("Response headers:", response.headers.get('content-type'));

        // Read stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let text = "";

        while (!done) {
            const { value, done: doneReading } = await reader!.read();
            done = doneReading;
            const chunk = decoder.decode(value, { stream: true });
            text += chunk;
            process.stdout.write("."); // Progress dot
        }

        console.log("\n--- Full Response (Sample) ---");
        console.log(text.substring(0, 200) + "..."); // Show first 200 chars
        console.log("\n✅ API Integration Test Passed");

    } catch (error: any) {
        console.error("\n❌ API Test Failed:", error.message);
    }
}

testEndpoint();

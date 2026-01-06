import fetch from 'node-fetch';

async function testAPI() {
    console.log('🧪 Testando API do PAGIA running at http://localhost:3000/api/v1/chat/completions');

    const payload = {
        // Explicitly test GLM-4-Plus as requested
        model: 'GLM-4-Plus',
        messages: [
            { role: 'user', content: 'Responda com apenas uma palavra: Funciona?' }
        ]
    };

    try {
        const response = await fetch('http://localhost:3000/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data: any = await response.json();
        console.log('✅ Resposta da API (GLM-4):', data?.choices?.[0]?.message?.content);
    } catch (error: any) {
        console.error('❌ Falha no teste da API:', error.message);
    }
}

testAPI();


import { GoogleGenerativeAI } from "@google/generative-ai";

// Nova chave do projeto N8N-Drive-Gmail-Calendar (API ativada!)
const API_KEY = "AIzaSyCcZwzkrqgONWFkbTq6z1oS_plDyt3dW7w";

const genAI = new GoogleGenerativeAI(API_KEY);

async function main() {
    console.log(`🔑 Testing API Key: ${API_KEY.substring(0, 12)}...`);
    console.log('');

    const models = [
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
        "gemini-2.0-flash-exp"
    ];

    for (const modelName of models) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'Hello PAGIA!' in Portuguese");
            console.log(`✅ SUCCESS: "${result.response.text().trim()}"`);
            console.log('\n🎉 API KEY IS WORKING!');
            return;
        } catch (err: any) {
            console.log(`❌ ${err.message.substring(0, 60)}...`);
        }
    }

    console.log('\n❌ All models failed.');
}

main();

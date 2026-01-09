import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
const MODELS_FALLBACK = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-1.0-pro"
];
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
/**
 * Gera conteúdo com fallback automático de modelos Gemini
 */
export async function generateWithGemini(prompt) {
    let lastError = null;
    console.log(`Key loaded: ${process.env.GEMINI_API_KEY ? 'YES (' + process.env.GEMINI_API_KEY.substring(0, 5) + '...)' : 'NO'}`);
    for (const modelName of MODELS_FALLBACK) {
        try {
            console.log(`Attempting model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ]
            });
            return {
                model: modelName,
                text: result.response.text()
            };
        }
        catch (err) {
            lastError = err;
            console.error(`[Gemini] Falha no modelo ${modelName}:`, err.message);
        }
    }
    throw new Error(`Falha ao gerar conteúdo com Gemini. Modelos tentados: ${MODELS_FALLBACK.join(", ")}`);
}
async function main() {
    try {
        const response = await generateWithGemini("Crie um plano de projeto SaaS com agentes de IA");
        console.log("Modelo usado:", response.model);
        console.log(response.text.substring(0, 100) + "...");
    }
    catch (error) {
        console.error("Erro fatal:", error.message);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=test-fallback.js.map
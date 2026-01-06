import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateGemini(prompt: string, apiKey: string, modelName: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

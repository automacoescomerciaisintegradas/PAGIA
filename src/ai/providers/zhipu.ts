import OpenAI from 'openai';
import jwt from 'jsonwebtoken';

// Helper to generate Zhipu JWT (if needed, but v4 often supports direct key with SDKs handling it,
// however standard OpenAI SDK doesn't know how to sign Zhipu keys.
// For Zhipu V4, we can often use the API key directly if the client supports it, 
// OR we construct the JWT.
// Let's implement JWT generation to be safe as Zhipu keys are typically id.secret
// and standard Authorization: Bearer <token> expects the signed JWT, NOT the raw key.

function generateZhipuToken(apiKey: string): string {
    const [id, secret] = apiKey.split('.');
    if (!id || !secret) return apiKey; // Return raw if not in id.secret format

    const payload = {
        api_key: id,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
        timestamp: Math.floor(Date.now() / 1000),
    };

    // Zhipu requires header with sign_type: "SIGN"
    return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

export async function generateZhipu(prompt: string, apiKey: string, modelName: string): Promise<string> {
    // Use OpenAI client pointing to Zhipu endpoint
    // Note: Zhipu V4 is OpenAI compatible

    const token = generateZhipuToken(apiKey);

    const client = new OpenAI({
        apiKey: token,
        baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
    });

    const completion = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: modelName,
    });

    return completion.choices[0].message?.content || '';
}

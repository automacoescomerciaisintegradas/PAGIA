
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from 'dotenv';
import chalk from 'chalk';

config();

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY in .env");
        return;
    }
    console.log(`Testing Key: ${apiKey.substring(0, 10)}...`);

    const genAI = new GoogleGenerativeAI(apiKey);

    // User requested model
    const models = ["gemini-1.5-pro-latest", "gemini-1.5-flash", "gemini-pro"];

    for (const m of models) {
        console.log(chalk.yellow(`\nTesting model: ${m}`));
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hello. Reply 'OK'.");
            console.log(chalk.green(`✅ Success! Response: ${result.response.text()}`));
            return; // Exit on first success
        } catch (error: any) {
            console.error(chalk.red(`❌ Error: ${error.message}`));
        }
    }
}

run();

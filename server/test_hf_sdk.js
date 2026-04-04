require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

async function test() {
    const token = process.env.HF_TOKEN;
    if (!token) { console.error('Set HF_TOKEN in server/.env'); return; }
    const hf = new HfInference(token);
    try {
        console.log("Testing Mistral...");
        const response = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.3',
            inputs: 'What is the stock market?'
        });
        console.log("Success:", response);
    } catch (e) {
        console.error("Crash:", e);
    }
}
test();

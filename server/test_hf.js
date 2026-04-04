require('dotenv').config();
const fetch = require('node-fetch');

async function test() {
    const token = process.env.HF_TOKEN;
    if (!token) { console.error('Set HF_TOKEN in server/.env'); return; }
    try {
        console.log("Testing FinBERT...");
        const res = await fetch('https://router.huggingface.co/hf-inference/models/ProsusAI/finbert', {
            method: 'POST',
            body: JSON.stringify({inputs: ["Apple is amazing"]}),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);

        console.log("\nTesting LLM...");
        const res2 = await fetch('https://router.huggingface.co/hf-inference/v1/chat/completions', {
            method: 'POST',
            body: JSON.stringify({
                model: "HuggingFaceH4/zephyr-7b-beta",
                messages: [{role: "user", content: "Analyze the financial market"}]
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const text2 = await res2.text();
        console.log("Status:", res2.status);
        console.log("Response:", text2);
    } catch (e) {
        console.error("Crash:", e);
    }
}
test();

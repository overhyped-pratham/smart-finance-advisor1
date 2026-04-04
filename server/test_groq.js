require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    try {
        console.log("Testing Groq AI (Llama-3.1-8b)...");
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Explain why fast inference is critical for reasoning models in Finance." }],
            model: "llama-3.1-8b-instant",
        });

        console.log("\n--- AI Response ---");
        console.log(completion.choices[0].message.content);
        console.log("-------------------\n");
        console.log("✅ Groq integration is working perfectly!");
    } catch (err) {
        console.error("❌ Groq Test Failed:", err.message);
        console.log("Make sure you have GROQ_API_KEY set in server/.env");
    }
}

testGroq();

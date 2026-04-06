import Groq from 'groq-sdk';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { prompt, max_tokens, token, hfToken: bodyHfToken, geminiToken: bodyGeminiToken } = req.body;
    const groqToken = token || process.env.GROQ_API_KEY;
    const hfToken = bodyHfToken || process.env.HF_TOKEN;
    const geminiToken = bodyGeminiToken || process.env.GEMINI_API_KEY;

    if (!prompt) return res.status(400).json({ error: 'Please provide a prompt.' });

    const errors = {};
    let attempted = false;

    // 1. Try Groq
    if (groqToken) {
        attempted = true;
        try {
            const client = new Groq({ apiKey: groqToken });
            const completion = await client.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "You are an expert financial analyst. Provide a concise, highly analytical response based on market data." },
                    { role: "user", content: prompt }
                ],
                max_tokens: max_tokens || 500,
            });
            return res.json({ prompt, response: completion.choices[0].message.content.trim(), provider: 'groq' });
        } catch (err) {
            console.error('Groq Error:', err.message);
            errors.groq = err.message;
        }
    }

    // 2. Try Hugging Face
    if (hfToken) {
        attempted = true;
        try {
            const hfRes = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs: `<s>[INST] You are an expert financial analyst. Provide a concise, highly analytical response based on market data.\n\n${prompt} [/INST]`, parameters: { max_new_tokens: max_tokens || 500 } })
            });
            if (!hfRes.ok) throw new Error(await hfRes.text());
            const data = await hfRes.json();
            const textResponse = data[0]?.generated_text?.split('[/INST]')[1]?.trim();
            if (textResponse) {
                return res.json({ prompt, response: textResponse, provider: 'huggingface' });
            } else {
                throw new Error("Invalid format from Hugging Face");
            }
        } catch (err) {
            console.error('HF Error:', err.message);
            errors.huggingface = err.message;
        }
    }

    // 3. Try Gemini API
    if (geminiToken) {
        attempted = true;
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "You are an expert financial analyst. Provide a concise, highly analytical response based on market data.\n\n" + prompt }]
                    }]
                })
            });
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
                return res.json({ prompt, response: textResponse.trim(), provider: 'gemini' });
            } else {
                throw new Error("Invalid response structural format from Gemini");
            }
        } catch (err) {
            console.error('Gemini Error:', err.message);
            errors.gemini = err.message;
        }
    }

    if (!attempted) {
        return res.status(400).json({ error: 'No API keys were provided or configured for Groq, HuggingFace, or Gemini.' });
    }

    res.status(500).json({ 
        error: 'All configured AI providers failed. Check your API keys.',
        details: errors
    });
}

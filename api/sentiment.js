import Groq from 'groq-sdk';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { texts, token, hfToken: bodyHfToken } = req.body;
    const groqToken = token || process.env.GROQ_API_KEY;
    const hfToken = bodyHfToken || process.env.HF_TOKEN;

    if (!texts || !Array.isArray(texts)) return res.status(400).json({ error: 'Invalid input' });

    // 1. Try Groq
    if (groqToken) {
        try {
            const client = new Groq({ apiKey: groqToken });
            const completion = await client.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "Analyze the sentiment of the following financial texts. Return a JSON array of objects with 'sentiment' (positive, negative, or neutral) and 'confidence' (0-100) for each text." },
                    { role: "user", content: JSON.stringify(texts) }
                ],
                response_format: { type: "json_object" }
            });
            const data = JSON.parse(completion.choices[0].message.content);
            const results = texts.map((text, idx) => {
                const item = (data.results || data)[idx] || { sentiment: 'neutral', confidence: 50 };
                return { text, sentiment: item.sentiment.toLowerCase(), confidence: item.confidence };
            });
            return res.json({ results, provider: 'groq' });
        } catch (err) {
            console.error('Groq Error:', err.message);
        }
    }

    // 2. Try Hugging Face
    if (hfToken) {
        try {
            const results = [];
            for (const text of texts) {
                const hfRes = await fetch('https://api-inference.huggingface.co/models/ProsusAI/finbert', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inputs: text })
                });
                if (!hfRes.ok) throw new Error(await hfRes.text());
                const data = await hfRes.json();
                const top = data[0]?.reduce((a, b) => a.score > b.score ? a : b, data[0][0]);
                results.push({ text, sentiment: top?.label?.toLowerCase() || 'neutral', confidence: Math.round((top?.score || 0.5) * 100) });
            }
            return res.json({ results, provider: 'huggingface' });
        } catch (err) {
            console.error('HF Error:', err.message);
        }
    }

    res.status(500).json({ error: 'Both AI providers failed or are unconfigured.' });
}

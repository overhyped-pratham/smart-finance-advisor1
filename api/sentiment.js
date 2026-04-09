import Groq from 'groq-sdk';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { texts, token, hfToken: bodyHfToken, geminiToken: bodyGeminiToken } = req.body;
    const groqToken = token || process.env.GROQ_API_KEY;
    const hfToken = bodyHfToken || process.env.HF_TOKEN;
    const geminiToken = bodyGeminiToken || process.env.GEMINI_API_KEY;

    if (!texts || !Array.isArray(texts)) return res.status(400).json({ error: 'Invalid input' });

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
                    { role: "system", content: "Analyze the sentiment of the following financial texts. Return a JSON array of objects with 'sentiment' (positive, negative, or neutral) and 'confidence' (0-100) for each text." },
                    { role: "user", content: JSON.stringify(texts) }
                ],
                response_format: { type: "json_object" }
            });
            const data = JSON.parse(completion.choices[0].message.content);
            const arr = Array.isArray(data) ? data : (data.results || data.sentiments || data.analysis || [data]);
            const results = texts.map((text, idx) => {
                const item = arr[idx] || {};
                const sentiment = (item.sentiment || item.label || 'neutral').toString().toLowerCase();
                const confidence = item.confidence || item.score || 50;
                return { text, sentiment, confidence: typeof confidence === 'number' && confidence <= 1 ? Math.round(confidence * 100) : confidence };
            });
            return res.json({ results, provider: 'groq' });
        } catch (err) {
            console.error('Groq Error:', err.message);
            errors.groq = err.message;
        }
    }

    // 2. Try Hugging Face
    if (hfToken) {
        attempted = true;
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
                        parts: [{ text: "Analyze the sentiment of the following financial texts. Return STRICTLY a JSON array of objects with 'sentiment' (positive, negative, or neutral) and 'confidence' (0-100) for each text. Do not include markdown formatting.\n\nTexts: " + JSON.stringify(texts) }]
                    }],
                    generationConfig: { response_mime_type: "application/json" }
                })
            });
            if (!response.ok) throw new Error(await response.text());
            const responseData = await response.json();
            let textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
                const data = JSON.parse(textResponse);
                const results = texts.map((text, idx) => {
                    const item = (data.results || data)[idx] || { sentiment: 'neutral', confidence: 50 };
                    return { text, sentiment: item?.sentiment?.toLowerCase() || 'neutral', confidence: item?.confidence || 50 };
                });
                return res.json({ results, provider: 'gemini' });
            } else {
                throw new Error("Invalid response format from Gemini");
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

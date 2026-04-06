export default function handler(req, res) {
    res.json({ 
        status: 'ok', 
        message: 'Minimal API is working',
        env: {
            hasGroq: !!process.env.GROQ_API_KEY,
            hasHF: !!process.env.HF_TOKEN
        }
    });
}

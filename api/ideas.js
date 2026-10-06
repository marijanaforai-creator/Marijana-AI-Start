export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, audience, goal } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'topic is required' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'OPENAI_API_KEY nije podešen.' });

  const prompt = [
    'Generiši 10 konkretnih ideja na srpskom jeziku.',
    'Tema/oblast: ' + topic,
    'Ciljna grupa: ' + (audience || 'nije navedena'),
    'Cilj: ' + (goal || 'sadržaj'),
    'Vrati isključivo validan JSON: {"ideas":[{"title":"...","description":"..."}]}',
    'Ideje moraju biti praktične, različite i dovoljno konkretne da početnik može odmah da ih razvije.'
  ].join('\n');

  try {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY },
      body: JSON.stringify({ model: process.env.OPENAI_TEXT_MODEL || 'gpt-5.6', input: prompt })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'AI servis nije uspeo.' });

    const text = (data.output || []).flatMap(x => x.content || []).map(x => x.text || '').join('');
    const clean = text.replace(/\\`\\`\\`json|\\`\\`\\`/g, '').trim();
    return res.status(200).json(JSON.parse(clean));
  } catch (e) {
    return res.status(500).json({ error: 'Nije moguće obraditi odgovor AI servisa.' });
  }
}

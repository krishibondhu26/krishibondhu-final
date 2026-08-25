// পাথ হবে: api/weather.js
// Vercel Dashboard > Settings > Environment Variables এ OPENWEATHER_API_KEY বসাতে হবে।

export default async function handler(req, res) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'সার্ভারে OPENWEATHER_API_KEY সেট করা হয়নি' });
  }

  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat ও lon প্রয়োজন' });
  }

  try {
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=bn`
    );
    const data = await weatherRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

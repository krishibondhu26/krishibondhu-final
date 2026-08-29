export default async function handler(req, res) {
  const { district = 'Rangpur' } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OpenWeather API Key পাওয়া যায়নি।" });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${district},BD&units=metric&lang=bn&appid=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "আবহাওয়া তথ্য আনতে ব্যর্থ হয়েছে।" });
    }

    return res.status(200).json({
      name: data.name,
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed
    });
  } catch (error) {
    console.error("Weather API Error:", error);
    return res.status(500).json({ error: "সার্ভার এরর, আবার চেষ্টা করুন।" });
  }
}

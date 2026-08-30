export default async function handler(req, res) {
  // ===== ফিক্স: index.html /api/weather?lat=..&lon=.. আকারে কল করে (জেলার নাম না,
  // কোঅর্ডিনেট পাঠায়) — আগের কোড district প্যারামিটার আশা করছিল যা কখনো আসতই না।
  const { lat, lon } = req.query;

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OpenWeather API Key পাওয়া যায়নি।" });
  }
  if (!lat || !lon) {
    return res.status(400).json({ error: "lat ও lon প্যারামিটার দরকার।" });
  }

  try {
    // ===== ফিক্স: index.html data.list[...] (৩-ঘণ্টা ইন্টারভ্যালের forecast) পড়ে,
    // তাই current-weather endpoint-এর বদলে forecast endpoint কল করা হচ্ছে।
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=bn&appid=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "আবহাওয়া তথ্য আনতে ব্যর্থ হয়েছে।" });
    }

    // ===== ফিক্স: index.html সরাসরি data.list ব্যবহার করে, তাই OpenWeather-এর
    // রॉ ফরম্যাটটাই ফেরত পাঠানো হচ্ছে (নিজের বানানো ফ্ল্যাট অবজেক্ট না)।
    return res.status(200).json(data);
  } catch (error) {
    console.error("Weather API Error:", error);
    return res.status(500).json({ error: "সার্ভার এরর, আবার চেষ্টা করুন।" });
  }
}

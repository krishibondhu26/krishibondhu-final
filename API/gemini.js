// এই ফাইলটা GitHub repo-র রুটে "api" ফোল্ডার বানিয়ে তার ভেতরে রাখতে হবে।
// পাথ হবে: api/gemini.js
// Vercel নিজে থেকেই এটাকে /api/gemini নামে একটা এন্ডপয়েন্ট বানিয়ে দেবে।
// আসল Gemini key এখানে না লিখে Vercel Dashboard > Settings > Environment Variables এ
// GEMINI_API_KEY নামে বসাতে হবে — তাহলে key কখনো browser-এ যাবে না।
//
// এখন একাধিক ছবি (২-৩টা) একসাথে পাঠানো সমর্থন করে — accuracy বাড়ানোর জন্য।

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধু POST অনুমোদিত' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'সার্ভারে GEMINI_API_KEY সেট করা হয়নি' });
  }

  try {
    const { prompt, images, mimeType, imageBase64 } = req.body;

    // নতুন ফরম্যাট: images = [{base64, mimeType}, ...]
    // পুরনো ফরম্যাট: mimeType + imageBase64 (একটা মাত্র ছবি, backward compatible)
    const imageList = images && images.length > 0
      ? images
      : (imageBase64 ? [{ base64: imageBase64, mimeType: mimeType }] : []);

    const imageParts = imageList.map(img => ({
      inline_data: { mime_type: img.mimeType, data: img.base64 }
    }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              ...imageParts
            ]
          }]
        })
      }
    );

    const data = await geminiRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

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

    const imageList = images && images.length > 0
      ? images
      : (imageBase64 ? [{ base64: imageBase64, mimeType: mimeType || 'image/jpeg' }] : []);

    const imageParts = imageList
      .filter(img => img && img.base64)
      .map(img => ({
        inline_data: {
          mime_type: img.mimeType || 'image/jpeg',
          data: img.base64
        }
      }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
    return res.status(geminiRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

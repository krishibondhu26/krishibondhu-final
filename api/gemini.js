import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { images, cropName, category } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ error: "কোনো ছবি পাওয়া যায়নি।" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `তুমি একজন অভিজ্ঞ কৃষি বিশেষজ্ঞ। প্রদত্ত ছবি দেখে রোগ নির্ণয় করো। 
ফসল: ${cropName || "অজানা"}, ক্যাটাগরি: ${category || "মাঠ ফসল"}।
উত্তরটি শুধুমাত্র নিচের JSON কাঠামোতে দেবে:
{
  "diseaseName": "রোগের বাংলা নাম",
  "cropName": "ফসলের নাম",
  "severity": "danger",
  "severityLabel": "উচ্চ ঝুঁকি / মাঝারি ঝুঁকি / সুস্থ",
  "description": "লক্ষণ ও প্রতিকার সম্পর্কে বিস্তারিত বাংলা বিবরণ",
  "isHealthy": false,
  "medicines": [
    { "name": "ওষুধের নাম", "company": "কোম্পানি", "dosage": "ব্যবহারের মাত্রা" }
  ]
}`;

    const imageParts = images.map((base64Str) => {
      const cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, "");
      return {
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg",
        },
      };
    });

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();

    return res.status(200).json(JSON.parse(responseText));
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "এআই বিশ্লেষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।" });
  }
}

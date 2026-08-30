import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===== ফিক্স: Next.js/Vercel API route-এর ডিফল্ট body-size লিমিট মাত্র ১MB।
// একাধিক কম্প্রেসড ছবি (প্রতিটা ~২০০-৬০০KB) পাঠালে সহজেই এই ডিফল্ট লিমিট
// ক্রস হয়ে যায়, আর Next.js নিজেই একটা non-JSON error page ফেরত দেয় —
// এটাই "সার্ভার থেকে ভুল ফরম্যাটে উত্তর এসেছে" এররের মূল কারণ ছিল।
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ===== ফিক্স: index.html আসলে { prompt, images } পাঠায় ({cropName, category} না) —
    // prompt-টা এখন সরাসরি ব্যবহার করা হচ্ছে, নিজের হার্ডকোড করা prompt দিয়ে
    // ওভাররাইট করা হচ্ছে না।
    const { prompt, images } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "prompt পাওয়া যায়নি।" });
    }
    if (!images || images.length === 0) {
      return res.status(400).json({ error: "কোনো ছবি পাওয়া যায়নি।" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // ===== ফিক্স: responseMimeType 'application/json' বাদ দেওয়া হয়েছে —
    // index.html নিজের কাস্টম টেক্সট ফরম্যাটে উত্তর চায় (parseAndShowResult
    // দিয়ে পার্স করে), JSON স্কিমা চায় না।

    // ===== ফিক্স: প্রতিটা ইমেজ আসলে {base64, mimeType} অবজেক্ট — স্ট্রিং না।
    // আগের কোড এর উপর .replace() কল করছিল যেটা প্রতিটা রিকোয়েস্টেই ক্র্যাশ করত।
    const imageParts = images.map((img) => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType || "image/jpeg",
      },
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();

    // ===== ফিক্স: index.html আশা করে Gemini-র রॉ ফরম্যাট
    // (data.candidates[0].content.parts[0].text) — নিজের বানানো JSON না।
    return res.status(200).json({
      candidates: [
        {
          content: {
            parts: [{ text: responseText }],
          },
        },
      ],
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "এআই বিশ্লেষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।" });
  }
}

// পাথ হবে: api/send-sms.js
// Vercel Dashboard > Settings > Environment Variables এ SMS_API_KEY ও
// SMS_SENDER_ID বসাতে হবে। key কখনো browser-এ যাবে না, শুধু এই সার্ভার
// ফাংশনের ভেতরেই থাকবে।
//
// ডিফল্টভাবে এটা SSL Wireless এর SMS API ফরম্যাট ধরে লেখা হয়েছে
// (https://smsplus.sslwireless.com/) — অন্য গেটওয়ে ব্যবহার করলে নিচের
// fetch() কলের endpoint ও body আপনার গেটওয়ের ডকুমেন্টেশন অনুযায়ী বদলে নিন।

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধু POST অনুমোদিত' });
  }

  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID;

  if (!apiKey) {
    return res.status(500).json({ error: 'সার্ভারে SMS_API_KEY সেট করা হয়নি' });
  }
  if (!senderId) {
    return res.status(500).json({ error: 'সার্ভারে SMS_SENDER_ID সেট করা হয়নি' });
  }

  const { phone, message } = req.body || {};

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone ও message প্রয়োজন' });
  }

  // বাংলাদেশি ফোন নম্বর যাচাই (মৌলিক ফরম্যাট চেক — শুধু 01XXXXXXXXX টাইপ নম্বর গ্রহণ করা হচ্ছে)
  const cleanedPhone = String(phone).replace(/[\s\-()]/g, '');
  if (!/^(\+?880|0)1[0-9]{9}$/.test(cleanedPhone)) {
    return res.status(400).json({ error: 'ফোন নম্বরের ফরম্যাট সঠিক নয়' });
  }

  if (String(message).length > 640) {
    return res.status(400).json({ error: 'বার্তা অনেক বড়' });
  }

  try {
    const smsRes = await fetch('https://smsplus.sslwireless.com/api/v3/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_token: apiKey,
        sid: senderId,
        msisdn: cleanedPhone,
        sms: message,
        csms_id: `krishakbondhu_${Date.now()}`
      })
    });

    const data = await smsRes.json();

    if (!smsRes.ok || data.status !== 'SUCCESS') {
      return res.status(502).json({ error: 'SMS Gateway থেকে এরর এসেছে', details: data });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

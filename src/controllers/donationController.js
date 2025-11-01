const redis = require('../config/redis');
const db = require('../config/db');
const { signData } = require('../utils/signData');

exports.createDonation = async (req, res) => {
  try {
    const { streamer_id, donor_name, amount, message } = req.body;

    if (!streamer_id || !amount) {
      return res.status(400).json({ status: false, message: 'Missing data' });
    }

    // إنشاء سجل مبدئي في DB
    const [result] = await db.query(
      'INSERT INTO donations (streamer_id, donor_name, amount, message, status) VALUES (?, ?, ?, ?, ?)',
      [streamer_id, donor_name || 'Anonymous', amount, message || '', 'pending']
    );

    const donation = {
      donation_id: result.insertId,
      streamer_id,
      donor_name,
      amount,
      message
    };

    // توقيع البيانات + إرسالها إلى الـ queue
    const signature = signData(donation);
    await redis.lpush('donation_queue', JSON.stringify({ donation, signature }));

    res.json({ status: true, message: 'Donation queued successfully', donation_id: result.insertId });
  } catch (err) {
    console.error('Donation error:', err);
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};
//router.post('/create', donationController.createDonation);
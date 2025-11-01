const redis = require('../config/redis');
const db = require('../config/db');
const { verifySignature } = require('../utils/signData');

async function processQueue() {
  console.log('🟢 Donation Worker started...');

  while (true) {
    try {
      const msgStr = await redis.brpop('donation_queue', 0);
      const { donation, signature } = JSON.parse(msgStr[1]);

      if (!verifySignature(donation, signature)) {
        console.warn('❌ Invalid signature, skipping:', donation);
        continue;
      }

      console.log('📦 Processing donation:', donation);

      await db.query(
        'UPDATE donations SET status = ?, processed_at = NOW() WHERE id = ?',
        ['completed', donation.donation_id]
      );

      console.log('✅ Donation saved:', donation.donation_id);
    } catch (err) {
      console.error('Worker Error:', err);
    }
  }
}

processQueue();

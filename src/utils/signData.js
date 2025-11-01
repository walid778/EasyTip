const crypto = require('crypto');

function signData(data) {
  const secret = process.env.QUEUE_SECRET;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
  return signature;
}

function verifySignature(data, signature) {
  return signData(data) === signature;
}

module.exports = { signData, verifySignature };

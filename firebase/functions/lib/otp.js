'use strict';

const crypto = require('crypto');

// ============================================================================
// OTP（招待先メールへの到達確認・invitation-flow-design.md §7.5）
// 「身元を保証する本人確認手続ではない」＝到達確認。平文は保存せずハッシュ保存。
// ============================================================================

// 招待トークン: 128bit ランダム → 32 文字 hex（URL 埋め込み・PII を含めない）
function genInviteToken() {
  return crypto.randomBytes(16).toString('hex');
}

// OTP: 6 桁数字（先頭 0 を許容するため padStart）
function genOtp6() {
  // 0..999999 の一様乱数
  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, '0');
}

// OTP ハッシュ: token を salt に混ぜて sha256。招待ごとに異なるハッシュになる。
function hashOtp(otp, token) {
  return crypto
    .createHash('sha256')
    .update(String(otp) + ':' + String(token))
    .digest('hex');
}

// タイミング安全な比較（6桁 OTP でも定数時間比較を用いる）
function verifyOtp(inputOtp, token, storedHash) {
  if (!inputOtp || !storedHash) return false;
  const computed = hashOtp(inputOtp, token);
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { genInviteToken, genOtp6, hashOtp, verifyOtp };

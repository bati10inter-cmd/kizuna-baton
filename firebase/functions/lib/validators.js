'use strict';

const { ALLOWED_RELATIONS } = require('./constants');

// ============================================================================
// 入力バリデーション（純関数・callable ハンドラから利用）
// 返り値は { ok:true, value } もしくは { ok:false, message }。
// ============================================================================

// メールアドレス: 厳密な RFC ではなく到達確認前提の緩い形式チェック。
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(raw) {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (!v) return { ok: false, message: '招待先メールアドレスを入力してください。' };
  if (v.length > 254 || !EMAIL_RE.test(v)) {
    return { ok: false, message: 'メールアドレスの形式が正しくありません。' };
  }
  return { ok: true, value: v };
}

function validateRelation(raw) {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (!ALLOWED_RELATIONS.includes(v)) {
    return { ok: false, message: '関係性は「配偶者・子・親」から選んでください。' };
  }
  return { ok: true, value: v };
}

// 呼び名: 任意・空なら既定へフォールバック。過度な長さは弾く。
function validateName(raw, fallback) {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (!v) return { ok: true, value: fallback };
  if (v.length > 40) {
    return { ok: false, message: 'お名前が長すぎます（40文字以内）。' };
  }
  return { ok: true, value: v };
}

// OTP 入力: 6 桁数字のみ許容。
function validateOtpInput(raw) {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (!/^[0-9]{6}$/.test(v)) {
    return { ok: false, message: '確認コードは6桁の数字です。' };
  }
  return { ok: true, value: v };
}

// 規約/PP バージョン文字列（同意監査に記録するため非空を要求）。
function validateVersion(raw, label) {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (!v || v.length > 40) {
    return { ok: false, message: `${label}のバージョンが不正です。` };
  }
  return { ok: true, value: v };
}

module.exports = {
  validateEmail,
  validateRelation,
  validateName,
  validateOtpInput,
  validateVersion,
};

'use strict';

// ============================================================================
// 招待 OTP メール送信アダプタ（差替可能）
// ----------------------------------------------------------------------------
// EMAIL_PROVIDER 環境変数で実装を切替える:
//   'log'（既定）    … エミュレータ/開発用。実送信せず console.log とメモリ
//                       アウトボックスへ記録（結合テストが捕捉できる）。
//   'smtp'/'sendgrid' … 本番用スタブ。デプロイ時にオーナーが provider/資格情報を
//                       設定して実装を有効化する（下記 README 参照）。
//
// 本番の実送信手段の候補（オーナーが deploy 時に選定・Blaze 必須）:
//   (a) Firebase 拡張「Trigger Email」＋ SendGrid/SMTP（Firestore ドキュメント起点）
//   (b) この関数内で nodemailer + SMTP（SendGrid/Mailgun/Amazon SES 等）
// いずれも API キー等の秘密情報は functions のシークレット（defineSecret）で管理し、
// リポジトリには置かない。
// ============================================================================

// テスト/開発が参照できるメモリ内アウトボックス（プロセス内のみ・実運用では未使用）。
const outbox = [];

function provider() {
  return process.env.EMAIL_PROVIDER || 'log';
}

async function sendInviteOtpEmail({ to, otp, inviterName, link }) {
  const p = provider();
  if (p === 'log') {
    // eslint-disable-next-line no-console
    console.log(
      `[email:log] invite OTP → to=${to} otp=${otp} inviter=${inviterName || ''} link=${link || ''}`
    );
    outbox.push({ to, otp, inviterName, link, sentAtMs: Date.now() });
    return { ok: true, provider: 'log' };
  }

  // 本番プロバイダ: デプロイ時に実装を有効化する。未設定のまま呼ばれたら明示的に失敗させる。
  throw new Error(
    `EMAIL_PROVIDER='${p}' は未設定です。deploy 時に email.js の送信実装（Trigger Email 拡張 or nodemailer+SMTP）を有効化してください。`
  );
}

// テスト用: アウトボックスの参照とクリア。
function _getOutbox() {
  return outbox.slice();
}
function _clearOutbox() {
  outbox.length = 0;
}

module.exports = { sendInviteOtpEmail, _getOutbox, _clearOutbox };

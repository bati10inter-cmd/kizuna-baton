'use strict';

// ============================================================================
// 招待 OTP メール送信アダプタ（差替可能）
// ----------------------------------------------------------------------------
// EMAIL_PROVIDER 環境変数で実装を切替える:
//   'log'（既定）  … エミュレータ限定。実送信せず console.log とメモリアウトボックスへ
//                     記録（結合テストが捕捉）。本番（非エミュレータ）で呼ばれたら throw。
//   'sendgrid'     … 本番実装。@sendgrid/mail で OTP メールを実送信。
//                     API キー = Firebase Secret `SENDGRID_API_KEY`（issueInvite に bind）、
//                     送信元 = `EMAIL_FROM`（functions/.env・SendGrid で認証済みの送信者）。
//
// オーナー deploy 手順（Blaze 必須）:
//   1. SendGrid でアカウント作成 → Single Sender Verification で送信元メールを認証
//   2. `firebase functions:secrets:set SENDGRID_API_KEY`（プロンプトに API キー貼付）
//   3. functions/.env に `EMAIL_PROVIDER=sendgrid` と `EMAIL_FROM=<認証済み送信元>` を記述
//      （.env.example 参照。秘密情報は .env に置かず必ず Secret 管理）
//   4. `cd functions && npm install`（@sendgrid/mail 取得）→ deploy
// ============================================================================

// テスト/開発が参照できるメモリ内アウトボックス（プロセス内のみ・実運用では未使用）。
const outbox = [];

function provider() {
  return process.env.EMAIL_PROVIDER || 'log';
}

// エミュレータ実行中のみ true（本番デプロイでは false）。index.js の isEmulator と同一判定。
// OTP 平文を console.log する 'log' プロバイダを本番で絶対に走らせないためのゲート。
function isEmulator() {
  return (
    process.env.FUNCTIONS_EMULATOR === 'true' ||
    !!process.env.FIRESTORE_EMULATOR_HOST
  );
}

async function sendInviteOtpEmail({ to, otp, inviterName, link }) {
  const p = provider();
  if (p === 'log') {
    // 'log' は OTP 平文＋招待リンク（token 埋込）を Cloud Logging に出力するため
    // エミュレータ限定。本番で EMAIL_PROVIDER 未設定のまま呼ばれたら明示的に失敗させ、
    // 秘密情報がログに残る「無症状な誤設定デプロイ」を防ぐ（_devOutbox と同じ厳格ゲート）。
    if (!isEmulator()) {
      throw new Error(
        "EMAIL_PROVIDER が未設定です。本番デプロイでは 'log' プロバイダ（OTP をログ出力）は" +
          '使用できません。deploy 時に実送信実装（Trigger Email 拡張 or nodemailer+SMTP）を有効化し、' +
          'EMAIL_PROVIDER を設定してください。'
      );
    }
    // eslint-disable-next-line no-console
    console.log(
      `[email:log] invite OTP → to=${to} otp=${otp} inviter=${inviterName || ''} link=${link || ''}`
    );
    outbox.push({ to, otp, inviterName, link, sentAtMs: Date.now() });
    return { ok: true, provider: 'log' };
  }

  // 本番プロバイダ: SendGrid（@sendgrid/mail）。API キーは Firebase Secret
  // （SENDGRID_API_KEY・issueInvite に bind）、送信元は EMAIL_FROM（.env・認証済み送信者）。
  if (p === 'sendgrid') {
    const key = process.env.SENDGRID_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!key || !from) {
      throw new Error(
        'SENDGRID_API_KEY（Secret）と EMAIL_FROM（.env・認証済み送信者）を設定してください。'
      );
    }
    // 遅延 require: emulator/log 経路や未使用時に依存を読み込まない。
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(key);
    const subject = 'きずなbaton — 家族招待の確認コード';
    const text =
      `${inviterName || 'ご家族'}さんから、きずなbaton の家族招待が届いています。\n\n` +
      `確認コード（6桁）: ${otp}\n` +
      `招待リンク: ${link || ''}\n\n` +
      'このコードは、招待リンクを開いた画面で入力してください。\n' +
      'お心当たりがない場合は、このメールを破棄してください。';
    await sgMail.send({ to, from, subject, text });
    return { ok: true, provider: 'sendgrid' };
  }

  // 未知/未設定プロバイダは明示的に失敗させる（無症状な誤設定デプロイを防ぐ）。
  throw new Error(
    `EMAIL_PROVIDER='${p}' は未対応です。'sendgrid' を設定するか、deploy 時に送信実装を追加してください。`
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

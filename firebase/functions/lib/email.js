'use strict';

const {
  OPERATOR_NAME,
  OPERATOR_CONTACT_EMAIL,
  PRIVACY_POLICY_URL,
} = require('./constants');

// APP-INVITE-EMAIL-BODY(v109): 招待メールは「家族招待の確認」だけを目的とする
// トランザクショナルメールとして扱う。**広告・宣伝・キャンペーン等の営業要素は本文に一切含めない**
// （特定電子メール法のオプトイン規制の対象外に留める自制ルール）。本文末尾には送信者（運営者）情報・
// 問い合わせ/削除依頼窓口・プライバシーポリシーへのリンクを必ず付す（非利用者＝招待相手の権利経路確保）。
function inviteMailFooter() {
  return (
    '――――――\n' +
    `送信元: ${OPERATOR_NAME}（本メールは家族招待の確認のみを目的としたご連絡です）\n` +
    `お問い合わせ・登録情報の削除依頼: ${OPERATOR_CONTACT_EMAIL}\n` +
    `プライバシーポリシー: ${PRIVACY_POLICY_URL}`
  );
}

// ============================================================================
// 招待 OTP メール送信アダプタ（差替可能）
// ----------------------------------------------------------------------------
// EMAIL_PROVIDER 環境変数で実装を切替える:
//   'log'（既定）  … エミュレータ限定。実送信せず console.log とメモリアウトボックスへ
//                     記録（結合テストが捕捉）。本番（非エミュレータ）で呼ばれたら throw。
//   'sendgrid'     … @sendgrid/mail で実送信。API キー = Firebase Secret `SENDGRID_API_KEY`。
//   'resend'       … v140(OPS-EMAIL-RESEND): Node 22 標準 fetch で Resend API に実送信
//                     （追加の npm 依存なし）。API キー = Firebase Secret `RESEND_API_KEY`。
//   送信元はいずれも `EMAIL_FROM`（functions/.env・プロバイダ側でドメイン認証済みの送信者）。
//   両 Secret は issueInvite/acceptInvite に並べて bind＝移行・切り戻し期間中はどちらでも送れる。
//
// 件名・本文は build*Mail（プロバイダ非依存の純関数）で組み立て、送信だけを差し替える。
// 本文はプロバイダを替えても一字も変えない（テストの fixture で全文一致を検証）。
//
// オーナー deploy 手順（Blaze 必須）:
//   1. プロバイダで送信ドメインを認証し、送信専用 API キーを発行
//   2. `firebase functions:secrets:set RESEND_API_KEY`（または SENDGRID_API_KEY・プロンプトに貼付）
//   3. functions/.env に `EMAIL_PROVIDER=resend|sendgrid` と `EMAIL_FROM=<認証済み送信元>` を記述
//      （.env.example 参照。秘密情報は .env に置かず必ず Secret 管理）
//   4. deploy
// ============================================================================

// テスト/開発が参照できるメモリ内アウトボックス（プロセス内のみ・実運用では未使用）。
const outbox = [];
// APP-INVITE-ACCEPT-NOTIFY(v108): 受諾通知メール用の別アウトボックス（OTP と混ざらない）。
const acceptOutbox = [];

// Resend の送信待ちの上限。onCall の既定タイムアウト（60秒）より十分短くし、
// 受諾（best-effort 通知を await する）がハングで失敗に見えることを防ぐ。
const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const RESEND_TIMEOUT_MS = 10000;

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

function unsupportedProviderError(p) {
  return new Error(
    `EMAIL_PROVIDER='${p}' は未対応です。'resend' か 'sendgrid' を設定するか、deploy 時に送信実装を追加してください。`
  );
}

// ---- 件名・本文（プロバイダ非依存の純関数）----
function buildInviteOtpMail({ otp, inviterName, link }) {
  const subject = 'きずなbaton — 家族招待の確認コード';
  const text =
    `${inviterName || 'ご家族'}さんから、きずなbaton の家族招待が届いています。\n\n` +
    `確認コード（6桁）: ${otp}\n` +
    `招待リンク: ${link || ''}\n\n` +
    'このコードは、招待リンクを開いた画面で入力してください。\n' +
    'お心当たりがない場合は、このメールを破棄してください。\n\n' +
    inviteMailFooter();
  return { subject, text };
}

// 呼び名は前後空白を除き、空なら「ご家族」。
function acceptedViewerName(viewerName) {
  return (viewerName && String(viewerName).trim()) || 'ご家族';
}

function buildInviteAcceptedMail({ viewerName }) {
  const who = acceptedViewerName(viewerName);
  const subject = 'きずなbaton — 家族招待が受諾されました';
  const text =
    'あなたが送った家族招待が受諾されました。\n\n' +
    `受諾した方（あなたが設定した呼び名）: ${who}\n\n` +
    'きずなbaton アプリを開くと、共有した契約の一覧に反映されています。\n' +
    'お心当たりのない受諾の場合は、アプリの家族管理から共有の解除ができます。\n\n' +
    inviteMailFooter();
  return { subject, text };
}

// ---- 実送信（'sendgrid' / 'resend'）----
async function sendViaSendgrid({ to, subject, text }) {
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
  await sgMail.send({ to, from, subject, text });
  return { ok: true, provider: 'sendgrid' };
}

async function sendViaResend({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    throw new Error(
      'RESEND_API_KEY（Secret）と EMAIL_FROM（.env・認証済み送信者）を設定してください。'
    );
  }
  let res;
  try {
    res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });
  } catch (e) {
    // 宛先・本文・OTP・キーを含めない（例外名のみ）。タイムアウトは TimeoutError/AbortError。
    throw new Error(`Resend send failed: ${(e && e.name) || 'Error'}`);
  }
  if (!res.ok) {
    throw new Error(`Resend send failed: status=${res.status}`);
  }
  return { ok: true, provider: 'resend' };
}

async function sendViaProvider(p, mail) {
  if (p === 'resend') return sendViaResend(mail);
  if (p === 'sendgrid') return sendViaSendgrid(mail);
  throw unsupportedProviderError(p);
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

  // 未知/未設定プロバイダは sendViaProvider が明示的に失敗させる（無症状な誤設定デプロイを防ぐ）。
  const { subject, text } = buildInviteOtpMail({ otp, inviterName, link });
  return sendViaProvider(p, { to, subject, text });
}

// ============================================================================
// 受諾通知メール（APP-INVITE-ACCEPT-NOTIFY・v108）
// ----------------------------------------------------------------------------
// 招待が受諾されたことを招待元本人（owner）へ通知する。ToS 第6条5項4号の履行＋
// 「誤配受諾」の検知網（owner が身に覚えのない受諾に気づき共有解除できる）。
// OTP を含まないため 'log' プロバイダの本番ゲートは OTP メールより緩めてよいが、
// 実装の一貫性のため同じ厳格ゲート（本番で 'log' は throw）を維持する。
// ============================================================================
async function sendInviteAcceptedEmail({ to, viewerName }) {
  const p = provider();
  if (p === 'log') {
    if (!isEmulator()) {
      throw new Error(
        "EMAIL_PROVIDER が未設定です。本番デプロイでは 'log' プロバイダは使用できません。" +
          'EMAIL_PROVIDER を設定してください。'
      );
    }
    const who = acceptedViewerName(viewerName);
    // eslint-disable-next-line no-console
    console.log(`[email:log] invite accepted → to=${to} viewer=${who}`);
    acceptOutbox.push({ to, viewerName: who, sentAtMs: Date.now() });
    return { ok: true, provider: 'log' };
  }

  const { subject, text } = buildInviteAcceptedMail({ viewerName });
  return sendViaProvider(p, { to, subject, text });
}

// テスト用: アウトボックスの参照とクリア。
function _getOutbox() {
  return outbox.slice();
}
function _clearOutbox() {
  outbox.length = 0;
}
function _getAcceptOutbox() {
  return acceptOutbox.slice();
}
function _clearAcceptOutbox() {
  acceptOutbox.length = 0;
}

module.exports = {
  provider,
  buildInviteOtpMail,
  buildInviteAcceptedMail,
  sendInviteOtpEmail,
  sendInviteAcceptedEmail,
  _getOutbox,
  _clearOutbox,
  _getAcceptOutbox,
  _clearAcceptOutbox,
};

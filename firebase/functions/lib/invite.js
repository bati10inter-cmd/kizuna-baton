'use strict';

// ============================================================================
// Firestore ドキュメント組み立て（純関数）
// undefined フィールドは Firestore が invalid-argument で拒否するため除去する
// （P2b buildCloudDocs と同じ対策）。時刻は呼び出し側が注入（テスト容易化）。
// ============================================================================

// undefined を持つキーを落とした浅いコピーを返す。
function stripUndefined(obj) {
  const out = {};
  for (const k of Object.keys(obj)) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

// invitations/{token} に書く招待ドキュメント。OTP 平文は保存せず otpHash のみ。
function buildInviteDoc({
  token,
  invitedBy,
  inviteeEmail,
  suggestedName,
  suggestedRelation,
  otpHash,
  viewerMemberId,
  createdAtMs,
  expiresAtMs,
}) {
  return stripUndefined({
    token,
    invitedBy,
    inviteeEmail,
    suggestedName,
    suggestedRelation,
    otpHash,
    viewerMemberId,
    status: 'pending',
    otpAttempts: 0,
    createdAtMs,
    expiresAtMs,
    acceptedAtMs: null,
    acceptedByUid: null,
    acceptedAsMemberId: null,
    revokedAtMs: null,
  });
}

// listInvites が owner へ返す安全なビュー（otp/otpHash・inviteeEmail を除外）。
// otpHash は秘密のため除外。inviteeEmail は owner が入力した値だが返却は最小限に留めて除外。
// token は含める＝発行者本人が招待URL（/invite/{token}）を再共有するのに必要（token 単体では
// OTP なしに acceptInvite できず、owner=発行者に返すため露出面は増えない）。
function toOwnerInviteView(doc) {
  return stripUndefined({
    token: doc.token,
    suggestedName: doc.suggestedName,
    suggestedRelation: doc.suggestedRelation,
    status: doc.status,
    createdAtMs: doc.createdAtMs,
    expiresAtMs: doc.expiresAtMs,
    acceptedAtMs: doc.acceptedAtMs,
    viewerMemberId: doc.viewerMemberId,
  });
}

// share ドキュメント（firestore.rules の canViewLive が参照する viewerMemberId を保持）。
function buildShareDoc({ ownerUid, viewerUid, viewerMemberId, acceptedAtMs }) {
  return stripUndefined({
    ownerUid,
    viewerUid,
    viewerMemberId,
    status: 'accepted',
    acceptedAtMs,
  });
}

// consentLogs/{viewerUid}/entries/{id}（既存クライアント consentLog 形と整合＋自己申告）。
function buildConsentEntry({ tosVersion, ppVersion, residencyConfirmed, ageConfirmed, tsMs }) {
  return stripUndefined({
    ts: tsMs,
    action: 'invite_accept',
    tosVersion,
    ppVersion,
    residencyConfirmed: !!residencyConfirmed,
    ageConfirmed: !!ageConfirmed,
  });
}

// 招待の状態評価（受諾可否）。純関数。
//   → { ok:true } / { ok:false, code, message }
function evaluateAcceptable(doc, nowMs, maxAttempts) {
  if (!doc) {
    return { ok: false, code: 'not-found', message: '招待が見つかりません。' };
  }
  if (doc.status === 'accepted') {
    return { ok: false, code: 'already-accepted', message: 'この招待は既に受諾済みです。' };
  }
  if (doc.status === 'revoked') {
    return { ok: false, code: 'revoked', message: 'この招待は取り消されています。' };
  }
  if (doc.status !== 'pending') {
    return { ok: false, code: 'invalid-status', message: 'この招待は利用できません。' };
  }
  if (typeof doc.expiresAtMs === 'number' && nowMs > doc.expiresAtMs) {
    return { ok: false, code: 'expired', message: '招待の有効期限が切れています。再発行を依頼してください。' };
  }
  if ((doc.otpAttempts || 0) >= maxAttempts) {
    return { ok: false, code: 'locked', message: '確認コードの入力回数が上限に達しました。招待の再発行を依頼してください。' };
  }
  return { ok: true };
}

module.exports = {
  stripUndefined,
  buildInviteDoc,
  toOwnerInviteView,
  buildShareDoc,
  buildConsentEntry,
  evaluateAcceptable,
};

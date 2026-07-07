'use strict';

// ============================================================================
// きずなbaton — 招待サーバ化（APP-V2-INVITE-SERVER / P3）
// ----------------------------------------------------------------------------
// Cloud Functions v2 callable。Admin SDK は firestore.rules をバイパスするため、
// invitations/shares（rules で allow write:false）への書込はここでのみ行う。
// 権限の真の境界は firestore.rules（家族の契約 read）＋本関数（発行/受諾/取消）。
//
// スコープA（本セッション）: ローカル Functions エミュレータでの検証まで。
// 実デプロイ（Blaze・メール実送信・クライアント配線）は P3-deploy でオーナー作業。
// ============================================================================

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

const { INVITE_EXPIRY_MS, OTP_MAX_ATTEMPTS } = require('./lib/constants');
const { genInviteToken, genOtp6, hashOtp, verifyOtp } = require('./lib/otp');
const {
  validateEmail,
  validateRelation,
  validateName,
  validateOtpInput,
  validateVersion,
} = require('./lib/validators');
const { checkIssueAllowed } = require('./lib/rateLimit');
const {
  buildInviteDoc,
  toOwnerInviteView,
  buildShareDoc,
  buildConsentEntry,
  evaluateAcceptable,
} = require('./lib/invite');

setGlobalOptions({ region: 'asia-northeast1', maxInstances: 10 });

admin.initializeApp();
const db = admin.firestore();

// 現在時刻（ms）。テスト時に固定注入したくなったらここを差替える単一チョークポイント。
function nowMs() {
  return Date.now();
}

// エミュレータ実行中のみ true（本番デプロイでは false）。OTP のテスト用露出を厳格にゲートする。
function isEmulator() {
  return (
    process.env.FUNCTIONS_EMULATOR === 'true' ||
    !!process.env.FIRESTORE_EMULATOR_HOST
  );
}

function requireUid(request) {
  const uid = request.auth && request.auth.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'ログインが必要です。');
  }
  return uid;
}

function badInput(message) {
  return new HttpsError('invalid-argument', message);
}

// ---- issueInvite（owner が招待を発行）----------------------------------------
exports.issueInvite = onCall(async (request) => {
  const ownerUid = requireUid(request);
  const data = request.data || {};

  const email = validateEmail(data.inviteeEmail);
  if (!email.ok) throw badInput(email.message);
  const relation = validateRelation(data.suggestedRelation);
  if (!relation.ok) throw badInput(relation.message);
  const name = validateName(data.suggestedName, 'ご家族');
  if (!name.ok) throw badInput(name.message);

  // レート制限: owner の既存招待を集計（pending+accepted ≤5 / 24h ≤3）。
  const snap = await db
    .collection('invitations')
    .where('invitedBy', '==', ownerUid)
    .get();
  const summary = snap.docs.map((d) => {
    const v = d.data();
    return { status: v.status, createdAtMs: v.createdAtMs };
  });
  const gate = checkIssueAllowed(summary, nowMs());
  if (!gate.ok) throw new HttpsError('resource-exhausted', gate.message);

  const now = nowMs();
  const token = genInviteToken();
  const otp = genOtp6();

  // owner 名前空間に招待先メンバーを採番（auto-id）。rules の viewerMemberId ブリッジ用。
  const memberRef = db
    .collection('users')
    .doc(ownerUid)
    .collection('members')
    .doc();
  const viewerMemberId = memberRef.id;

  const inviteDoc = buildInviteDoc({
    token,
    invitedBy: ownerUid,
    inviteeEmail: email.value,
    suggestedName: name.value,
    suggestedRelation: relation.value,
    otpHash: hashOtp(otp, token),
    viewerMemberId,
    createdAtMs: now,
    expiresAtMs: now + INVITE_EXPIRY_MS,
  });

  const batch = db.batch();
  batch.set(db.collection('invitations').doc(token), inviteDoc);
  batch.set(memberRef, {
    name: name.value,
    suggestedRelation: relation.value,
    status: 'pending',
    invitedVia: token,
    createdAtMs: now,
  });
  await batch.commit();

  // OTP を招待先メールへ（到達確認）。owner には返さない。
  const { sendInviteOtpEmail } = require('./lib/email');
  const link = `https://kizuna-baton.example/invite/${token}`;
  await sendInviteOtpEmail({
    to: email.value,
    otp,
    inviterName: name.value,
    link,
  });

  // 【エミュレータ限定】結合テストが OTP を取得するための dev アウトボックス。
  // `_devOutbox` は firestore.rules に match が無く既定 deny＝クライアント不可視。
  // isEmulator() ゲートにより本番デプロイでは絶対に書かれない。
  if (isEmulator()) {
    await db.collection('_devOutbox').doc(token).set({
      otp,
      to: email.value,
      createdAtMs: now,
    });
  }

  // 戻り値に OTP を含めない（サーバ化の肝）。
  return {
    token,
    viewerMemberId,
    expiresAtMs: inviteDoc.expiresAtMs,
    inviteLink: link,
  };
});

// ---- acceptInvite（invitee が OTP＋同意で受諾）--------------------------------
exports.acceptInvite = onCall(async (request) => {
  const viewerUid = requireUid(request);
  const data = request.data || {};

  const token = typeof data.token === 'string' ? data.token.trim() : '';
  if (!/^[0-9a-f]{32}$/.test(token)) throw badInput('招待リンクが正しくありません。');
  const otp = validateOtpInput(data.otp);
  if (!otp.ok) throw badInput(otp.message);
  const tos = validateVersion(data.termsVersion, '利用規約');
  if (!tos.ok) throw badInput(tos.message);
  const pp = validateVersion(data.privacyVersion, 'プライバシーポリシー');
  if (!pp.ok) throw badInput(pp.message);
  if (!data.residencyConfirmed || !data.ageConfirmed) {
    throw badInput('日本国内居住・18歳以上の確認が必要です。');
  }

  const inviteRef = db.collection('invitations').doc(token);
  const now = nowMs();

  // トランザクションで read→評価→（OTP 誤りは attempts++）→受諾を原子的に行う。
  const result = await db.runTransaction(async (tx) => {
    const inviteSnap = await tx.get(inviteRef);
    const invite = inviteSnap.exists ? inviteSnap.data() : null;

    const state = evaluateAcceptable(invite, now, OTP_MAX_ATTEMPTS);
    if (!state.ok) {
      return { ok: false, code: state.code, message: state.message };
    }

    const ownerUid = invite.invitedBy;
    // 自分の招待を自分で受諾するのは不可（owner≠viewer）。
    if (ownerUid === viewerUid) {
      return { ok: false, code: 'self-accept', message: 'ご自身の招待は受諾できません。' };
    }

    if (!verifyOtp(otp.value, token, invite.otpHash)) {
      tx.update(inviteRef, { otpAttempts: (invite.otpAttempts || 0) + 1 });
      return { ok: false, code: 'bad-otp', message: '確認コードが正しくありません。' };
    }

    const viewerMemberId = invite.viewerMemberId;

    // shares/{ownerUid}_{viewerUid}（rules の memberId↔uid ブリッジ）
    const shareRef = db.collection('shares').doc(`${ownerUid}_${viewerUid}`);
    tx.set(
      shareRef,
      buildShareDoc({ ownerUid, viewerUid, viewerMemberId, acceptedAtMs: now })
    );

    // owner の member doc を accepted 化＋受諾者 uid を記録
    const memberRef = db
      .collection('users')
      .doc(ownerUid)
      .collection('members')
      .doc(viewerMemberId);
    tx.set(
      memberRef,
      { status: 'accepted', acceptedByUid: viewerUid, acceptedAtMs: now },
      { merge: true }
    );

    // 同意監査証跡（invitee 側）
    const consentRef = db
      .collection('consentLogs')
      .doc(viewerUid)
      .collection('entries')
      .doc();
    tx.set(
      consentRef,
      buildConsentEntry({
        tosVersion: tos.value,
        ppVersion: pp.value,
        residencyConfirmed: data.residencyConfirmed,
        ageConfirmed: data.ageConfirmed,
        tsMs: now,
      })
    );

    // invitation を accepted 化
    tx.update(inviteRef, {
      status: 'accepted',
      acceptedAtMs: now,
      acceptedByUid: viewerUid,
      acceptedAsMemberId: viewerMemberId,
    });

    // owner 即時通知（doc・実メール通知は deploy 時にアダプタ差替）
    const notifRef = db
      .collection('users')
      .doc(ownerUid)
      .collection('notifications')
      .doc();
    tx.set(notifRef, {
      type: 'invite_accepted',
      viewerUid,
      viewerMemberId,
      suggestedName: invite.suggestedName,
      createdAtMs: now,
      read: false,
    });

    return { ok: true, ownerUid, viewerMemberId };
  });

  if (!result.ok) {
    if (result.code === 'bad-otp' || result.code === 'locked') {
      throw new HttpsError('permission-denied', result.message);
    }
    if (result.code === 'expired' || result.code === 'revoked' || result.code === 'already-accepted') {
      throw new HttpsError('failed-precondition', result.message);
    }
    if (result.code === 'not-found') {
      throw new HttpsError('not-found', result.message);
    }
    throw new HttpsError('failed-precondition', result.message);
  }

  return { ok: true, ownerUid: result.ownerUid, viewerMemberId: result.viewerMemberId };
});

// ---- revokeInvite（owner が pending 招待を取消）------------------------------
exports.revokeInvite = onCall(async (request) => {
  const ownerUid = requireUid(request);
  const token = typeof (request.data && request.data.token) === 'string'
    ? request.data.token.trim()
    : '';
  if (!/^[0-9a-f]{32}$/.test(token)) throw badInput('招待が特定できません。');

  const inviteRef = db.collection('invitations').doc(token);
  const now = nowMs();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(inviteRef);
    if (!snap.exists) throw new HttpsError('not-found', '招待が見つかりません。');
    const invite = snap.data();
    if (invite.invitedBy !== ownerUid) {
      throw new HttpsError('permission-denied', 'この招待を取り消す権限がありません。');
    }
    if (invite.status !== 'pending') {
      throw new HttpsError('failed-precondition', '取り消せるのは未受諾の招待のみです。');
    }
    tx.update(inviteRef, { status: 'revoked', revokedAtMs: now });
    // 招待先メンバー（pending）も片付ける
    if (invite.viewerMemberId) {
      const memberRef = db
        .collection('users')
        .doc(ownerUid)
        .collection('members')
        .doc(invite.viewerMemberId);
      tx.set(memberRef, { status: 'revoked', revokedAtMs: now }, { merge: true });
    }
  });

  return { ok: true };
});

// ---- unlinkShare（owner が受諾済みの閲覧権限を停止）--------------------------
exports.unlinkShare = onCall(async (request) => {
  const ownerUid = requireUid(request);
  const viewerUid = typeof (request.data && request.data.viewerUid) === 'string'
    ? request.data.viewerUid.trim()
    : '';
  if (!viewerUid) throw badInput('停止する相手が特定できません。');

  const shareRef = db.collection('shares').doc(`${ownerUid}_${viewerUid}`);
  const now = nowMs();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(shareRef);
    if (!snap.exists) throw new HttpsError('not-found', '共有関係が見つかりません。');
    const share = snap.data();
    if (share.ownerUid !== ownerUid) {
      throw new HttpsError('permission-denied', 'この共有を停止する権限がありません。');
    }
    // status を accepted 以外へ → rules read ゲート（status=='accepted'）で即遮断
    tx.update(shareRef, { status: 'revoked', revokedAtMs: now });
    if (share.viewerMemberId) {
      const memberRef = db
        .collection('users')
        .doc(ownerUid)
        .collection('members')
        .doc(share.viewerMemberId);
      tx.set(memberRef, { status: 'unlinked', unlinkedAtMs: now }, { merge: true });
    }
  });

  return { ok: true };
});

// ---- listInvites（owner が自分の招待一覧を取得・OTP は除外）------------------
exports.listInvites = onCall(async (request) => {
  const ownerUid = requireUid(request);
  const snap = await db
    .collection('invitations')
    .where('invitedBy', '==', ownerUid)
    .get();
  const invites = snap.docs.map((d) => toOwnerInviteView(d.data()));
  return { invites };
});

// ---- deleteAccount（本人がアカウントと全データを即時完全削除）------------------
// APP-V2-ACCOUNT-DELETE: Apple 5.1.1(v) ＋ PP第14条/ToS第18条（受付から14日以内・復元不可）。
// 即時削除方式（オーナー決定 2026-07-07）＝ Scheduler ジョブなし・猶予/復元状態なし。
// 順序＝①② 家族アクセス遮断 → ③④ データ → ⑤ Auth（最後）。
// ⑤を最後にすることで途中失敗しても本人の認証が残り、再実行で完遂できる（①〜④は冪等）。
exports.deleteAccount = onCall(async (request) => {
  const uid = requireUid(request);

  // ①-a viewer 側 shares/{ownerUid}_{uid}: 相手 owner の member doc を unlinked 化（unlinkShare と同型）＋ share 削除
  const asViewer = await db
    .collection('shares')
    .where('viewerUid', '==', uid)
    .get();
  // ①-b owner 側 shares/{uid}_{viewerUid}: 削除（rules の hasAcceptedShare が exists 前提＝家族 read を即遮断）
  const asOwner = await db
    .collection('shares')
    .where('ownerUid', '==', uid)
    .get();
  // ② invitations: 本人が発行したもの＋本人が受諾したもの（本人のメール・uid を含む PII）
  const invitedByMe = await db
    .collection('invitations')
    .where('invitedBy', '==', uid)
    .get();
  const acceptedByMe = await db
    .collection('invitations')
    .where('acceptedByUid', '==', uid)
    .get();

  const now = nowMs();
  const ops = [];
  asViewer.docs.forEach((d) => {
    const share = d.data();
    if (share.ownerUid && share.viewerMemberId) {
      const memberRef = db
        .collection('users')
        .doc(share.ownerUid)
        .collection('members')
        .doc(share.viewerMemberId);
      ops.push({ ref: memberRef, data: { status: 'unlinked', unlinkedAtMs: now }, merge: true });
    }
    ops.push({ ref: d.ref, del: true });
  });
  asOwner.docs.forEach((d) => ops.push({ ref: d.ref, del: true }));
  invitedByMe.docs.forEach((d) => ops.push({ ref: d.ref, del: true }));
  acceptedByMe.docs.forEach((d) => {
    // 発行者側で二重計上された doc（自己招待は不可のため通常ないが）冪等に許容
    if (!invitedByMe.docs.some((x) => x.id === d.id)) ops.push({ ref: d.ref, del: true });
  });

  for (let i = 0; i < ops.length; i += 400) { // writeBatch 上限500の安全側チャンク（クライアント runCloudSync と同じ）
    const batch = db.batch();
    ops.slice(i, i + 400).forEach((op) => {
      if (op.del) batch.delete(op.ref);
      else batch.set(op.ref, op.data, { merge: !!op.merge });
    });
    await batch.commit();
  }

  // ③ 本人サブツリー（contracts/assets/cards/members/categories/notifications ＋本体 doc）
  await db.recursiveDelete(db.collection('users').doc(uid));
  // ④ 同意監査ログ（PP第14条2項「30日以内」を即時削除で満たす）
  await db.recursiveDelete(db.collection('consentLogs').doc(uid));

  // ⑤ Firebase Auth ユーザー削除（最後）
  await admin.auth().deleteUser(uid);

  return { ok: true };
});

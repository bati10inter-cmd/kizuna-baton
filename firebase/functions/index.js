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
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
// APP-FUNNEL-KPI(v128): admin.firestore.FieldValue（namespaced API）はエミュレータ実行時に
// 未定義になる場合があるため、モジュラーAPIから直接 import する（firebase-admin v13 推奨形）。
const { FieldValue } = require('firebase-admin/firestore');

// SendGrid API キー（本番のメール送信）。値はリポジトリに置かず Firebase Secret で管理し、
// 実送信を行う issueInvite にのみ bind する（下記 onCall options）。
const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');

const {
  INVITE_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OWNER_MEMBER_ID,
  INVITE_CLEANUP_RETENTION_MS,
} = require('./lib/constants');
const { genInviteToken, genOtp6, hashOtp, verifyOtp } = require('./lib/otp');
const {
  validateEmail,
  validateRelation,
  validateName,
  validateOtpInput,
  validateVersion,
  validateMemberId,
} = require('./lib/validators');
const { checkIssueAllowed } = require('./lib/rateLimit');
const {
  buildInviteDoc,
  toOwnerInviteView,
  buildShareDoc,
  buildConsentEntry,
  evaluateAcceptable,
  selectExpiredInviteIdsToDelete,
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

// 招待リンクのベースURL（stage-2b）。クライアント boot() が `#invite=<token>` を解釈する。
// index.html は lp.html へリダイレクトするため、必ずアプリ本体へ直リンクすること。
const APP_INVITE_BASE_URL =
  process.env.APP_INVITE_BASE_URL ||
  'https://bati10inter-cmd.github.io/kizuna-baton/shukatsu-prototype.html';

function buildInviteLink(token) {
  return `${APP_INVITE_BASE_URL}#invite=${token}`;
}

// owner の表示名（users/{ownerUid}/members/m1 の name）。members/m1 未ミラーなら null。
// viewer は rules 上 owner の members を読めないため、メール文面と share doc への転写に使う。
function ownerMemberRef(ownerUid) {
  return db
    .collection('users')
    .doc(ownerUid)
    .collection('members')
    .doc(OWNER_MEMBER_ID);
}
function ownerNameFromSnap(snap) {
  if (!snap.exists) return null;
  const name = snap.data().name;
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

// ---- issueInvite（owner が招待を発行）----------------------------------------
// SENDGRID_API_KEY を bind＝実送信時のみ Secret を process.env で参照可能にする。
exports.issueInvite = onCall({ secrets: [SENDGRID_API_KEY] }, async (request) => {
  const ownerUid = requireUid(request);
  const data = request.data || {};

  const email = validateEmail(data.inviteeEmail);
  if (!email.ok) throw badInput(email.message);
  const relation = validateRelation(data.suggestedRelation);
  if (!relation.ok) throw badInput(relation.message);
  const name = validateName(data.suggestedName, 'ご家族');
  if (!name.ok) throw badInput(name.message);
  // 招待先メンバー ID（任意）。クライアントが既存 member スロット（'m2' 等）を渡すと
  // rules の liveViewers 照合が一致する。未指定はサーバ auto-id へフォールバック。
  const memberIdInput = validateMemberId(data.memberId);
  if (!memberIdInput.ok) throw badInput(memberIdInput.message);

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

  // owner 名前空間の招待先メンバー。クライアント指定の member id があればそれを、
  // 無ければ auto-id を採番（rules の viewerMemberId↔liveViewers ブリッジ用）。
  const membersCol = db.collection('users').doc(ownerUid).collection('members');
  const memberRef = memberIdInput.value
    ? membersCol.doc(memberIdInput.value)
    : membersCol.doc();
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
  // merge: クライアント指定の既存 member スロット（mirror 済の color/name 等）を保持する。
  batch.set(
    memberRef,
    {
      name: name.value,
      suggestedRelation: relation.value,
      status: 'pending',
      invitedVia: token,
      createdAtMs: now,
    },
    { merge: true }
  );
  await batch.commit();

  // OTP を招待先メールへ（到達確認）。owner には返さない。
  // inviterName は発行者（owner）本人の表示名（members/m1）。従来は招待相手の
  // suggestedName を渡していた（「〇〇さんから招待」の〇〇が受信者自身になる不具合）。
  const ownerName = ownerNameFromSnap(await ownerMemberRef(ownerUid).get());
  const { sendInviteOtpEmail } = require('./lib/email');
  const link = buildInviteLink(token);
  await sendInviteOtpEmail({
    to: email.value,
    otp,
    inviterName: ownerName,
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
// APP-INVITE-ACCEPT-NOTIFY(v108): 受諾成功後に招待元本人へ実メール通知するため
// SENDGRID_API_KEY を bind（issueInvite と同型）。忘れると本番で Secret 参照不可＝送信失敗。
exports.acceptInvite = onCall({ secrets: [SENDGRID_API_KEY] }, async (request) => {
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

    // owner 表示名スナップショット（share doc へ転写・stage-2b）。
    // Firestore tx は全 read が write より先の制約があるため、
    // bad-otp 分岐の attempts++（write）より前にここで読む。
    const ownerName = ownerNameFromSnap(await tx.get(ownerMemberRef(ownerUid)));

    if (!verifyOtp(otp.value, token, invite.otpHash)) {
      tx.update(inviteRef, { otpAttempts: (invite.otpAttempts || 0) + 1 });
      return { ok: false, code: 'bad-otp', message: '確認コードが正しくありません。' };
    }

    const viewerMemberId = invite.viewerMemberId;

    // shares/{ownerUid}_{viewerUid}（rules の memberId↔uid ブリッジ）
    const shareRef = db.collection('shares').doc(`${ownerUid}_${viewerUid}`);
    tx.set(
      shareRef,
      buildShareDoc({ ownerUid, viewerUid, viewerMemberId, acceptedAtMs: now, ownerName })
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

    return { ok: true, ownerUid, viewerMemberId, ownerName, suggestedName: invite.suggestedName };
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

  // APP-INVITE-ACCEPT-NOTIFY(v108・Fable A-2・ToS6条5項4号): 受諾を招待元本人へメール通知
  // （＋誤配受諾の検知網）。best-effort＝送信失敗は確定済みの受諾を妨げない。owner のメールは
  // Auth から取得（members には持たない）。呼び名は招待発行時に owner が設定した suggestedName。
  try {
    const ownerRecord = await admin.auth().getUser(result.ownerUid);
    const ownerEmail = ownerRecord && ownerRecord.email;
    if (ownerEmail) {
      const { sendInviteAcceptedEmail } = require('./lib/email');
      await sendInviteAcceptedEmail({ to: ownerEmail, viewerName: result.suggestedName });
    }
  } catch (e) {
    // 通知は補助的＝失敗しても受諾は確定済み。ログのみ（受諾レスポンスは成功で返す）。
    // eslint-disable-next-line no-console
    console.error('[acceptInvite] owner notify email failed', e && e.message);
  }

  return {
    ok: true,
    ownerUid: result.ownerUid,
    viewerMemberId: result.viewerMemberId,
    ownerName: result.ownerName,
  };
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

// ---- recordPaywallView（APP-FUNNEL-KPI・paywall 初回表示の匿名集計）------------------
// 目的＝「課金0」を paywall未到達／拒否に分離するための分母。集計整数のみ・個票なし。
// 認証は require するが uid は一切書かない（who ではなく how many のみを持つ）。
// クライアント側で端末ごとに1回だけ呼ぶ（recordPaywallViewOnce）。サーバ側は dedupe しない
// （複数回呼ばれても仕様どおり毎回 +1 する＝クライアント側の at-most-once 設計に依存する契約）。
exports.recordPaywallView = onCall(async (request) => {
  requireUid(request);
  const source = ['settings', 'limit', 'invite'].includes(
    request.data && request.data.source
  )
    ? request.data.source
    : 'settings';
  const ym = new Date(nowMs()).toISOString().slice(0, 7);
  const inc = FieldValue.increment(1);
  await db.collection('metrics').doc('paywall').set(
    {
      total: inc,
      callTotal: inc, // dedupe を経ない総呼出数。total との乖離は水増し検知に使う。
      byMonth: { [ym]: inc },
      bySource: { [source]: inc },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return { ok: true };
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

// ---- cleanupExpiredInvites（失効・取消招待の30日以内 機械削除・PP第14条1項）----------
// APP-INVITE-EXPIRE-CLEANUP: 毎日実行。invitations のうち revoked／期限切れ（pending 経過）で
// 保持期間（30日）を過ぎた doc を削除＝招待先メール・OTPハッシュ・呼び名・関係性の PII を消去。
// accepted（家族関係の記録）は対象外。選定は純関数 selectExpiredInviteIdsToDelete（テスト済）。
// TTL ではなく scheduled function 方式＝Timestamp 追加や TTL ポリシー設定（コンソール作業）不要で
// 選定ロジックを単体テストできる。region は setGlobalOptions（asia-northeast1）を継承。
exports.cleanupExpiredInvites = onSchedule(
  { schedule: 'every 24 hours', timeZone: 'Asia/Tokyo' },
  async () => {
    const now = nowMs();
    const snap = await db.collection('invitations').get();
    const docs = [];
    snap.forEach((d) => docs.push({ id: d.id, data: d.data() }));
    const ids = selectExpiredInviteIdsToDelete(docs, now, INVITE_CLEANUP_RETENTION_MS);
    for (let i = 0; i < ids.length; i += 400) {
      const batch = db.batch();
      ids.slice(i, i + 400).forEach((id) => batch.delete(db.collection('invitations').doc(id)));
      await batch.commit();
    }
    // eslint-disable-next-line no-console
    console.log(`[cleanupExpiredInvites] deleted ${ids.length} expired/revoked invitations`);
  }
);

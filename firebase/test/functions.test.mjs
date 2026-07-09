// ============================================================================
// きずなbaton — 招待サーバ化（P3）Cloud Functions 結合テスト
// ----------------------------------------------------------------------------
// Functions + Firestore + Auth エミュレータ上で callable を検証。
// 実行: firebase/ で `npm run test:functions:deps` （初回のみ）→ `npm run test:functions`
//   emulators:exec が3エミュレータを起動し各 *_EMULATOR_HOST を注入する。
//
// 権限モデル:
//   - Admin 相当の読み書き/seed は rules-unit-testing の withSecurityRulesDisabled。
//   - Auth（利用者作成/サインイン）と callable 呼び出しはクライアント SDK。
//   - OTP は issueInvite の戻り値に含まれない（サーバ化の肝）ため、
//     エミュレータ限定の `_devOutbox/{token}` を admin 読取して取得する。
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import otpLib from '../functions/lib/otp.js';
import constantsLib from '../functions/lib/constants.js';
import emailLib from '../functions/lib/email.js';

const { hashOtp } = otpLib;
const { USER_SUBCOLLECTIONS } = constantsLib;
const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES = readFileSync(join(__dirname, '..', 'firestore.rules'), 'utf8');
const PROJECT = 'demo-kizuna-baton';
const REGION = 'asia-northeast1';
const DAY = 24 * 60 * 60 * 1000;

// エミュレータのホスト（emulators:exec 注入）
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const FS_HOST = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':')[0];

let env;      // rules-unit-testing（admin seed / rules read 用）
let app, auth, functions;
let ownerUid, viewerUid;

const OWNER_EMAIL = 'owner@example.com';
const VIEWER_EMAIL = 'viewer@example.com';
const PW = 'passw0rd!';

const call = (name) => httpsCallable(functions, name);

async function expectReject(promise, codeSubstr) {
  try {
    await promise;
    assert.fail(`拒否されるべき呼び出しが成功した（期待コード: ${codeSubstr}）`);
  } catch (e) {
    const code = e && e.code ? String(e.code) : '';
    assert.ok(
      code.includes(codeSubstr),
      `期待コード '${codeSubstr}' を含まない: '${code}'（${e && e.message}）`
    );
  }
}

// admin（rules 無効）で任意 doc を読む
async function adminGet(path) {
  let out = null;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore(), path));
    out = snap.exists() ? snap.data() : null;
  });
  return out;
}
async function adminSet(path, data) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}
async function adminCount(collPath, predicate) {
  let n = 0;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDocs(collection(ctx.firestore(), collPath));
    snap.forEach((d) => { if (!predicate || predicate(d.data())) n++; });
  });
  return n;
}

async function signInOwner() {
  await signInWithEmailAndPassword(auth, OWNER_EMAIL, PW);
}
async function signInViewer() {
  await signInWithEmailAndPassword(auth, VIEWER_EMAIL, PW);
}

// OTP を dev アウトボックスから取得
async function otpFor(token) {
  const d = await adminGet(`_devOutbox/${token}`);
  assert.ok(d && d.otp, `_devOutbox に OTP が無い（token=${token}）`);
  return d.otp;
}

const consentArgs = {
  termsVersion: 'v3.1',
  privacyVersion: 'v3.2.5',
  residencyConfirmed: true,
  ageConfirmed: true,
};

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: RULES },
  });
  app = initializeApp({ projectId: PROJECT, apiKey: 'demo' });
  auth = getAuth(app);
  connectAuthEmulator(auth, `http://${AUTH_HOST}`, { disableWarnings: true });
  functions = getFunctions(app, REGION);
  connectFunctionsEmulator(functions, FS_HOST, 5001);

  const o = await createUserWithEmailAndPassword(auth, OWNER_EMAIL, PW);
  ownerUid = o.user.uid;
  const v = await createUserWithEmailAndPassword(auth, VIEWER_EMAIL, PW);
  viewerUid = v.user.uid;
  await signOut(auth);
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

// ---- issueInvite ----
test('issueInvite: 正常発行で invitation/member を作り OTP は返さない', async () => {
  await signInOwner();
  const res = await call('issueInvite')({
    inviteeEmail: 'sister@example.com',
    suggestedRelation: '子',
    suggestedName: '美咲',
  });
  const { token, viewerMemberId } = res.data;
  assert.match(token, /^[0-9a-f]{32}$/);
  assert.equal(res.data.otp, undefined, 'OTP が戻り値に含まれてはならない');
  assert.ok(viewerMemberId, 'viewerMemberId が返る');
  // 招待リンクはアプリ本体 URL + #invite=<token>（stage-2b: boot() の hash パーサが解釈）
  assert.ok(
    res.data.inviteLink.endsWith(`#invite=${token}`),
    `inviteLink が #invite=<token> 形式（実値: ${res.data.inviteLink}）`
  );

  const inv = await adminGet(`invitations/${token}`);
  assert.equal(inv.status, 'pending');
  assert.equal(inv.invitedBy, ownerUid);
  assert.equal(inv.otp, undefined, 'invitation に平文 OTP を保存してはならない');
  assert.ok(inv.otpHash, 'otpHash は保存される');

  const mem = await adminGet(`users/${ownerUid}/members/${viewerMemberId}`);
  assert.equal(mem.status, 'pending');
});

test('issueInvite: 不正な関係性・メールは invalid-argument', async () => {
  await signInOwner();
  await expectReject(
    call('issueInvite')({ inviteeEmail: 'a@b.com', suggestedRelation: '兄弟' }),
    'invalid-argument'
  );
  await expectReject(
    call('issueInvite')({ inviteeEmail: 'not-an-email', suggestedRelation: '子' }),
    'invalid-argument'
  );
});

test('issueInvite: 1日3件を超える発行は resource-exhausted', async () => {
  await signInOwner();
  for (let i = 0; i < 3; i++) {
    await call('issueInvite')({ inviteeEmail: `x${i}@e.com`, suggestedRelation: '子' });
  }
  await expectReject(
    call('issueInvite')({ inviteeEmail: 'x4@e.com', suggestedRelation: '子' }),
    'resource-exhausted'
  );
});

test('issueInvite: pending+accepted 5件を超える発行は resource-exhausted', async () => {
  // 24h より前の pending を5件 seed（per-day には効かせず pending 上限だけを検証）
  const old = Date.now() - 2 * DAY;
  for (let i = 0; i < 5; i++) {
    await adminSet(`invitations/seed${i}`, {
      token: `seed${i}`, invitedBy: ownerUid, status: 'pending', createdAtMs: old,
    });
  }
  await signInOwner();
  await expectReject(
    call('issueInvite')({ inviteeEmail: 'z@e.com', suggestedRelation: '子' }),
    'resource-exhausted'
  );
});

test('issueInvite: 未認証は unauthenticated', async () => {
  await signOut(auth);
  await expectReject(
    call('issueInvite')({ inviteeEmail: 'a@b.com', suggestedRelation: '子' }),
    'unauthenticated'
  );
});

// ---- acceptInvite（正常系）----
test('acceptInvite: 正しい OTP＋同意で share/consentLog/member/notification を作る', async () => {
  await signInOwner();
  const { token, viewerMemberId } = (
    await call('issueInvite')({ inviteeEmail: VIEWER_EMAIL, suggestedRelation: '配偶者', suggestedName: '花子' })
  ).data;
  const otp = await otpFor(token);

  await signInViewer();
  const acc = await call('acceptInvite')({ token, otp, displayName: '花子', ...consentArgs });
  assert.equal(acc.data.ok, true);
  assert.equal(acc.data.ownerUid, ownerUid);

  const share = await adminGet(`shares/${ownerUid}_${viewerUid}`);
  assert.equal(share.status, 'accepted');
  assert.equal(share.viewerMemberId, viewerMemberId, 'share の viewerMemberId は invitation と一致');

  const inv = await adminGet(`invitations/${token}`);
  assert.equal(inv.status, 'accepted');
  assert.equal(inv.acceptedByUid, viewerUid);

  const mem = await adminGet(`users/${ownerUid}/members/${viewerMemberId}`);
  assert.equal(mem.status, 'accepted');

  const consentN = await adminCount(`consentLogs/${viewerUid}/entries`);
  assert.equal(consentN, 1, 'consentLog が1件追記される');

  const notifN = await adminCount(`users/${ownerUid}/notifications`);
  assert.equal(notifN, 1, 'owner 通知が1件作られる');
});

// ---- 受諾通知メール（APP-INVITE-ACCEPT-NOTIFY v108・email.js を in-process で検証）----
// acceptInvite の実送信は別プロセス（functions runtime）の in-memory outbox に積まれ、
// エミュレータ越しの結合テストからは観測できない。email.js の 'log' プロバイダ挙動を
// この test プロセス内で直接検証する（FIRESTORE_EMULATOR_HOST 設定下＝isEmulator()true）。
test('email: sendInviteAcceptedEmail は log プロバイダで受諾通知を acceptOutbox に積む', async () => {
  emailLib._clearAcceptOutbox();
  const r = await emailLib.sendInviteAcceptedEmail({ to: 'owner@example.com', viewerName: '花子' });
  assert.equal(r.ok, true);
  assert.equal(r.provider, 'log');
  const ob = emailLib._getAcceptOutbox();
  assert.equal(ob.length, 1, '受諾通知が1件積まれる');
  assert.equal(ob[0].to, 'owner@example.com', '宛先は招待元本人（owner）のメール');
  assert.equal(ob[0].viewerName, '花子', '受諾家族の呼び名を含む');
});
test('email: sendInviteAcceptedEmail は呼び名未指定でも「ご家族」で送る', async () => {
  emailLib._clearAcceptOutbox();
  await emailLib.sendInviteAcceptedEmail({ to: 'o@example.com' });
  assert.equal(emailLib._getAcceptOutbox()[0].viewerName, 'ご家族');
});

// ---- acceptInvite（ownerName スナップショット・stage-2b）----
test('acceptInvite: owner の members/m1 があれば share に ownerName が転写される', async () => {
  // owner がミラー済み（members/m1 に本人名がある）状態を seed
  await adminSet(`users/${ownerUid}/members/m1`, { id: 'm1', name: '太郎', relation: '本人' });

  await signInOwner();
  const { token } = (
    await call('issueInvite')({ inviteeEmail: VIEWER_EMAIL, suggestedRelation: '配偶者', suggestedName: '花子' })
  ).data;
  const otp = await otpFor(token);

  await signInViewer();
  const acc = await call('acceptInvite')({ token, otp, ...consentArgs });
  assert.equal(acc.data.ownerName, '太郎', '戻り値に ownerName が含まれる');

  const share = await adminGet(`shares/${ownerUid}_${viewerUid}`);
  assert.equal(share.ownerName, '太郎', 'share doc に ownerName スナップショット');
});

test('acceptInvite: owner が members/m1 未ミラーなら ownerName は null', async () => {
  await signInOwner();
  const { token } = (
    await call('issueInvite')({ inviteeEmail: VIEWER_EMAIL, suggestedRelation: '子', suggestedName: '美咲' })
  ).data;
  const otp = await otpFor(token);

  await signInViewer();
  const acc = await call('acceptInvite')({ token, otp, ...consentArgs });
  assert.equal(acc.data.ownerName, null);

  const share = await adminGet(`shares/${ownerUid}_${viewerUid}`);
  assert.equal(share.ownerName, null, '未ミラーでは null（クライアントは「ご家族」表示）');
});

// ---- acceptInvite（異常系）----
test('acceptInvite: 誤 OTP は permission-denied で otpAttempts が増える', async () => {
  await signInOwner();
  const { token } = (
    await call('issueInvite')({ inviteeEmail: VIEWER_EMAIL, suggestedRelation: '子' })
  ).data;

  await signInViewer();
  await expectReject(
    call('acceptInvite')({ token, otp: '000000', ...consentArgs }),
    'permission-denied'
  );
  const inv = await adminGet(`invitations/${token}`);
  assert.equal(inv.otpAttempts, 1);
  assert.equal(inv.status, 'pending', '誤 OTP では受諾されない');
});

test('acceptInvite: OTP を5回間違えるとロック（permission-denied）', async () => {
  await signInOwner();
  const { token } = (
    await call('issueInvite')({ inviteeEmail: VIEWER_EMAIL, suggestedRelation: '子' })
  ).data;

  await signInViewer();
  for (let i = 0; i < 5; i++) {
    await expectReject(call('acceptInvite')({ token, otp: '000000', ...consentArgs }), 'permission-denied');
  }
  // 6回目: 正しい OTP でもロックで拒否される
  const otp = await otpFor(token);
  await expectReject(call('acceptInvite')({ token, otp, ...consentArgs }), 'permission-denied');
});

test('acceptInvite: 期限切れは failed-precondition', async () => {
  const token = 'a'.repeat(32);
  await adminSet(`invitations/${token}`, {
    token, invitedBy: ownerUid, status: 'pending', otpAttempts: 0,
    otpHash: hashOtp('123456', token), viewerMemberId: 'mZ',
    createdAtMs: Date.now() - 10 * DAY, expiresAtMs: Date.now() - 3 * DAY,
  });
  await signInViewer();
  await expectReject(
    call('acceptInvite')({ token, otp: '123456', ...consentArgs }),
    'failed-precondition'
  );
});

test('acceptInvite: revoked は failed-precondition', async () => {
  const token = 'b'.repeat(32);
  await adminSet(`invitations/${token}`, {
    token, invitedBy: ownerUid, status: 'revoked', otpAttempts: 0,
    otpHash: hashOtp('123456', token), viewerMemberId: 'mY',
    createdAtMs: Date.now(), expiresAtMs: Date.now() + DAY,
  });
  await signInViewer();
  await expectReject(
    call('acceptInvite')({ token, otp: '123456', ...consentArgs }),
    'failed-precondition'
  );
});

test('acceptInvite: 自分の招待を自分で受諾はできない', async () => {
  await signInOwner();
  const { token } = (
    await call('issueInvite')({ inviteeEmail: OWNER_EMAIL, suggestedRelation: '子' })
  ).data;
  const otp = await otpFor(token);
  // owner のままで受諾（owner==viewer）
  await expectReject(
    call('acceptInvite')({ token, otp, ...consentArgs }),
    'failed-precondition'
  );
});

// ---- revokeInvite ----
test('revokeInvite: pending を取消すと受諾不可になる', async () => {
  await signInOwner();
  const { token } = (
    await call('issueInvite')({ inviteeEmail: VIEWER_EMAIL, suggestedRelation: '子' })
  ).data;
  const otp = await otpFor(token);
  await call('revokeInvite')({ token });
  const inv = await adminGet(`invitations/${token}`);
  assert.equal(inv.status, 'revoked');

  await signInViewer();
  await expectReject(call('acceptInvite')({ token, otp, ...consentArgs }), 'failed-precondition');
});

// ---- unlinkShare（rules と接続＝真の境界がサーバであることの実証）----
test('unlinkShare: 停止すると家族は共有契約を read できなくなる', async () => {
  // 受諾で share を作る
  await signInOwner();
  const { token, viewerMemberId } = (
    await call('issueInvite')({ inviteeEmail: VIEWER_EMAIL, suggestedRelation: '配偶者' })
  ).data;
  const otp = await otpFor(token);
  await signInViewer();
  await call('acceptInvite')({ token, otp, ...consentArgs });

  // owner の契約（mode all）を seed
  await adminSet(`users/${ownerUid}/contracts/c1`, {
    id: 1, name: 'Netflix', amount: 1490, ownerId: 'm1',
    visibility: { mode: 'all', liveViewers: [], afterViewers: [] },
  });

  // 家族（viewerUid）は rules 経由で read できる
  const famCtx = env.authenticatedContext(viewerUid).firestore();
  await assertSucceeds(getDoc(doc(famCtx, `users/${ownerUid}/contracts/c1`)));

  // unlink → share revoked → read 不可
  await signInOwner();
  await call('unlinkShare')({ viewerUid });
  const share = await adminGet(`shares/${ownerUid}_${viewerUid}`);
  assert.equal(share.status, 'revoked');
  await assertFails(getDoc(doc(famCtx, `users/${ownerUid}/contracts/c1`)));

  // selected 判定にも使う viewerMemberId は保持されている（監査/再開時の一貫性）
  assert.ok(viewerMemberId);
});

// ---- selected モード＝クライアント member id ブリッジ（APP-V2 P3 client-wiring）----
test('issueInvite+accept: memberId 指定で selected 契約が家族に read 可・非対象は deny', async () => {
  await signInOwner();
  // クライアントが既存 member スロット 'm2' を指定して招待
  const { token, viewerMemberId } = (
    await call('issueInvite')({
      inviteeEmail: VIEWER_EMAIL, suggestedRelation: '配偶者', suggestedName: '花子', memberId: 'm2',
    })
  ).data;
  assert.equal(viewerMemberId, 'm2', 'クライアント指定の member id が viewerMemberId になる');
  const otp = await otpFor(token);

  await signInViewer();
  await call('acceptInvite')({ token, otp, ...consentArgs });

  const share = await adminGet(`shares/${ownerUid}_${viewerUid}`);
  assert.equal(share.viewerMemberId, 'm2', 'share の viewerMemberId が m2 で liveViewers と照合可能');

  // owner の契約を3種 seed（selected=m2 / selected=他 / private）
  await adminSet(`users/${ownerUid}/contracts/cSel`, {
    id: 101, name: '生命保険', amount: 18000, ownerId: 'm1',
    visibility: { mode: 'selected', liveViewers: ['m2'], afterViewers: [] },
  });
  await adminSet(`users/${ownerUid}/contracts/cOther`, {
    id: 102, name: '住宅ローン', amount: 85000, ownerId: 'm1',
    visibility: { mode: 'selected', liveViewers: ['m9'], afterViewers: [] },
  });
  await adminSet(`users/${ownerUid}/contracts/cPriv`, {
    id: 103, name: '趣味のサブスク', amount: 1200, ownerId: 'm1',
    visibility: { mode: 'private', liveViewers: [], afterViewers: [] },
  });

  const famCtx = env.authenticatedContext(viewerUid).firestore();
  // selected かつ liveViewers に m2 を含む → read 可
  await assertSucceeds(getDoc(doc(famCtx, `users/${ownerUid}/contracts/cSel`)));
  // selected だが m2 を含まない → deny
  await assertFails(getDoc(doc(famCtx, `users/${ownerUid}/contracts/cOther`)));
  // private → deny
  await assertFails(getDoc(doc(famCtx, `users/${ownerUid}/contracts/cPriv`)));
});

// ---- listInvites ----
test('listInvites: owner の一覧を OTP 抜きで返す', async () => {
  await signInOwner();
  await call('issueInvite')({ inviteeEmail: 'p@e.com', suggestedRelation: '子', suggestedName: 'A' });
  await call('issueInvite')({ inviteeEmail: 'q@e.com', suggestedRelation: '親', suggestedName: 'B' });
  const { data } = await call('listInvites')({});
  assert.equal(data.invites.length, 2);
  for (const it of data.invites) {
    assert.equal(it.otp, undefined);
    assert.equal(it.otpHash, undefined);
    assert.ok(it.token && it.status);
  }
});

// ---- deleteAccount（APP-V2-ACCOUNT-DELETE: 即時完全削除）----
// 注: 削除対象は各テスト専用の新規 Auth ユーザーで作る（共有 owner/viewer を消すと後続テストが壊れるため）。
test('deleteAccount: 未認証は unauthenticated', async () => {
  await signOut(auth);
  await expectReject(call('deleteAccount')({}), 'unauthenticated');
});

test('deleteAccount: 本人の全データ・共有・招待・Auth を即時完全削除する', async () => {
  // 専用 owner を新規作成（作成と同時にサインインされる）
  const DEL_OWNER_EMAIL = 'del-owner@example.com';
  const cred = await createUserWithEmailAndPassword(auth, DEL_OWNER_EMAIL, PW);
  const delUid = cred.user.uid;

  // uid 配下の全サブコレクション＋本体 doc＋同意ログを seed
  await adminSet(`users/${delUid}`, { displayName: '太郎', schemaVersion: 'v20' });
  for (const coll of USER_SUBCOLLECTIONS) {
    await adminSet(`users/${delUid}/${coll}/x1`, { seed: true });
  }
  await adminSet(`users/${delUid}/contracts/c1`, {
    id: 1, name: 'Netflix', amount: 1490, ownerId: 'm1',
    visibility: { mode: 'all', liveViewers: [], afterViewers: [] },
  });
  await adminSet(`consentLogs/${delUid}/entries/e1`, { ts: 1, action: 'cloud-sync-enabled' });

  // 招待発行 → 共有 viewer が受諾（invitation/share/member/notification を実フローで作る）
  const { token } = (
    await call('issueInvite')({ inviteeEmail: VIEWER_EMAIL, suggestedRelation: '配偶者', suggestedName: '花子' })
  ).data;
  const otp = await otpFor(token);
  await signInViewer();
  await call('acceptInvite')({ token, otp, ...consentArgs });

  // 削除前: 家族は rules 経由で契約を read できる
  const famCtx = env.authenticatedContext(viewerUid).firestore();
  await assertSucceeds(getDoc(doc(famCtx, `users/${delUid}/contracts/c1`)));

  // 本人（del-owner）に戻って削除実行
  await signInWithEmailAndPassword(auth, DEL_OWNER_EMAIL, PW);
  const res = await call('deleteAccount')({});
  assert.equal(res.data.ok, true);

  // users/{uid} サブツリー・同意ログ・招待・share がすべて消える
  assert.equal(await adminGet(`users/${delUid}`), null, 'users/{uid} 本体 doc が消える');
  for (const coll of USER_SUBCOLLECTIONS) {
    assert.equal(await adminCount(`users/${delUid}/${coll}`), 0, `${coll} が空になる`);
  }
  assert.equal(await adminCount(`consentLogs/${delUid}/entries`), 0, '同意監査ログが消える');
  assert.equal(await adminGet(`invitations/${token}`), null, '発行済み招待が消える');
  assert.equal(await adminGet(`shares/${delUid}_${viewerUid}`), null, 'share が消える');

  // 家族の read は rules で遮断される（share 消滅＝hasAcceptedShare false）
  await assertFails(getDoc(doc(famCtx, `users/${delUid}/contracts/c1`)));

  // 受諾した viewer 側の consentLog は残る（他ユーザーのデータに非干渉）
  assert.equal(await adminCount(`consentLogs/${viewerUid}/entries`), 1, 'viewer の同意ログは不変');

  // Auth ユーザーが消え再サインイン不可
  await signOut(auth);
  let signInFailed = false;
  try {
    await signInWithEmailAndPassword(auth, DEL_OWNER_EMAIL, PW);
  } catch (e) {
    signInFailed = true;
  }
  assert.ok(signInFailed, 'Auth ユーザーが削除され再サインインできない');
});

test('deleteAccount: viewer 側の削除は owner のデータに干渉しない（member は unlinked 化）', async () => {
  // 専用 viewer を新規作成
  const DEL_VIEWER_EMAIL = 'del-viewer@example.com';
  const cred = await createUserWithEmailAndPassword(auth, DEL_VIEWER_EMAIL, PW);
  const delViewerUid = cred.user.uid;
  await signOut(auth);

  // 共有 owner が招待発行＋契約 seed
  await signInOwner();
  const { token, viewerMemberId } = (
    await call('issueInvite')({ inviteeEmail: DEL_VIEWER_EMAIL, suggestedRelation: '子' })
  ).data;
  const otp = await otpFor(token);
  await adminSet(`users/${ownerUid}/contracts/c1`, {
    id: 1, name: 'Netflix', amount: 1490, ownerId: 'm1',
    visibility: { mode: 'all', liveViewers: [], afterViewers: [] },
  });

  // del-viewer が受諾 → 自分のアカウントを削除
  await signInWithEmailAndPassword(auth, DEL_VIEWER_EMAIL, PW);
  await call('acceptInvite')({ token, otp, ...consentArgs });
  const res = await call('deleteAccount')({});
  assert.equal(res.data.ok, true);

  // share は消え、owner の member doc は unlinked 化（unlinkShare と同型の後片付け）
  assert.equal(await adminGet(`shares/${ownerUid}_${delViewerUid}`), null);
  const mem = await adminGet(`users/${ownerUid}/members/${viewerMemberId}`);
  assert.equal(mem.status, 'unlinked', 'owner 側 member は unlinked 化される');

  // owner のデータは不変
  const c1 = await adminGet(`users/${ownerUid}/contracts/c1`);
  assert.equal(c1 && c1.name, 'Netflix', 'owner の契約は不変');

  // 受諾済み invitation（del-viewer の uid・メールを含む PII）も消える
  assert.equal(await adminGet(`invitations/${token}`), null);
  // del-viewer 自身の consentLog も消える
  assert.equal(await adminCount(`consentLogs/${delViewerUid}/entries`), 0);
});

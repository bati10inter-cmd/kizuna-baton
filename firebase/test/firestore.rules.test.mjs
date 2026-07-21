// ============================================================================
// きずなbaton — Firestore セキュリティルール エミュレータテスト（P2a）
// ----------------------------------------------------------------------------
// canViewContract(live) の写像（firestore.rules）を rules-unit-testing で検証。
// 実行: firebase/ で `npm run test:rules`
//   （firebase emulators:exec が Firestore エミュレータを起動し FIRESTORE_EMULATOR_HOST を注入）
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
import {
  doc, getDoc, setDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES = readFileSync(join(__dirname, '..', 'firestore.rules'), 'utf8');

const OWNER = 'uidOwner';   // 本人（契約の所有者）
const FAM = 'uidFamily';    // 家族（閲覧者）
const FAM_MID = 'm2';       // 家族の memberId（owner の名簿上）
const STRANGER = 'uidOther';

let env;

// owner の契約1件を admin 権限（ルール無効）で seed するヘルパー
async function seedContract(cid, visibility) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const data = { id: 1, name: 'Netflix', amount: 1490, ownerId: 'm1' };
    if (visibility !== undefined) data.visibility = visibility;
    await setDoc(doc(db, `users/${OWNER}/contracts/${cid}`), data);
  });
}
async function seedAsset(aid, visibility) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, `users/${OWNER}/assets/${aid}`), {
      id: 1, type: 'bank', name: '〇〇銀行', ownerId: 'm1', visibility,
    });
  });
}
async function seedCard(cardId) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `users/${OWNER}/cards/${cardId}`), {
      id: 1, ownerId: 'm1', brand: '三井住友VISA', last4: '1234', payDay: 27,
    });
  });
}
// owner → FAM の share を seed（status と viewerMemberId を指定）
async function seedShare(status, viewerMemberId = FAM_MID) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `shares/${OWNER}_${FAM}`), {
      ownerUid: OWNER, viewerUid: FAM, viewerMemberId, status,
    });
  });
}

const ownerDb = () => env.authenticatedContext(OWNER).firestore();
const famDb = () => env.authenticatedContext(FAM).firestore();
const strangerDb = () => env.authenticatedContext(STRANGER).firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-kizuna-baton',
    firestore: { rules: RULES },
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

// ---- 本人（owner） ----
test('1. 本人は自分の契約を read/write できる', async () => {
  const ref = doc(ownerDb(), `users/${OWNER}/contracts/c1`);
  await assertSucceeds(setDoc(ref, { id: 1, name: 'X', amount: 100, ownerId: 'm1' }));
  await assertSucceeds(getDoc(ref));
});

// ---- share なし ----
test('2. 承諾 share を持たない家族は契約を read できない（mode all でも）', async () => {
  await seedContract('c1', { mode: 'all', liveViewers: [], afterViewers: [] });
  await assertFails(getDoc(doc(famDb(), `users/${OWNER}/contracts/c1`)));
});

// ---- mode all ----
test('3. 承諾 share ＋ mode all → 家族は read できる', async () => {
  await seedShare('accepted');
  await seedContract('c1', { mode: 'all', liveViewers: [], afterViewers: [] });
  await assertSucceeds(getDoc(doc(famDb(), `users/${OWNER}/contracts/c1`)));
});

// ---- visibility 未設定（後方互換 = all） ----
test('4. 承諾 share ＋ visibility 未設定（後方互換=all）→ read できる', async () => {
  await seedShare('accepted');
  await seedContract('c1', undefined);
  await assertSucceeds(getDoc(doc(famDb(), `users/${OWNER}/contracts/c1`)));
});

// ---- mode private ----
test('5. 承諾 share ＋ mode private → 家族は read できない', async () => {
  await seedShare('accepted');
  await seedContract('c1', { mode: 'private', liveViewers: [], afterViewers: [] });
  await assertFails(getDoc(doc(famDb(), `users/${OWNER}/contracts/c1`)));
});

// ---- mode after_only（emergencyMode ゲート・live 非実効） ----
test('6. 承諾 share ＋ mode after_only → live では read できない', async () => {
  await seedShare('accepted');
  await seedContract('c1', { mode: 'after_only', liveViewers: [], afterViewers: [] });
  await assertFails(getDoc(doc(famDb(), `users/${OWNER}/contracts/c1`)));
});

// ---- mode selected（対象内） ----
test('7. 承諾 share ＋ selected・liveViewers に自分の memberId を含む → read できる', async () => {
  await seedShare('accepted', FAM_MID);
  await seedContract('c1', { mode: 'selected', liveViewers: [FAM_MID], afterViewers: [] });
  await assertSucceeds(getDoc(doc(famDb(), `users/${OWNER}/contracts/c1`)));
});

// ---- mode selected（対象外） ----
test('8. 承諾 share ＋ selected・liveViewers に自分を含まない → read できない', async () => {
  await seedShare('accepted', FAM_MID);
  await seedContract('c1', { mode: 'selected', liveViewers: ['m3'], afterViewers: [] });
  await assertFails(getDoc(doc(famDb(), `users/${OWNER}/contracts/c1`)));
});

// ---- share が未承諾 ----
test('9a. share が pending → read できない', async () => {
  await seedShare('pending');
  await seedContract('c1', { mode: 'all', liveViewers: [], afterViewers: [] });
  await assertFails(getDoc(doc(famDb(), `users/${OWNER}/contracts/c1`)));
});
test('9b. share が revoked → read できない', async () => {
  await seedShare('revoked');
  await seedContract('c1', { mode: 'all', liveViewers: [], afterViewers: [] });
  await assertFails(getDoc(doc(famDb(), `users/${OWNER}/contracts/c1`)));
});

// ---- viewer は write 不可 ----
test('10. 承諾 share を持つ家族でも他人の契約に write できない', async () => {
  await seedShare('accepted');
  await seedContract('c1', { mode: 'all', liveViewers: [], afterViewers: [] });
  await assertFails(setDoc(doc(famDb(), `users/${OWNER}/contracts/c1`), { hacked: true }));
});

// ---- assets（契約と同型） ----
test('11a. 承諾 share ＋ asset mode all → read できる', async () => {
  await seedShare('accepted');
  await seedAsset('a1', { mode: 'all', liveViewers: [], afterViewers: [] });
  await assertSucceeds(getDoc(doc(famDb(), `users/${OWNER}/assets/a1`)));
});
test('11b. 承諾 share ＋ asset mode private → read できない', async () => {
  await seedShare('accepted');
  await seedAsset('a1', { mode: 'private', liveViewers: [], afterViewers: [] });
  await assertFails(getDoc(doc(famDb(), `users/${OWNER}/assets/a1`)));
});

// ---- cards（owner-only） ----
test('12. カードは承諾 share を持つ家族でも read できない（owner-only）', async () => {
  await seedShare('accepted');
  await seedCard('card1');
  await assertFails(getDoc(doc(famDb(), `users/${OWNER}/cards/card1`)));
  await assertSucceeds(getDoc(doc(ownerDb(), `users/${OWNER}/cards/card1`)));
});

// ---- contractSecrets（所在メモ・owner-only／APP-INVITE-SECRET-SPLIT v108） ----
async function seedContractSecret(cid) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `users/${OWNER}/contractSecrets/${cid}`), {
      cid, secret: '引落口座は通帳に記載',
    });
  });
}
test('12b. 所在メモ(contractSecrets)は承諾 share を持つ家族でも read できない（owner-only）', async () => {
  await seedShare('accepted');
  await seedContractSecret('c1');
  // 家族は get も list も不可・本人は read/write 可
  await assertFails(getDoc(doc(famDb(), `users/${OWNER}/contractSecrets/c1`)));
  await assertFails(getDocs(query(collection(famDb(), `users/${OWNER}/contractSecrets`))));
  await assertSucceeds(getDoc(doc(ownerDb(), `users/${OWNER}/contractSecrets/c1`)));
  await assertSucceeds(
    setDoc(doc(ownerDb(), `users/${OWNER}/contractSecrets/c2`), { cid: 'c2', secret: 'x' })
  );
});

// ---- consentLogs（追記のみ） ----
test('13. consentLogs は本人 create 可・update/delete 不可', async () => {
  const ref = doc(ownerDb(), `consentLogs/${OWNER}/entries/e1`);
  await assertSucceeds(setDoc(ref, { ts: '2026-07-07', actor: 'owner' }));
  // 既存エントリの改変・削除は禁止
  await assertFails(setDoc(ref, { ts: '2026-07-08', actor: 'owner' }));
  await assertFails(deleteDoc(ref));
  // 他人の consentLog は作れない
  await assertFails(setDoc(doc(famDb(), `consentLogs/${OWNER}/entries/e2`), { ts: 'x' }));
});

// ---- invitations / shares クライアント書込禁止 ----
test('14a. invitations へのクライアント write は禁止', async () => {
  await assertFails(setDoc(doc(ownerDb(), 'invitations/tok1'), { status: 'pending' }));
});
test('14b. shares へのクライアント write は禁止（P3 サーバ専用）', async () => {
  await assertFails(setDoc(doc(ownerDb(), `shares/${OWNER}_${FAM}`), { status: 'accepted' }));
});
test('14c. shares は当事者のみ read 可', async () => {
  await seedShare('accepted');
  await assertSucceeds(getDoc(doc(ownerDb(), `shares/${OWNER}_${FAM}`)));   // owner
  await assertSucceeds(getDoc(doc(famDb(), `shares/${OWNER}_${FAM}`)));     // viewer
  await assertFails(getDoc(doc(strangerDb(), `shares/${OWNER}_${FAM}`)));   // 第三者
});

// ============================================================================
// stage-2b: viewer の list クエリ（cross-account read）
//   list ルールはクエリフィルタからの静的証明が必要。クライアントの実クエリと
//   同形のクエリで検証する（Q-A: mode=='all' / Q-B: selected+array-contains）。
// ============================================================================

// viewer が実際に発行する2クエリ
const qAll = (db) => query(
  collection(db, `users/${OWNER}/contracts`),
  where('visibility.mode', '==', 'all'),
);
const qSelected = (db, mid) => query(
  collection(db, `users/${OWNER}/contracts`),
  where('visibility.mode', '==', 'selected'),
  where('visibility.liveViewers', 'array-contains', mid),
);

test('15a. 承諾 share ＋ Q-A（mode all クエリ）→ list できる', async () => {
  await seedShare('accepted');
  await seedContract('c1', { mode: 'all', liveViewers: [], afterViewers: [] });
  await seedContract('c2', { mode: 'private', liveViewers: [], afterViewers: [] });
  const snap = await assertSucceeds(getDocs(qAll(famDb())));
  assert.equal(snap.size, 1); // private はクエリ条件で除外され all のみ
});

test('15b. 承諾 share ＋ Q-B（selected＋array-contains 自分の memberId）→ list できる', async () => {
  await seedShare('accepted', FAM_MID);
  await seedContract('c1', { mode: 'selected', liveViewers: [FAM_MID], afterViewers: [] });
  await seedContract('c2', { mode: 'selected', liveViewers: ['m3'], afterViewers: [] });
  const snap = await assertSucceeds(getDocs(qSelected(famDb(), FAM_MID)));
  assert.equal(snap.size, 1); // 自分が対象の契約のみ
});

test('15c. フィルタ無しの全件 list は拒否（証明不能）', async () => {
  await seedShare('accepted');
  await seedContract('c1', { mode: 'all', liveViewers: [], afterViewers: [] });
  await assertFails(getDocs(collection(famDb(), `users/${OWNER}/contracts`)));
});

test('15d. share 無し/revoked では Q-A も拒否', async () => {
  await seedContract('c1', { mode: 'all', liveViewers: [], afterViewers: [] });
  await assertFails(getDocs(qAll(famDb())));           // share なし
  await seedShare('revoked');
  await assertFails(getDocs(qAll(famDb())));           // revoked
});

test('15e. Q-B で share の viewerMemberId と異なる memberId を指定 → 拒否', async () => {
  await seedShare('accepted', FAM_MID); // share 上の自分は m2
  await seedContract('c1', { mode: 'selected', liveViewers: ['m3'], afterViewers: [] });
  await assertFails(getDocs(qSelected(famDb(), 'm3'))); // 他人の memberId でのなりすましクエリ
});

test('15f. mode private を対象にした list クエリは拒否', async () => {
  await seedShare('accepted');
  await seedContract('c1', { mode: 'private', liveViewers: [], afterViewers: [] });
  await assertFails(getDocs(query(
    collection(famDb(), `users/${OWNER}/contracts`),
    where('visibility.mode', '==', 'private'),
  )));
});

test('15g. 本人はフィルタ無し全件 list 可（従来どおり）', async () => {
  await seedContract('c1', { mode: 'private', liveViewers: [], afterViewers: [] });
  const snap = await assertSucceeds(getDocs(collection(ownerDb(), `users/${OWNER}/contracts`)));
  assert.equal(snap.size, 1);
});

// ---- shares の list クエリ（フィールドベース化の検証） ----
test('16a. viewer は自分宛て shares を where(viewerUid==自分) で list できる', async () => {
  await seedShare('accepted');
  const snap = await assertSucceeds(getDocs(query(
    collection(famDb(), 'shares'),
    where('viewerUid', '==', FAM),
    where('status', '==', 'accepted'),
  )));
  assert.equal(snap.size, 1);
});

test('16b. 第三者は他人宛て shares を list できない', async () => {
  await seedShare('accepted');
  await assertFails(getDocs(query(
    collection(strangerDb(), 'shares'),
    where('viewerUid', '==', FAM),
  )));
});

test('16c. owner は自分発行の shares を where(ownerUid==自分) で list できる', async () => {
  await seedShare('accepted');
  const snap = await assertSucceeds(getDocs(query(
    collection(ownerDb(), 'shares'),
    where('ownerUid', '==', OWNER),
  )));
  assert.equal(snap.size, 1);
});

// ---- assets の list（contracts と同型） ----
test('17. 承諾 share ＋ assets Q-A → list でき、private は載らない', async () => {
  await seedShare('accepted');
  await seedAsset('a1', { mode: 'all', liveViewers: [], afterViewers: [] });
  const snap = await assertSucceeds(getDocs(query(
    collection(famDb(), `users/${OWNER}/assets`),
    where('visibility.mode', '==', 'all'),
  )));
  assert.equal(snap.size, 1);
});

// ---- metrics（APP-FUNNEL-KPI・集計整数のみ・書込は Cloud Function 専用） ----
test('18a. metrics へのクライアント write は禁止（本人でも不可）', async () => {
  await assertFails(setDoc(doc(ownerDb(), 'metrics/paywall'), { total: 1 }));
});

test('18b. metrics へのクライアント read は禁止（本人でも不可）', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'metrics/paywall'), { total: 1 });
  });
  await assertFails(getDoc(doc(ownerDb(), 'metrics/paywall')));
});

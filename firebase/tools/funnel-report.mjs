#!/usr/bin/env node
// ============================================================================
// きずなbaton — 5段階ファネル 遡及集計スクリプト（APP-FUNNEL-KPI）
// ----------------------------------------------------------------------------
// 対象: 第2段（実契約3件以上）・第3段（招待受諾）を本番 Firestore から集計する。
// 第4段（paywall 初回表示）は本番 Firestore の metrics/paywall を1回読むだけ。
// 第1段（install）・第5段（purchase）は App Store Connect 由来＝本スクリプトの対象外。
//
// 実行方法（オーナー手動実行・CI 組込みなし）:
//   1. サービスアカウント鍵を用意する（リポジトリ外。例: ~/.config/kizuna-baton/sa.json）。
//      Firebase コンソール → プロジェクト設定 → サービスアカウント → 新しい秘密鍵を生成。
//   2. GOOGLE_APPLICATION_CREDENTIALS=~/.config/kizuna-baton/sa.json npm run report:funnel
//      （除外したいテスト用 uid があれば --exclude uid1,uid2 を付ける）
//
// 出力規律（厳守）: 個票行は一切出力しない。uid・契約名・単一アカウントに帰属する数値は
// 出さない。出力はヒストグラムと合計のみ（結果は git 管理下の monitoring-log.md に貼られるため）。
// ============================================================================

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- 引数 ----
const args = process.argv.slice(2);
const excludeArg = args.find((a) => a.startsWith('--exclude='));
const EXCLUDE_UIDS = new Set(
  excludeArg ? excludeArg.slice('--exclude='.length).split(',').filter(Boolean) : []
);

// ---- サンプル契約テーブルをアプリ本体から実行時パース（コピー乖離防止）----
// shukatsu-prototype.html:SAMPLE_CONTRACT_NAMES_BY_ID と完全一致していることが前提。
// パース結果が12件でなければ abort（黙って続行すると、サンプルを実契約として数えて分子が水増しされる）。
function loadSampleTable() {
  const htmlPath = join(__dirname, '..', '..', 'shukatsu-prototype.html');
  const html = readFileSync(htmlPath, 'utf8');
  const start = html.indexOf('const SAMPLE_CONTRACT_NAMES_BY_ID=Object.freeze({');
  if (start === -1) {
    throw new Error(
      'SAMPLE_CONTRACT_NAMES_BY_ID が shukatsu-prototype.html に見つからない。テーブル形式が変わった可能性＝要手動確認。'
    );
  }
  const end = html.indexOf('});', start);
  const block = html.slice(start, end);
  const table = {};
  // id:'name' 形式（number key: 'string value'）を拾う。ダブル/シングルクオート両対応。
  const re = /(\d+)\s*:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(block))) {
    table[m[1]] = m[2];
  }
  const count = Object.keys(table).length;
  if (count !== 12) {
    throw new Error(
      `SAMPLE_CONTRACT_NAMES_BY_ID のパース結果が${count}件（期待12件）。` +
      'アプリ側テーブルが変更された可能性＝集計を中断する。手動で本スクリプトの正規表現を確認すること。'
    );
  }
  return table;
}

function isSample(sampleTable, contract) {
  return sampleTable[String(contract.id)] === contract.name;
}

async function main() {
  const sampleTable = loadSampleTable();

  admin.initializeApp();
  const db = admin.firestore();

  console.log(`=== きずなbaton 5段階ファネル (as of ${new Date().toISOString().slice(0, 10)} / 除外uid: ${EXCLUDE_UIDS.size}件) ===`);

  // ---- 第2段: 実契約3件以上（クラウド保存ユーザー限定）----
  const userRefs = (await db.collection('users').listDocuments()).filter(
    (r) => !EXCLUDE_UIDS.has(r.id)
  );
  const totalUsers = userRefs.length;

  const histogram = { 0: 0, 1: 0, 2: 0, '3+': 0 };
  const s2Uids = new Set(); // 実契約3件以上に到達したuid（第3段との交差判定に使う。出力には出さない）
  let reads = userRefs.length; // count() は概算1readずつ

  for (const ref of userRefs) {
    const countSnap = await ref.collection('contracts').count().get();
    const total = countSnap.data().count;
    if (total < 3) {
      // 非サンプル数 ≤ 総数 なので、総数<3 はこの時点で確実に3件未満＝1件も読まずに除外できる
      const bucket = total >= 3 ? '3+' : total;
      histogram[bucket] = (histogram[bucket] || 0) + 1;
      continue;
    }
    const snap = await ref.collection('contracts').select('id', 'name', 'archived').get();
    reads += snap.size;
    const real = snap.docs
      .map((d) => d.data())
      .filter((c) => !c.archived && !isSample(sampleTable, c)).length;
    const bucket = real >= 3 ? '3+' : real;
    histogram[bucket] = (histogram[bucket] || 0) + 1;
    if (real >= 3) s2Uids.add(ref.id);
  }

  // ---- 第3段: 招待受諾（世帯単位・revoked も ever-accepted に含める）----
  const sharesSnap = await db.collection('shares').select('ownerUid', 'status', 'acceptedAtMs').get();
  reads += sharesSnap.size;
  const shares = sharesSnap.docs.map((d) => d.data()).filter((s) => !EXCLUDE_UIDS.has(s.ownerUid));
  const everAcceptedOwners = new Set(shares.filter((s) => s.acceptedAtMs != null).map((s) => s.ownerUid));
  const currentlyAcceptedOwners = new Set(
    shares.filter((s) => s.acceptedAtMs != null && s.status === 'accepted').map((s) => s.ownerUid)
  );
  const acceptedLinkCount = shares.filter((s) => s.acceptedAtMs != null).length;

  const s2AndS3 = [...everAcceptedOwners].filter((uid) => s2Uids.has(uid)).length;
  const s3OnlyNotS2 = [...everAcceptedOwners].filter((uid) => !s2Uids.has(uid)).length;

  // ---- 第4段: paywall 初回表示（既存の集計ドキュメントを1回読むだけ）----
  const paywallSnap = await db.collection('metrics').doc('paywall').get();
  reads += 1;
  const paywall = paywallSnap.exists ? paywallSnap.data() : null;

  // ---- 出力（個票なし・ヒストグラムと合計のみ）----
  console.log('[S1] install (ASC Units)                      : ____  ※App Store Connect から手入力');
  console.log(`[--] クラウド保存ユーザー数 users/*             : ${totalUsers}`);
  console.log(
    `[S2] 実契約数の分布(サンプル除外・非archived)  : 0件:${histogram[0]||0} / 1件:${histogram[1]||0} / 2件:${histogram[2]||0} / 3件以上:${histogram['3+']||0}`
  );
  const s2Rate = totalUsers ? ((histogram['3+'] || 0) / totalUsers * 100).toFixed(1) : '0.0';
  console.log(`[S2] 3件以上到達（世帯）                        : ${histogram['3+']||0}  (${s2Rate}%)`);
  console.log(
    `[S3] 招待受諾≥1（世帯・ever＝revoked含む）      : ${everAcceptedOwners.size}  (現在有効 ${currentlyAcceptedOwners.size} / revokedのみ ${everAcceptedOwners.size - currentlyAcceptedOwners.size})`
  );
  console.log(`[S3] 受諾リンク総数                             : ${acceptedLinkCount}`);
  console.log(`[S2∩S3]                                         : ${s2AndS3}  (S3のみ＝S2未達: ${s3OnlyNotS2} ← 要確認)`);
  if (paywall) {
    const byMonth = Object.entries(paywall.byMonth || {}).map(([k, v]) => `${k}:${v}`).join(' ');
    const bySource = Object.entries(paywall.bySource || {}).map(([k, v]) => `${k}:${v}`).join(' ');
    console.log(
      `[S4] paywall 初回表示 metrics/paywall           : total=${paywall.total||0} / callTotal=${paywall.callTotal||0} / byMonth[${byMonth}] / bySource[${bySource}]`
    );
    const gap = (paywall.callTotal || 0) - (paywall.total || 0);
    if (gap > 0) {
      console.log(`     ⚠ callTotal と total の乖離 = ${gap}（水増しの可能性。乖離が大きい場合はゲート判定に使わないこと）`);
    }
  } else {
    console.log('[S4] paywall 初回表示 metrics/paywall           : (doc未作成＝まだ1件も計上されていない)');
  }
  console.log('[S5] purchase (ASC)                             : ____  ※App Store Connect から手入力');
  console.log(`--- 概算読み取り数: ${reads} reads ---`);
  console.log('');
  console.log('※ この出力を marketing/monitoring-log.md の「5段階ファネル計測」節にバイアス注記とあわせて貼ること。');

  await admin.app().delete();
}

main().catch((e) => {
  console.error('funnel-report failed:', e && e.message ? e.message : e);
  process.exitCode = 1;
});

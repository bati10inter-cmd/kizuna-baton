#!/usr/bin/env node
// ============================================================================
// きずなbaton — 保留中の招待の集計（OPS-EMAIL-RESEND の切替条件の実測用・読み取りのみ）
// ----------------------------------------------------------------------------
// メール配信事業者を Resend へ切り替える前に、「旧 PP（v5.4 未満）のまま発行された
// pending 招待」が残っていないかを数える。残っていれば、受諾時の通知メールが本人の
// 新しい同意なしに Resend 経由になるため、期限切れ（最長7日）を待ってから切り替える。
//
// 実行方法（オーナー手動実行・CI 組込みなし）:
//   1. サービスアカウント鍵を用意する（リポジトリ外。例: ~/.config/kizuna-baton/sa.json）。
//   2. GOOGLE_APPLICATION_CREDENTIALS=~/.config/kizuna-baton/sa.json npm run report:pending-invites
//
// 出力規律（厳守）: 個票は出さない（token・uid・メールアドレス・呼び名を出力しない）。
// 出力は件数と、最も遅い有効期限の日付のみ。
// ============================================================================

import admin from 'firebase-admin';

const MIN_PP = 'v5.4'; // functions/lib/constants.js RESEND_MIN_PRIVACY_VERSION と同値

function parseVersion(raw) {
  const m = /^v(\d+)\.(\d+)(?:\.(\d+))?$/.exec(typeof raw === 'string' ? raw.trim() : '');
  return m ? [Number(m[1]), Number(m[2]), Number(m[3] || 0)] : null;
}
function meetsMin(raw) {
  const a = parseVersion(raw);
  const b = parseVersion(MIN_PP);
  if (!a) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
}

async function main() {
  admin.initializeApp();
  const db = admin.firestore();
  const now = Date.now();

  const snap = await db.collection('invitations').where('status', '==', 'pending').get();
  let active = 0; // 期限内の pending
  let activeOldConsent = 0; // 期限内で ppVersion が v5.4 未満または未記録
  let latestOldExpiry = 0;
  let expiredPending = 0; // 期限切れだが cleanup 前の pending（受諾不可＝通知も発生しない）

  snap.forEach((d) => {
    const v = d.data();
    const exp = typeof v.expiresAtMs === 'number' ? v.expiresAtMs : 0;
    if (exp <= now) {
      expiredPending++;
      return;
    }
    active++;
    if (!meetsMin(v.ppVersion)) {
      activeOldConsent++;
      if (exp > latestOldExpiry) latestOldExpiry = exp;
    }
  });

  console.log(`=== 保留中の招待 (as of ${new Date(now).toISOString()}) ===`);
  console.log(`期限内の pending: ${active} 件`);
  console.log(`  うち PP ${MIN_PP} 未満／版数未記録: ${activeOldConsent} 件`);
  console.log(`期限切れの pending（受諾不可）: ${expiredPending} 件`);
  if (activeOldConsent > 0) {
    console.log(
      `→ 切替は ${new Date(latestOldExpiry).toISOString()} 以降（旧同意の招待がすべて期限切れになってから）`
    );
  } else {
    console.log('→ 切替条件（旧同意の pending 0件）を満たしています');
  }
}

main().catch((e) => {
  console.error(e && e.message);
  process.exit(1);
});

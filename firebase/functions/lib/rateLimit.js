'use strict';

const {
  INVITE_MAX_PENDING_ACCEPTED,
  INVITE_MAX_PER_DAY,
} = require('./constants');

// ============================================================================
// レート制限（純関数・サーバ側で強制）
// 入力は owner の既存 invitation の要約リスト（Firestore 集計結果）。
//   invites: [{ status, createdAtMs }]
//   nowMs:   現在時刻（テスト容易化のため注入）
// 返り値: { ok:true } もしくは { ok:false, message }
// ============================================================================

function checkIssueAllowed(invites, nowMs) {
  const list = Array.isArray(invites) ? invites : [];

  // pending + accepted の同時保有数
  const activeCount = list.filter(
    (i) => i.status === 'pending' || i.status === 'accepted'
  ).length;
  if (activeCount >= INVITE_MAX_PENDING_ACCEPTED) {
    return {
      ok: false,
      message: `招待できるご家族は同時に${INVITE_MAX_PENDING_ACCEPTED}人までです。未受諾の招待を取り消すか、受諾済みの共有を停止してください。`,
    };
  }

  // 直近 24h の発行数
  const dayAgo = nowMs - 24 * 60 * 60 * 1000;
  const todayCount = list.filter(
    (i) => typeof i.createdAtMs === 'number' && i.createdAtMs > dayAgo
  ).length;
  if (todayCount >= INVITE_MAX_PER_DAY) {
    return {
      ok: false,
      message: `1日に発行できる招待は${INVITE_MAX_PER_DAY}件までです。時間をおいて再度お試しください。`,
    };
  }

  return { ok: true };
}

module.exports = { checkIssueAllowed };

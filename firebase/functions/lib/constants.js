'use strict';

// ============================================================================
// きずなbaton — 招待サーバ化（P3）共有定数
// ----------------------------------------------------------------------------
// クライアントモック（shukatsu-prototype.html:1622-1625）のレート定数を
// **サーバ側の正**として移植する。クライアント定数は将来 UX 表示用に残置。
// ============================================================================

// pending + accepted の合計上限（1 owner あたり同時に持てる関係数）
const INVITE_MAX_PENDING_ACCEPTED = 5;
// 1 owner が 24h に発行できる招待の上限
const INVITE_MAX_PER_DAY = 3;
// 招待の有効期限（発行から）
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
// OTP 誤入力の許容回数（超過でロック）
const OTP_MAX_ATTEMPTS = 5;
// β版で許可する関係性（3区分のみ・invitation-flow-design.md §2）
const ALLOWED_RELATIONS = ['配偶者', '子', '親'];
// users/{uid} 配下のサブコレクション一覧（APP-V2-ACCOUNT-DELETE）。
// recursiveDelete が実削除を担うため網羅必須ではないが、テストの seed/検証と共有する正のリスト。
const USER_SUBCOLLECTIONS = [
  'contracts',
  'assets',
  'cards',
  'members',
  'categories',
  'notifications',
];

module.exports = {
  INVITE_MAX_PENDING_ACCEPTED,
  INVITE_MAX_PER_DAY,
  INVITE_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  ALLOWED_RELATIONS,
  USER_SUBCOLLECTIONS,
};

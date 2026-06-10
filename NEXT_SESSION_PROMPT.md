# きずなbaton 次セッション開始プロンプト（2026-06-10 更新 / **[アプリ v65 デプロイ済 2026-06-10]** β上限到達時の任意アンケート（感想3択＋任意一言→Formspree `f/xredoben` source=after_beta_limit）追加＋PP v3.2.4（第2条/第7条 Formspree開示）＋`CONSENT_KEY:v23→:v24`＝再同意1回（旧v64分も集約）。`shukatsu-prototype.html`/`sw.js`/`docs/privacy-policy.md`/`TASKS.md` をコミット・push・Desktop上書き反映済。MK-USAGE-APP/MK-USAGE-PP ✅クローズ。**⚠️ preview検証で Formspree にテスト1件送信済**（source=after_beta_limit・本物の需要シグナルと混同しないこと）。／ 旧[アプリ v62→v63→v64] 2026-06-09 老眼モード(U1)強化＝APP-U1-STRONGER クローズ。β協力者「文字が小さくて見づらい」FB→`:root.large` を本文20pxへ（v63=18px中間版）＋実機判定→オーナー指示。20px化で長名カードの省略(…)が早まる件は**老眼モード時のみカード名折返し許可**（`shukatsu-prototype.html:53`／通常モードは単行省略のまま不変）で解消。preview検証＝長名2行全文・短名1行・横スクロール無し(scrollW=clientW=687)・JSerror0。`<title>`/`sw.js` v64 bump・handover-doc/TASKS.md 反映済。**未デプロイ＝v61再同意と束ねて06-17後に1回反映** ／ 旧[doc-only] 2026-06-08 MK-TARGET＝ターゲット戦略評価✅完了（ドラフト）＝`marketing/target-strategy-evaluation.md`（ChatGPT提案を実データ検証。Meta 06/01-08 年齢×性別の正規化指標〔45-54女性 CPC¥29＝全セグメント最安・全クリック55%／女性¥30<男性¥53／B・C未配信＝全てA訴求由来〕で**45-54女性の刺さりを真と確定**・`monitoring-log.md` 06-08内訳記録／ただし**全層CV0＝課金は未検証**）。結論＝**獲得は45-54女性起点を支持・課金検証（F1＋訴求A/Cテスト）を06-17前に最優先・実装はgo後**。3機能＝**C お願いメッセージ採用**/**B 共有レベルはラベル限定**（自動発動なし＝emergencyMode回避）/**A 安心ノート大幅縮小**（薬/病院/保険詳細＝要配慮個人情報でβ除外）。**既存A広告の文言変更・E案差替は06-17まで非実施**。作戦決定＝06-17前はF1優先（LP micro-test見送り＝サンプル不足）・訴求A/Cテスト設計は §10 に正本化（06-17後の広告レベル本命用）。**SNSキュー軽微置換**＝T10/T12/T13 の終活ワードを「契約の地図／家族に残すもの/家族の備え」へ（トーン不変・X重み280以内・T0〜T5投稿済・次T6） ／ 旧[doc-only] APP-PROD-ARCH ドラフト完了＝`docs/production-migration-architecture.md` v0.1 新設（β→フル本番＝道②の移行設計。Firebase Auth+Firestore第一候補・localStorage(`DATA_KEY:v20`/doBackup JSON)→Firestore移行・招待サーバ化(Cloud Functions+OTP)・`canViewContract`をセキュリティルール写像・段階ロードマップP0〜P6。コードなし・emergencyMode はスコープ外でフルレビュー独立ゲート維持。実装着手＝06-17 good＋資金調達＋フルレビュー後・オーナー承認）。道①ライト本番(finance §6.1)は開発環境変更不要と整理 ／ LEG-42c 洗い出し＝実docs照合で「残4 placeholder」は stale と判明＝連絡先メール`kizunabaton.official@gmail.com`/管轄=横浜地裁相模原支部/問い合わせフォームURL=廃止(メール一本化) は v3.2.2 確定済・公開日は附則に`2026-05-27`記載済(front-matter 13行目の未確定注記と矛盾)。**HTMLに値の差し込み箇所なし**(ToS/PP本文は埋め込まずリンク＋版ラベルのみ:805/809/846/850)。ToS/PP本体・HTMLは未編集 ／ **オーナー決定＝据え置き：道①/②と本番一般公開日は 06-17 判定後にまとめて確定** ／ **v61 ＝ LEG-LOGO クローズ＝PP に Logo.dev へのドメイン名送信を開示（第2条β外部通信節＋第7条委託先）・`PRIVACY_VERSION` v3.2.2→v3.2.3・新規委託先開示の再同意を強制するため `CONSENT_KEY` を `:v22→:v23` bump（PRIVACY_VERSION 単独では再同意が出ない実装と判明）・両同意モーダルのPPラベル v3.2.3 化・本人モーダル本文に Logo.dev 開示追記・app版数 v60→v61。preview検証済・**未デプロイ＝本番反映は既存βテスターに再同意モーダルが出るためオーナー承認待ち** ／ 資金調達プラン新設＝`finance/funding-plan.md` v0.1・option C(家族/知人少額借入)を🧊凍結・「スポット相談=自己資金可」旧前提を finance/legal 全是正・TASKS.md FIN-FUND✅/FIN-FREE🔲 追加** ／ v60 ＝ APP-SEC-XSS-2 クローズ・Codex精査提案5行をTASKS.md追記済 ／ MK-USAGE 使用シグナル施策＝別Codexレビュー再精査完了・子5行 MK-USAGE-F1/SNS/LP/PP/APP をTASKS.md追記済 ／ **MK-USAGE-LP クローズ＝lp.html フォーム軽量化(B1/B2)実装済・PP改定不要** ／ **IP-2 J-PlatPat正式確認クローズ＝完全一致0/称呼キズナバトン0/第42類バトン0で9＋42戦略前進可能** ／ **IP-7 重要コピー/UI初出証跡リスト§9 クローズ** ／ **IP-6 SNSハンドル防衛棚卸し§10 クローズ＝主要11プラットフォーム棚卸し・Threadsは自動防衛済・空き確認はオーナー手順§10.3→§10.4転記** ／ **MK-USAGE-F1 クローズ＝usage-signal-ideas §F1 に15分インタビュー確定3問〔支払意思/継続意向/詰まり〕・実施はオーナー** ／ **LEG-42e クローズ＝operator-succession-plan.md v0.1〔運営者突然死の引継ぎ手順・β=端末ローカルで被害限定/本番=BaaS要本格手順〕** ／ **LEG-41a/FIN-LAW1 進行中＝lawyer-shortlist.md v0.1〔弁護士の当たり付け枠組み確定・実候補記入待ち・当たり付け/見積は無料先行可・実相談5-10万は資金調達後＝3万円超ゲート〕** ／ **LP Desktop上書きは不要決定でクローズ**）

> 🚨 **絶対ルール**: 「もしもの時」発動機能（emergencyMode）の**コード実装は弁護士フルレビュー完了後にのみ着手**。レビュー前はドキュメント整備までに留め、`shukatsu-prototype.html` の emergency 関連コードは触らない。オーナーが「実装してよい」と言っても、まず弁護士フルレビュー済みかを確認すること（承認ミスの可能性あり）。正本: `legal/legal-strategy.md`・`docs/emergency-mode-requirements.md` §9。

> 🟦 **次セッションの主担当＝アプリ開発**。開始時にまず `TASKS.md` の **app セクションの open 行**を提示し、オーナーに着手タスクを選ばせること。SNS/Meta広告は副次（オーナーから明示指示があったときのみ）。

> 📋 **残タスク・状態の正本は `TASKS.md`**（このプロンプトに残タスクを再記述しない）。本ファイルは起動手順・運用知見のみ。状態の食い違いを見つけたら `TASKS.md` を正として是正する。

---

## 着手前のルール（CLAUDE.md）

- 大きめの変更は **plan mode で計画提示 → 承認後に実装**。
- 動作確認は `preview_start` + `preview_screenshot`。
- **バージョン更新時は必ず3点**（CLAUDE.md）: ①HTML title（＋`sw.js` CACHE_NAME）②`handover-doc.md` ③**`TASKS.md` の該当行 close ＋他docの関連語を grep 照合**。
- 完了したら 2ファイル（`shukatsu-prototype.html`/`sw.js`）のみ commit → push → 本番curl確認 → Desktop（`アプリ作成/Claude/`）上書き → 引き継ぎ更新。

---

## まず読む（順番厳守）

1. `kizuna-baton/CLAUDE.md`（作業ルール・データ範囲・1段階発動・UI規約）
2. **`kizuna-baton/TASKS.md`（状態の単一正本＝open/done/次の一手）**
3. `kizuna-baton/handover-doc.md`（主要機能 vNN の実装履歴・詳細）
4. 副次（マーケ時のみ）: `marketing/social-post-queue.md`・`marketing/monitoring-log.md`・`marketing/social-posting-log.md`

読んだら `TASKS.md`／`handover-doc.md` と実ファイル（`shukatsu-prototype.html`）を突き合わせて事実確認すること（オーナー貼付の完了報告を鵜呑みにしない）。**開始時にまず TASKS.md の app open 行を提示する。**

---

## 現在の状態（2026-06-07 時点・概要のみ。詳細は TASKS.md）

- **本番移行（2026-06-07 新設・据え置き）**: `docs/production-migration-architecture.md` v0.1＝**道②フル本番**（別端末の家族に届く＝BaaS必須）の移行設計をドラフト化（TASKS.md `APP-PROD-ARCH`✅）。Firebase Auth+Firestore第一候補・データ移行(doBackup JSON流用)・招待サーバ化・`canViewContract`のルール写像・ロードマップP0〜P6。**道①ライト本番(finance §6.1)＝開発環境変更不要**。**オーナー決定＝据え置き：道①/②の選択と本番一般公開日は 06-17 判定後にまとめて確定**。emergencyMode は本書スコープ外（フルレビュー独立ゲート）。**実装着手は 06-17 good＋資金調達＋フルレビュー後・オーナー承認**＝それまでアプリのアーキ改修に着手しない。
- **LEG-42c（2026-06-07 是正・🔄進行中）**: 「残4 placeholder」は stale＝3点確定(連絡先メール/管轄/フォームURL廃止)＋公開日は附則に2026-05-27記載済(front-matter 13行目と矛盾)。**HTMLに値の差し込み箇所なし**（ToS/PP本文非埋め込み・リンク＋版ラベルのみ）。残＝本番公開日の意味づけ確定/13行目矛盾解消/GitHub Pages の `docs/*.md` 直リンクUX。**ToS/PP本体・HTMLは未編集**（値は法務確定後）。
- **デプロイ（アプリ）**: 本番（`bati10inter-cmd.github.io/kizuna-baton/shukatsu-prototype.html`）= **v65 反映済（2026-06-10 デプロイ）**。v61〜v65 をまとめて1回デプロイ完了（旧 v60 本番から v65 へ）。既存βテスターには `CONSENT_KEY:v24` 変更で**再同意モーダルが1回表示される**（意図した挙動）。Desktop（`アプリ作成/Claude/`）上書き済。
- **デプロイ（LP・別系統）**: 本番 `lp.html` = **MK-USAGE-LP 反映済**（commit `078165e`・本番curlで `name="reaction"`×3／`id="agree-row"`／「送信する」「もっと伝える」「番号類NG」確認済）。**LPの Desktop 上書きは不要＝オーナー判断でクローズ（2026-06-06）**（LPはアプリ2ファイルcommitフローとは別運用・Desktop同期対象外）。
- **アプリ**: **v64 = 老眼モード(U1)本文20px＋老眼モード時のみカード名折返し許可**（APP-U1-STRONGER クローズ・`:root.large` `shukatsu-prototype.html:52-69`／長名2行全文・短名1行・横スクロール無し・JSerror0。通常モードのカード名は単行省略のまま不変）。v63 = 同U1 +4px相当（本文18px）の中間版。**v62 = Codexレビュー精査5件**（APP-SEC-EXPORT 出力時 `canViewContract(c,viewer,exportStage)`／APP-SEC-SEARCH 検索の機密漏れ封じ／APP-BETA-SAMPLE サンプルをβ上限に数えず／APP-DATA-SCOPE 番号類hard block／APP-EMG-DEADCODE は🧊凍結のまま未着手）。v61 = LEG-LOGO（PP に Logo.dev ドメイン送信開示・`CONSENT_KEY:v22→v23`・`PRIVACY_VERSION` v3.2.3）。v60 = `renderSwitchMenu` 本人(m1)行のXSS残穴 esc化（APP-SEC-XSS-2 クローズ・`shukatsu-prototype.html:1523-1527` の `me.name`/`me.color`/`me.name.charAt(0)` を `esc()` 化＝v55 の取りこぼし是正・onclick の `MY_ID` は定数で対象外・本人名は `renameMember` で編集可だった）。**これで Codex 再レビュー由来のアプリ防御も全件クローズ**。v59 = 機密メモの番号類ソフト検知（APP-DATA-SCOPE・`looksLikeSensitiveNumber`〔スペース/ハイフン除去後 `/\d{7,}/`〕＋`confirmSecretSafe`・`f-secret` の連続7桁以上をソフト検知）。v58 = 未知 visibility.mode の fail-safe（APP-SEC-VIS・`canViewContract`末尾fallthrough `return true`→`return false`・`visibilityLabel`も整合）。v57 = localStorage 破損時のユーザー通知（APP-DATA-CORRUPT）。v56 = バックアップに categories 同梱（APP-DATA-BACKUP）。v55 = 保存型XSS対策（APP-SEC-XSS）。v54 = `?blank=1` の実データ上書き保存遮断（APP-DATA-BLANK）。v53 = 旧emergencyプレビュー露出抑止（APP-EMG-PREVIEW）。
- **資金調達（2026-06-07 新設）**: `finance/funding-plan.md` v0.1＝資金調達の正本（手段マップ・PF比較・目標額逆算・トリガー）。**option C（家族/知人少額借入）凍結＋自己資金困難＝即時5-10万スポット相談ゲートは06-17前に開けられず**、スポット相談は「06-17 good後の本格化commitment（クラファン/公庫）の下流」に固定（順序リスク）。緩和＝**非弁の無料一次確認**（法テラス/弁護士会の無料枠）。PF＝CAMPFIRE+AON第一候補・目標額 第1¥120,000/本¥500,000。制度資金＝持続化補助金(N3マーケ)/公庫(本格化)/特定創業支援(無料)。**FIN-FREE**（無料先行3点・06-17前可・オーナー実施）は TASKS.md 参照。
- **MK-TARGET ターゲット戦略評価（2026-06-08 新設・✅完了ドラフト）**: `marketing/target-strategy-evaluation.md`＝ChatGPT提案（45-54女性起点への転換＋3機能）を実データで検証した14成果物＋反論3回。**Meta 06/01-08 年齢×性別の正規化指標で「45-54女性が真の刺さり」を確定**（45-54女性 CPC¥29＝全セグメント最安・全クリック55%／女性¥30<男性¥53／B・C未配信＝全てA訴求由来。`monitoring-log.md` 06-08内訳に記録）。ただし**全層コンバージョン0＝課金は未検証**。結論＝**獲得は45-54女性起点を支持／課金検証（F1＝MK-USAGE-F1＋訴求A/Cテスト）を06-17前に最優先／実装はgo後**。3機能＝**C お願いメッセージ採用**（固定テンプレ）・**B 共有レベルはラベル限定**（自動発動なし＝emergencyMode回避）・**A 安心ノート大幅縮小**（薬/かかりつけ病院/保険詳細＝要配慮個人情報でβ除外・所在メモ3項目のみ）。**既存A広告の文言変更・E案差替は06-17まで実施しない**（テスト整合性＋A好調＋不変制約）。**2026-06-08 作戦決定＝06-17前はF1ヒアリング優先（LP micro-test見送り＝サンプル不足）／訴求A/Cテスト設計は `target-strategy-evaluation.md §10` に正本化し06-17後の広告レベル本命テスト用に保存／`usage-signal-ideas.md §F1` に45-54女性ターゲット調整を追記（人選を45-54女性中心・入口を自分ごとに・確定3問は不変）**。
- **Meta広告A案**: 2026-06-03〜06-17 の2週間テスト中（¥350/日）。**day5（06-07）読み上げ記録済＝CTR 1.81%／CPC ¥37／クリック48／imp 2,645／Formspree 0件**（正本 monitoring-log.md）。入口指標は良好・直近1日増分でも改善方向。濃い需要シグナル（登録/DM）は依然0。撤退AND条件は非該当＝継続。次チェック06-10頃・最終判断06-17。Metaおすすめ（Advantage+エンハンス/予算増額）は不変制約どおり未適用。
- **SNS**: X/IG @kizuna_baton。**T0〜T5 投稿済み**（T4=X status/2063574833204789435＋IGカルーセル3 p/DZSDlYvE8tA/ ／T5=X status/2063802195477483617）。**T0〜T7 投稿済・次は MK-SNS-T8（Xのみ）**。状態の正本は TASKS.md／social-posting-log.md。**未投稿分 T6〜T13 の文面は Codex 修正＋Claude 再精査済**＝4制約クリア・X重み280以内。**2026-06-08 MK-TARGET連動の軽微置換＝T10「終活の入口」→「契約の地図」／T12「終活向けだからこそ」→「家族に残すものだからこそ」／T13「終活領域」→「家族の備え」**（トーン不変・X重み再確認T10≈261/T12≈259/T13≈274・禁止表現なし。T0/T11親起点・T7/T9終活ライト文脈は据え置き。SNS大改修は非推奨＝オーガニックreach小／45-54女性信号は有料Meta由来）。**@kizuna_baton は非Premium＝X文字数はCJK2カウントの重み付け（上限280）で判定**（素の文字数で判断しない／メモ `feedback_kizuna_sns_x_charlimit.md`）。T10は投稿時に V2紹介画像 `marketing/app-store-preview/kizuna-baton-x-intro-v2-1600x900.png` 添付推奨。SNS文面リライトより **MK-USAGE-SNS（D1 bio link-in-bio→LP／D3 IG poll「試した?」）が本命だが未着手**。Codexレビュー用プロンプトは `marketing/codex-sns-revision-prompt.md`。
- **部門**: finance（価格・SKU確定／クラファンは06-17後／**FIN-LITE 低コスト本番開始プラン追加**＝広告 weak 時の第3の道〔finance-strategy §6.1・TASKS.md FIN-LITE⏸保留〕）・legal（フルレビュー準備／**LEG-42e 運営者突然死・引継ぎ手順を `operator-succession-plan.md` v0.1 に定義済＝β=端末ローカルで被害限定/本番=BaaS要本格手順・legal §3パッケージ#7追加**／**LEG-41a/FIN-LAW1 弁護士の当たり付けリスト `lawyer-shortlist.md` v0.1 進行中＝枠組み確定・実候補記入待ち・実相談は資金調達後＝3万円超ゲート**）・IP（**IP-2 J-PlatPat正式確認＋IP-6 SNSハンドル防衛棚卸し＋IP-7 初出証跡リスト 2026-06-06クローズ**＝完全一致0/称呼0/第42類バトン0で9＋42戦略前進可能・§9証跡表・§10にSNS棚卸し〔Threadsは自動防衛済・空き確認はオーナー手順§10.3→§10.4転記〕・次は IP-3 出願設計〔⏸06-17後〕/IP-5〔06-17後〕）。すべて `TASKS.md` 参照。
- **MK-USAGE 使用シグナル施策 = Codexレビュー再精査済（2026-06-06）**: `marketing/usage-signal-ideas.md` への Codexレビューを実コード照合で精査確定。優先=F1直接ヒアリング→SNS反応ループ→LP軽量化→(PP改定)→A1/A3アプリ内。**C1匿名計測は06-17前不採用**（委託先名開示が前提・PP118-119）／Pixel/UTM・金銭/無料権の見返り・emergencyMode導線・LP主見出し/主CTA変更・バックエンド追加は不採用。子5行 MK-USAGE-F1/SNS/LP/PP/APP を TASKS.md 追記済（以後 TASKS.md が正本）。**MK-USAGE-LP は 2026-06-06 実装完了＝クローズ**（lp.html フォームに1タップ反応chip追加・メール任意化・立場/要望を `<details>` 折畳・agree出し分けJS・送信ボタン「送信する」化。主CTA据置・Formspree送信先既存ゆえPP改定不要・番号類NG明記。preview検証済）。**MK-USAGE-F1 は 2026-06-06 クローズ**（usage-signal-ideas §F1 に15分インタビュー確定スクリプト＝確定3問〔Q1支払意思=自由WTP→¥500反応2段・実課金なし明記/Q2継続意向＋ドライバー/Q3詰まり=観察突合〕＋PIIなし記録テンプレ＋good/weak目安をmonitoring-log補助シグナルへ。実施はオーナー）。次の MK-USAGE 着手候補＝**F1ヒアリング実施（オーナー）** → MK-USAGE-SNS反応ループ → MK-USAGE-PP → MK-USAGE-APP（plan mode 対象・PP先行が条件）。
- **Codex 再レビュー精査済（2026-06-06）**: 技術指摘の多くは v55–v59 で対応済と確認。発見した**新規残穴 `renderSwitchMenu` 本人(m1)行 未エスケープは v60 で esc 化＝クローズ（APP-SEC-XSS-2）**。**これで Codex 再レビュー由来のアプリ防御も全件クローズ**。精査の提案5行（APP-SEC-XSS-2✅／LEG-LOGO／LEG-42b具体化／MK-BETAGUIDE／MK-KPI）は **TASKS.md へ追記済**＝以後は TASKS.md が正本。残りの open（LEG-LOGO／LEG-42b具体化／MK-BETAGUIDE／MK-KPI）は legal/marketing 副次タスクとして TASKS.md 参照。

---

## 次アクション候補（開始時に提示）

1. **【最優先・オーナー実施】F1ヒアリング**（45-54女性中心5名以上・15分／`usage-signal-ideas.md §F1`＝確定3問＋2026-06-08 追加の45-54女性調整）。**06-17前の"課金意思"検証はこれが本命**（MK-TARGET作戦＝広告で確定したのは獲得まで・課金は未検証）。結果は monitoring-log 補助シグナルへ。
2. **【今日でも可】06-10 Meta中間チェック**＝CTR/CPC＋**可能なら年齢別CPC読み上げ**→ monitoring-log 記録（撤退判断はしない）。／**SNS＝MK-SNS-T6**（Xのみ・「今日のSNS投稿実行」・T0〜T5投稿済）。任意で **D1 bio link-in-bio→LP 整備**（SNS変更の本命・未着手）。
3. **【06-17 go後】訴求A/C 広告レベル本命テスト**（`target-strategy-evaluation.md §10`設計）→勝ち訴求でE案再設計。3機能（C採用/Bラベル限定/A大幅縮小）の実装も go後。**それまでアプリ実装着手なし・既存A広告は文言変更しない**。※LEG-LOGO=v61 は実装済・**デプロイは06-17結論まで保留**（再同意モーダル回避）。
   - 参考クローズ済: IP-2/IP-6/IP-7（2026-06-06）・MK-KPI/MK-USAGE-F1/MK-USAGE-LP・LEG-42b/MK-BETAGUIDE。app の open は無し（APP-CC2🧊凍結・APP-F1/APP-N3⏸保留）。

> ファイナンス（クラファン**最終確定**＝目標額/リターン/PF）・IP出願・法務フルレビューは 06-17 テスト結論後／オーナー承認後（クラファンの**設計**は funding-plan.md で済）。**FIN-LITE（低コスト本番）も 06-17 weak 時の発動判断**＝それまでは最小ゲート（LEG-41a/41c）の前倒し可否のみ検討。**FIN-FREE（無料先行3点＝よろず相談/特定創業支援認定/非弁の無料一次確認）は 06-17前でも着手可・撤退余地ゼロ消費**＝オーナー実施で go/no-go 前に非弁リスクを部分的に潰せる。**LEG-41a 弁護士の当たり付けは `lawyer-shortlist.md` v0.1 進行中**（枠組み確定・実候補記入はオーナー or Web検索補助／当たり付け・見積は無料先行可／**実相談5-10万＝3万円超ゲート＝資金調達後**）。

---

## ⚠️ Instagram投稿の確定知見（IG投稿日 T2/T4/T7/T9/T11 で必ず参照）

- `file_upload` ツールはホストパスを拒否する（既知・修正不可）→ **画像5枚アップロードのみオーナー手動**。
- 操作は `javascript_tool` 使用。React `div[role=button]` は pointerdown→mousedown→pointerup→mouseup→click のイベント列で発火。
- キャプション欄（contenteditable）は `focus()` + `execCommand('insertText')` + Enter で改行。文面は `social-post-queue.md`／`instagram-carousel-production.md` の固定文面を改変禁止で使う。
- **投稿前に必ず全5スライドを確認**（クロップ送りは不安定。「次へ」で編集ステップに進み右矢印で全5枚チェック）。1枚目の SLIDE_LABEL と見出しが目的のカルーセルと一致するか毎回照合。
- キャプション改行は execCommand では潰れる。Cmd+A→Delete でクリア後、computer `type`＋`key Return Return` で段落入力すると改行が反映される。

---

## Chrome操作・Meta実数値の既知制約

- computer-use は Chrome = read tier（screenshot のみ・クリック/入力不可）。
- Claude-in-Chrome MCP のタブがバックグラウンドウィンドウだと Meta SPA が描画されない。
- **Meta Ads Manager の実数値（CTR/CPC/クリック）はオーナー読み上げが最確実**（Claude単独取得不可）。

---

## 禁止表現（SNS投稿前に必ずチェック）

- 死亡判定 / 生存確認 / 死後すぐ解約 / 家族が代わりに手続き
- 相続放棄の判断をアプリが助ける等の法的判断示唆
- カード番号・口座番号・暗証番号を預かるように読める表現
- 「必ず」「完全に」「安心です」等の過度な保証 / 恐怖をあおるだけのコピー

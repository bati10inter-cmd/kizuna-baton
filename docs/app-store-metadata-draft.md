# App Store メタデータ下書き（きずなbaton / APPSTORE-META §6）

**版数 v0.22 / 2026-07-20 更新（Claude下書き・最終はオーナー）**
**状態の正本は `TASKS.md` の APPSTORE-META 行。本書は提出フィールドの文案・根拠を持つ。**
**正＝`docs/app-store-submission-plan.md` §6 / `CLAUDE.md`（データ範囲・もしもの時1段階・柔らかい文言）。**

> ⚠️ **β版前提（必読）**：`FEATURES.emergencyMode=false`（ToS 7.1）。本書の文言は **「もしもの時の自動発動」を機能として宣伝しない**。価値は「契約の整理・把握・家族へそっと手渡す準備」に置く。「死亡判定」「生存確認」「死亡」等の直接表現は **App Store 文言でも一切使わない**（審査・CLAUDE.md UIルール）。

> 🟦 **課金方針（2026-06-28 オーナー決定）＝「配信開始＝同時課金」**：無料で「将来有料予定」ではなく、**初回リリースから IAP 有料プランを稼働**させる freemium（梅=無料 / 竹=¥500/月）。
> - 🟢 **課金に伴う提出前タスク（2026-06-29 是正＝proportionate 化）**：(1) **特商法に基づく表記**＝テンプレ自前で足りる（弁護士不要・氏名/住所は請求時開示で省略）(2) **消費税/インボイス**＝免税事業者ゆえ申告納付なし・B2Cゆえ登録しない＝**専門家確認不要**(3) **解約導線・自動更新表示**＝Apple 標準＋v82 実装済(4) **APPSTORE-IAP**＝v82 実装済。**実質の提出前タスクは「特商法ページ＋PP の公開URL化」のみ**（旧「⛔専門家確認必須ブロッカー」は撤回・§7.2）。
> - ⚠️ **濱田弁護士 無料一次確認（2026-06-17）の「致命傷なし」は emergencyMode の相続・非弁論点に限る**。課金・特商法・消費税は当該確認の対象外だが、上記のとおり個人開発スケールではいずれもセルフサービスで足り、別途の有料法務確認は不要（不安が出たら無料窓口で任意確認）。
> - 📉 **戦略リスク**：GTM では獲得◎だが課金軸（WTP）は空（poll 0票/26表示・`gtm-decision-2026-06-17.md`）。初回から有料＝無料での獲得検証を経ずにコンバージョンを賭ける選択。文言は「無料で始められる freemium」を明確化し、有料は“さらに便利な追加プラン”として誤認を避ける。

---

## 0. サブ項目の進捗（APPSTORE-META 内訳）

| サブ項目 | 状態 | 備考 |
|---|---|---|
| アイコン1024×1024（不透明） | ✅ 完了 | `native/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`＝1024×1024・hasAlpha:no・`Contents.json` 紐付け済 |
| PrivacyInfo.xcprivacy | ✅ 完了 | APPSTORE-META-PRIVACY（`e2e63aa`）。**2026-07-03 pbxproj Resources 登録＋ビルドでバンドル同梱を実証（残フォロー解消）** |
| NSFaceIDUsageDescription | ✅ 完了 | APPSTORE-META-FACEID |
| スクリーンショット 6.9"(1320×2868) | ✅ 完了（**マーケ加工版まで完了**） | **2026-07-02** iPhone 17 Pro Max シミュレータで5枚取得（`marketing/app-store-screenshots-6.9/`・全件1320×2868実測確認）＝①ホーム(契約一覧)②契約詳細(家族への一言・私的/非開示)③契約詳細(Netflix・家族への一言＋解約方法＋家族全員に表示)④カレンダー(月次支払合計)⑤生体ロック(Face ID/Touch ID)。**2026-07-05 マーケ加工版 `store-01`〜`store-05` 作成（§4.1・見出し＋ベゼル＋ブランド背景・提出はこちらを推奨）** |
| メタデータ文言（本書 §1〜§3） | ✅ 確定 | **2026-07-02 オーナー最終確認済**（App名/サブタイトル/プロモ/説明文）。改訂履歴 v0.8 参照 |
| App Privacy データラベル（§5） | ✅ **2026-07-11 ASC 公開完了**（オーナー手動） | 「収集あり」で公開＝データタイプ**7種**（名前/メールアドレス/支払い情報/その他の財務情報/その他のユーザコンテンツ/ユーザID/購入履歴）・全て Data Linked to You・**トラッキング無**・目的=App Functionality。アナリティクス/診断は未登録（Analytics/Crashlytics 等の SDK 不使用）。`PrivacyInfo.xcprivacy` 追従済。状態の正本は `TASKS.md` APPSTORE-META 行 |
| アカウント削除導線（5.1.1(v)） | ✅ v97実装済（v2で実動） | APP-V2-ACCOUNT-DELETE（2026-07-07）＝callable `deleteAccount`＋クライアント配線済。即時完全削除（ToS第18条整合）。現行β（v1提出）はアカウント無し＝対象外のまま。`FEATURES.cloudSync=true`（v2）で実動・deployはP3-deploy同梱 |
| **課金（IAP・配信＝同時課金）** | 🟡 提出前タスク（軽量） | APPSTORE-IAP/解約導線=v82実装済✅。残＝特商法ページ＋PP の公開URL化のみ。消費税/インボイスは免税・B2Cで専門家確認不要（§7.2・2026-06-29是正） |

---

## 1. 文字数制限とフィールド（App Store Connect）

| フィールド | 上限 | 本書の案 | 文字数 |
|---|---|---|---|
| App名（Name） | 30 | きずなbaton | 8 |
| サブタイトル（Subtitle） | 30 | サブスクや契約を、家族にそっと手渡す | 18 |
| プロモーションテキスト | 170 | §2 参照（差し替え自由・審査不要で更新可） | — |
| 説明文（Description） | 4000 | §3 参照 | — |
| キーワード（Keywords） | 100 | §3.2 参照（カンマ区切り・スペース無し推奨） | — |

> ※日本語は1文字＝1カウント。名前・サブタイトルは合算ではなく各30。

---

## 2. プロモーションテキスト（170字・審査なしで後から差し替え可）

**ASC 入力時は改行を入れず1段落で貼る**（下記は可読性のための折返し。ストア表示の不自然な折返しを避ける）。

```
もしもの時、ご家族はあなたの契約にたどり着けますか？ サブスク・月額・ローンの存在と解約の手がかりを、元気なうちに家族へそっと共有。カード番号や暗証番号など機密そのものは保存しません。高齢のご家族にも見やすい設計。無料ではじめられます。
```

（118/170・**v0.22＝2026-07-20 オーナー決定で「何のためのアプリか」を冒頭で明示**＝「もしもの時」フックは事前共有型の表現＝発動・自動開示の示唆なし・冒頭ガードレール準拠。末尾「無料ではじめられます。」＝閲覧者の第一疑問「いくら？」への即答。説明文で有料プランを明示済みゆえ 2.3.1 無料誤認リスクなし。プロモテキストは審査不要＝1.1 提出と独立していつでも差し替え可）

> 旧版（v0.8〜v0.21・113字・参考）: `親の契約、把握できていますか？ サブスク・月額・ローンを家族でやさしく整理。カード番号や暗証番号など機密そのものは保存せず、「どこにある・どう手続きするか」をそっと残せます。高齢のご家族にも見やすい設計。無料ではじめられます。`

---

## 3. 説明文（Description）案

### 3.1 本文

```
「親が何の契約をしているか分からない」「自分にもしものことがあったら、家族はサブスクの解約に困るのでは」——きずなbaton は、そんな不安にそっと寄りそうアプリです。

きずなbaton は“情報そのものを金庫のように保管する”アプリではありません。
「どんな契約があるのか」「解約するにはどこへ連絡すればよいのか」を整理し、信頼できるご家族へ、必要なぶんだけ手渡す準備を整えるためのアプリです。

■ こんな方へ
・親のサブスクや月額契約を把握しておきたい
・自分の契約を、いつか家族が困らないよう整理しておきたい
・終活の一歩として、まず「契約まわり」から始めたい

■ できること
・サブスク／月額契約／ローンを一覧で整理（月額・年額の合計も把握）
・契約ごとに「公開範囲」を設定し、家族の誰に見せるかを選べる
・解約の連絡先・手順や、ご家族へのメッセージを残せる
・高齢のご家族にも見やすい、大きめの文字とやさしい配色

■ 安心への配慮
・カード番号のフル桁、銀行口座番号、暗証番号、パスワード、マイナンバーなどの「機密情報そのもの」は保存しません。あくまで“どこにあるか・どう手続きするか”の覚え書きに使います。
・Face ID／Touch ID でアプリにロックをかけられます（端末内で完結し、生体情報を外部へ送信しません）。
・トラッキングや広告は行いません。

■ 大切な前提
・本アプリは「契約の存在と手続きの手がかりを家族に伝える」ことを目的としています。お金や個別の手続きを代行するものではありません。
・基本機能は無料でお使いいただけます。より多くの契約を登録できる有料プラン（月額制・自動更新）もご用意しています。

■ 規約
・利用規約: https://bati10inter-cmd.github.io/kizuna-baton/docs/terms-of-service.html
・プライバシーポリシー: https://bati10inter-cmd.github.io/kizuna-baton/docs/privacy-policy.html
```

> ⚠️ **【2026-07-11 追記】末尾「■ 規約」ブロックは APPSTORE-PREFLIGHT-FIX ⑦で追加した案**＝標準 EULA 採用でも自動更新サブスクは説明文への ToU リンク記載がメタデータリジェクトの定番対策（3.1.2 保険）。ASC への実反映は提出時のオーナー作業。
> 文言根拠：CLAUDE.md データ範囲／LP `lp.html`（H1「親の契約、把握できてる？」）。**「もしもの時の自動通知」は β=OFF のため記述しない。**
> 💴 **課金方針変更（2026-06-28）**：「配信＝同時課金」決定により、旧「将来有料を予定（β無料）」型から **freemium（無料で開始＋有料プラン稼働）**型へ書き換え。価格の具体額（竹=¥500/月）は **App Store のIAP設定が自動表示する**ため説明文に直書きしない選択も可（変更時の不整合・審査リスク回避）。直書きする場合は IAP 設定額と完全一致させる。「無料」を強調しつつ有料は“追加プラン”と明示し、Guideline 2.3.1（誇大・無料誤認）を避ける。

### 3.2 キーワード（100字・カンマ区切り）

```
終活,サブスク管理,契約管理,家計,月額,解約,ローン,エンディングノート,家族,シニア,見守り,定期支払い,財産整理,生前整理,親,老後,自動更新,支払い管理
```
（**確定案＝80字/100**・2026-07-01 オーナー確定）

> **追加語の狙い**（旧64字案から拡張）＝`親`（LP主見出し「親の契約」と一致）／`老後`（終活周辺検索）／`自動更新`（サブスク解約意図の検索）／`支払い管理`（家計文脈）。いずれも法務連想（相続/遺言）を避けた語。
> **除外した語**＝`おひとりさま`（2026-07-01 オーナー判断で不採用）。理由＝本アプリの核は「**家族に**契約を手渡す」＝家族の存在が前提。渡す相手のいない層を主に集めると価値提案とミスマッチ（低継続・低評価）を招くため。終活軸は `終活`/`老後`/`生前整理` でカバー済。
> `見守り`＝**採用（オーナー確定）**。高齢者ケアの一般語で高トラフィック。キーワード（非UI）ゆえ CLAUDE.md の「定期確認/生存確認」語感隣接リスクは低いと判断。

> 説明文と重複する語はキーワードに入れない方が効率的（App名「きずなbaton」/サブタイトルの語は除外済）。「相続」「遺言」等の**法務連想が強い語は審査・CLAUDE.md整合の観点で避けた**。本数・順序は ASO で後調整。

---

## 4. スクリーンショット計画（6.9" = 1320×2868）

> **必須サイズ**：iPhone 6.9"（1320×2868 or 2868×1320）。Apple は現行この1セットで他サイズへ自動スケール可。**実画面キャプチャはシミュレータ（APPSTORE-XCODE 後）で取得**するのが本筋。既存 `marketing/app-store-preview/*-1290x2796`（6.7"）は流用不可サイズなので、6.9"で撮り直し or 枠付きクリエイティブを再生成する。

| # | 画面 | 訴求コピー（柔らかい用語） | キャプチャ元 |
|---|---|---|---|
| 1 | 契約一覧（ホーム） | 「もしもの時も、家族が契約に迷わない。」（v0.22 差替。旧「契約を、家族で見やすく整理」） | ホーム画面 |
| 2 | 家族へのメッセージ | 「大切な人へ、そっとひとこと」 | family-message |
| 3 | 契約詳細（解約手順） | 「解約の手がかりも、ここに」 | 契約詳細 |
| 4 | 公開範囲設定 | 「誰に見せるかは、あなたが決める」 | visibility設定 |
| 5 | 生体ロック | 「Face ID で、そっと鍵をかける」 | app-lock overlay |

- 既存の元画像 `marketing/source-screenshots/`（a-family-message / b-list / c-detail）とコピー設計（`marketing/build-screenshot-creatives.js`）を流用し、**1320×2868 枠で再出力**できる。
- 文言は本書 §3 と一貫させる。**「死亡」「生存確認」「もしもの時の自動発動」表現は使わない。**

### 4.1 マーケ加工版（2026-07-05 作成・提出推奨版）

**raw素撮り5枚をそのまま出す予定だったが、競合（例: サブスクBox）は見出し＋端末フレーム＋ブランド背景のマーケ加工が標準**のため、加工版を作成した（オーナー依頼）。

- 成果物: **`marketing/app-store-screenshots-6.9/store-01-home.png`〜`store-05-applock.png`**（1320×2868・不透明＝ASC規格適合を実測確認）。オーナー用コピー＝`Documents/きずなbaton/marketing/appstore-marketing/`。
- ビルダー: `marketing/build-appstore-marketing-screenshots.js`（raw差し替え後に再生成可）。
- 構成: `#FFF5F8` ブランド背景＋中央ロゴ行＋見出し（§4コピー準拠・2行組・94px）＋サブコピー＋端末ベゼル入り実キャプチャ（72%スケール）。**画面は実キャプチャ（シミュレータ実画面）＝誇大表現なし・「イメージです」注記不要**。
- コピー確定（§4表からの差分）: 実キャプチャ#4が公開範囲設定でなく**カレンダー**のため新規「**月々の支払いも、ひと目で。**」（サブ「支払い予定をカレンダーでやさしく確認」）。#5サブに「カード番号や暗証番号は預かりません」を配置。**ファイル名対応の注意＝`raw-04-applock.png`→store-05／`raw-05-calendar.png`→store-04**（§0サブ項目表の④カレンダー⑤生体ロックの順に整列）。
- ガードレール照合済: 番号類なし（カード下4桁 `****1234` のみ＝保存OK範囲）・死亡/生存確認/自動発動の表現なし・全コピー柔らかい用語。
- **ASCアップロードは store-0* を使用**（raw-0* は元データとして残置・最終選択はオーナー）。
- **【2026-07-20 v0.22＝store-01 コピー差替（オーナー決定・1.1(10) 提出に同乗）】** オーナー起票「何のためのアプリかわかりづらい」→1枚目の見出しを「**もしもの時も、家族が契約に迷わない。**」＋サブ「契約の存在と解約の手がかりを、元気なうちにそっと共有」へ差替。**事前共有型の表現**（発動・自動開示の示唆なし＝冒頭ガードレール準拠。見出しはアプリ内料金画面の審査通過済みフレーズ「もしもの時も、ご家族が迷わないように。」と同系）。ビルダー更新→5枚再生成（1320×2868・不透明・実測確認）→store-01 の焼込文言を目視検証済。2〜5枚目のコピーは据置。オーナー用コピー先 `Documents/きずなbaton/marketing/appstore-marketing/` へも複製済。**ASC 反映＝1.1 の「提出準備中」状態でスクショ1枚目を差し替え**（ドラッグ即コミット・追加審査サイクルなし＝アプリ審査と同時）。

---

## 5. App Privacy（データ収集ラベル）下書き

> App Store Connect の「App Privacy」回答。**v100（PP v4.0）で「収集あり」へ更新**。既定は端末内完結だが、**本人が任意でアカウント作成＋「クラウド保存」を有効化した場合に限り** Firebase（Auth／Firestore）へデータを保管するため、Apple のガイドライン上は当該データを「収集あり」として申告する（オプトインでも申告対象）。**トラッキングは一切なし**（ATT 不要・広告/解析SDKなし）。

- **Data Used to Track You**：**なし**（ATT 不要・広告SDKなし・第三者共有なし）。
- **Data Linked to You**（すべて uid に紐付く／目的＝**App Functionality** のみ・トラッキング無）:
  - **Contact Info → Email Address**（アカウント作成時。Firebase Authentication）
  - **Identifiers → User ID**（Firebase の uid。アカウント作成時）
  - **User Content → Other User Content**（クラウド保存有効化時：契約・資産メタデータ、所在メモ、ご家族への引き継ぎメッセージ）
  - **Financial Info → Payment Info / Other Financial Info**（クラウド保存有効化時：カード会社名・下4桁〔＝Payment Info〕、契約の月額/年額の金額〔＝Other Financial Info〕）。※カード番号フル・口座番号・暗証番号は取得しない（CLAUDE.md データ範囲）
  - **Name（表示名・家族の呼び名）の扱い**：登録画面の表示名／家族の呼び名を「Name」として申告するか、User Content 内に含めるかは提出時に確定（保守的には **Name（App Functionality・Linked）** を1項目追加）。呼び名は本人が自由設定＝実名とは限らない。
- **Data Not Linked to You**：なし。
- **総合回答**：**Data Is Collected（収集あり）**。ただし**トラッキングなし**・**第三者への販売/共有なし**・目的は全て「アプリ機能の提供（端末間同期）」。
  - `PrivacyInfo.xcprivacy` の `NSPrivacyCollectedDataTypes` を上記データ型で追従（`NSPrivacyTracking=false` は維持）。→ §11・C 参照。
  - **アカウント削除導線（Guideline 5.1.1(v)）は実装済**（`deleteOwnAccount`＝`deleteAccount` callable でサーバ側完全削除）。
  - 問い合わせ用メール（kizunabaton.official@gmail.com）はアプリ内フォーム収集ではない＝収集ラベル対象外。
  - **招待先メール（第三者情報）＝申告対象**（2026-07-10 再判定・APP-V2-INVITE-RELEASE 解禁 `FEATURES.cloudInvite=true`／v112 に伴う更新）。本人が入力した家族のメールアドレスを Firestore に保管し SendGrid 経由で送信するため収集にあたる。ただし **§5 の `Contact Info → Email Address`（Linked・App Functionality）で既にカバー済＝ASC のラベル回答そのものは変わらない**（Apple の App Privacy は「本人以外の人物の情報」も同じデータ型として申告する）。`PrivacyInfo.xcprivacy` も `NSPrivacyCollectedDataTypeEmailAddress` 申告済で追加変更なし。PP v5.0 で開示済。

> 🟦 **IAP（配信＝同時課金）導入時の判断**：純正 StoreKit のみで RevenueCat 等の課金SDKを入れない場合、購入処理は Apple が担い**開発者が購入データを収集しない**ため、「購入（Purchases）」ラベルの追加は不要の見込み（要確認）。RevenueCat 等の課金分析SDKを入れると「購入」データの収集申告と `PrivacyInfo.xcprivacy` 追従が要る。**初回は純正 StoreKit を推奨**。

---

## 6. ストア設定（カテゴリ・年齢・URL）

| 項目 | 案 | 根拠 |
|---|---|---|
| プライマリカテゴリ | **ライフスタイル** | submission-plan §6＝終活文脈は「ファイナンス」より審査が穏当 |
| セカンダリカテゴリ | ユーティリティ | 整理・保管ツール性格 |
| 年齢レーティング | **4+** | 不適切表現なし |
| サポートURL | **`https://bati10inter-cmd.github.io/kizuna-baton/support.html`**（✅ 2026-06-30 公開・HTTPS 200） | 公開HTTPS必須。疎通確認済 |
| マーケティングURL（任意） | `https://bati10inter-cmd.github.io/kizuna-baton/lp.html` | — |
| プライバシーポリシーURL | **`https://bati10inter-cmd.github.io/kizuna-baton/docs/privacy-policy.html`**（✅ 2026-07-03 確認＝Pages 既定 Jekyll〔`jekyll-optional-front-matter`＋primer〕が front matter 無しでも `.html` を自動生成済・HTTPS 200・整形表示。生 `.md` も並存配信＝旧リンク404なし） | 提出に公開URL必須。案A は「リンク差替のみ」で完了（v89） |
| 利用規約（EULA） | `https://bati10inter-cmd.github.io/kizuna-baton/docs/terms-of-service.html`（✅ HTTPS 200・アプリ内リンク=v89 で `.html` 化・購入画面にも掲示） | App内課金の3.1.2要件＝v83 で `renderPlanModal` にリンク追加済 |
| 特商法に基づく表記 | **`https://bati10inter-cmd.github.io/kizuna-baton/tokushoho.html`**（✅ 2026-06-30 公開・HTTPS 200・運営統括責任者=Dorize代表＋請求時開示） | 課金開始で必須。`finance/fin-tax-iap-worksheet.md §1,§5.5` |

> ✅ **公開済み（2026-06-30 `55f01d8`・本番Pages live・HTTPS 200 確認済）**：`support.html`／`tokushoho.html`。**PP/ToS の見栄え改善（案A）＝2026-07-03 完了**＝Pages 既定 Jekyll が `.html` を自動生成済と発見・アプリ内/support/lp のリンクを `.md`→`.html` へ差替（v89）。**残＝下記 §6.1 の ASC URL欄登録（owner）。**

---

## 6.1 ASC 各URL欄 登録チェックリスト（owner作業）✅ 2026-07-10 完了

> App Store Connect → 対象App →（左）**App情報** および **各バージョン** に登録する。公開URLはすべて HTTPS 200 確認済（2026-06-30）。**2026-07-10 App レコード新規作成**＝Apple ID `6789437356`／SKU `kizunabaton-ios-001`／Bundle ID `io.dorize.kizunabaton`。

| ASC のフィールド | 入れる値 | 場所 | 状態 |
|---|---|---|---|
| サポートURL（Support URL） | `https://bati10inter-cmd.github.io/kizuna-baton/support.html` | バージョン情報 | ✅ 登録済 |
| マーケティングURL（Marketing URL・任意） | `https://bati10inter-cmd.github.io/kizuna-baton/lp.html` | バージョン情報 | ✅ 登録済 |
| プライバシーポリシーURL（Privacy Policy URL） | `https://bati10inter-cmd.github.io/kizuna-baton/docs/privacy-policy.html`（2026-07-03 `.html` へ確定＝整形表示・HTTPS 200） | App情報 | ✅ 登録済 |
| 利用規約（License Agreement／EULA） | **Apple標準使用許諾契約を採用**（ASC既定値のまま＝追加対応不要）。独自 ToS はアプリ内同意モーダル・購入画面から既にリンク済（v83実装・v89で`.html`化）＝Guideline 3.1.2 の到達性要件は充足 | App情報＞使用許諾契約 | ✅ 既定値で充足（対応不要） |
| 特商法に基づく表記 | アプリ内・公開ページで掲示済（ASC に専用欄なし）。説明文 or サポートページから到達 | — | ✅ 公開で充足 |

> 📌 特商法は ASC に専用フィールドが無い＝`support.html` / `tokushoho.html` 経由の到達で要件充足（`tokushoho.html` は `support.html` フッターからリンク済）。

## 6.2 サブスク商品（IAP）登録 段取り（owner作業・APPSTORE-IAP の残）

> ASC → **収益化 ＞ サブスクリプション** で設定。**商品ID・サブスクグループ名は一度作ると変更不可**＝下記と完全一致で作る（コード `IAP_PRODUCTS` と一致させる）。
> **2026-07-10 実施＝1〜3・グループ表示名 完了。2026-07-11 審査用スクショ（¥500/¥5,000）を両商品へ登録＝ステータス「メタデータが不足」→「送信準備完了」に遷移。同日 Small Business Program 申請 送信完了（承認待ち）。∴ §6.2 は全消化。** 状態の正本は `TASKS.md` APPSTORE-IAP 行。

1. ✅ **サブスクリプショングループ**作成＝グループ参照名 `take`（**グループID `22222383`**）。**グループのローカリゼーション（日本語）**＝グループ表示名「家族プラン」／アプリ表示オプション＝既定の「アプリ名を使用（きずなbaton）」→ 提出準備中。
2. ✅ **商品2件**作成（同一グループ内＝月/年で価格段階）：
   - 月額：商品ID `io.dorize.kizunabaton.take.monthly`／価格 **¥500**／期間 1か月（**Apple ID `6789450550`**・参照名「家族プラン 月額」・レベル1）。
   - 年額：商品ID `io.dorize.kizunabaton.take.yearly`／価格 **¥5,000**／期間 1年（**Apple ID `6789451136`**・参照名「家族プラン 年額」・レベル2・**「1年間前払い」を選択**〔「12か月契約の月額プラン」ではない〕）。
   - **配信可否＝日本のみ**（175か国中1件）。「今後 App Store に追加される国で自動配信」は**オフ**のまま（意図せぬEU等への拡大防止）。→ 決定根拠は下の 📌 を参照。
3. ✅ 各商品の **ローカリゼーション（日本語）**＝表示名「家族プラン（月額）」／「家族プラン（年額）」・説明「より多くの契約を登録でき、ご家族と共有できます。」（`tokushoho.html` の「家族プラン（月額）¥500（税込）／（年額）¥5,000（税込）」表記・アプリ内プラン名「家族プラン」と整合）。
   - 🔲 **v133 で特典を追加したため要更新（オーナー実務・提出前）**。新説明案（全角45字以内）＝「**契約と保有資産を件数の制限なく登録でき、1年分の支払い予定の確認とご家族との共有ができます。**」
   - ⚠️ **v133 で更新が必要なのはASC商品説明だけではない**（Codex監査 3-2）。①アプリ内料金画面（`renderPlanModal` の plan-feat＝**実装済み**）②ASC の月額・年額サブスク説明（上記・**未**）③**IAP審査用スクリーンショットと審査メモ**＝無料/有料の差・到達手順（設定＞プランを見る・変える／カレンダー下の案内カード）・月額と年額が同一entitlementである旨を明記（**未**）④App説明・スクリーンショットに年間画面を載せる場合は「家族プラン機能」と明示（**未**）⑤**What's New** に「保有資産の在りかの件数制限の解除」「1年の見取り図」を具体記載（**未**）⑥実機で月額/年額の購入・復元・失効を再確認（**未**）。料金画面だけ「制限なし」と書いて実装ガードが残る状態は 2.1/2.3 の明白な機能不一致になるため、①〜②は必ずセットで行う。
4. 🔄 ~~✅~~ **App内課金の審査用情報**＝2026-07-11 登録完了 → **⚠️同日格下げ＝スクショ差し替え必須**（PREFLIGHT-FIX ①のリマインダー行写り込み・詳細は §7.1-7）。旧記録＝レビュー用スクショ（プラン画面・¥500/¥5,000）＋審査メモ（設定＞プランを見る・変える への到達手順）を月額・年額 両商品へ登録→ステータス **「メタデータが不足」→「送信準備完了」**。⚠️スクショは Xcode の Run(⌘R) から起動して撮ること（StoreKit Config は `simctl launch` では未適用＝USD表示になる）。
5. ✅ **Small Business Program**（手数料15%）＝**2026-07-11 申請送信完了（承認待ち・結果はメール通知）**。Q1「他アカウントを支配」＝いいえ／Q2「他者に支配される」＝いいえ／収益$1M以下の確約チェック済。承認月の翌月15日頃から15%適用。
6. ✅ **StoreKit Configuration ファイル**（Xcode）＝**2026-07-03 完了**（`native/ios/App/App/App.storekit` 作成＋シミュレータで購入・復元・失効テスト全成功＝TASKS.md APPSTORE-IAP 行参照）。残＝署名実機での再確認（DEV後）。
7. 🔲 動作確認後、**App Privacy** に「**購入（Purchases）**」ラベルの追加は不要（純正StoreKit＝購入処理は Apple が担い開発者は購入データを収集しない。RevenueCat 等の課金SDKを入れる場合のみ申告要）。⚠️ **App Privacy の総合回答そのものは `Data Is Collected`（収集あり）**＝クラウド保存（Firebase）由来。§5 が正（2026-07-10 是正＝旧「Data Not Collected 維持」は v100 以前の記述で誤り）。
8. ✅ **税金カテゴリ**＝サブスク個別設定は不要（ASC 既定＝**「親アプリに一致する」**）。参照先の**親アプリ側も設定済み**＝「価格および配信状況」ページの税金カテゴリ＝**`App Storeソフトウェア`**（ASC が新規App作成時に付与する既定値。サブスク型ソフトウェアとして適切）。**対応不要**。

> 📌 **配信地域＝日本のみ（2026-07-10 オーナー決定）**。根拠＝PP `docs/privacy-policy.md` **第5条3項**が「将来、国外利用者にサービスを提供する場合、適用法令（GDPR、UK GDPR、CCPA 等）に従い、適切な法的根拠に基づき個人情報を取り扱います」と**国内前提**を明記（＝現時点で国外提供の法的根拠は未整備）／ToS 第19条3項の準拠法＝**日本法**・管轄＝横浜地裁相模原支部／アプリUIは日本語のみ。加えて ASC は **EU デジタルサービス法の「トレーダーステータス」提供を新規App提出の要件**として告知しており（未提供だとEUのApp Storeから削除）、日本限定ならこの対応を回避できる。将来の海外展開時は GDPR等対応＋トレーダーステータス登録＋PP改訂がセットで必要。

> ⚠️ 価格はコード側で **`AppStore` から実価格を取得して表示**（`loadIapPrices`／`renderPlanModal` の `iapPriceText`）＝ASC価格を正に表示。説明文・特商法ページの直書き額（¥500/¥5,000）は ASC 設定額と一致を保つ（不一致は審査/表示リスク）。

---

## 6.3 アプリ本体の価格・配信状況・契約（ASC「価格および配信状況」）✅ 2026-07-10 設定

> サブスク商品とは**別レイヤ**。ASC → 配信 →（左）**収益化 ＞ 価格および配信状況**。

| 項目 | 設定値 | 状態 |
|---|---|---|
| 基準となる国または地域 | **日本（JPY）** | ✅ 設定済 |
| アプリ本体価格 | **¥0.00（無料）** | ✅ 設定済（freemium＝無料DL＋IAP ¥500/月。§0/§3 と整合） |
| アプリの配信状況 | **日本のみ**（1件配信可能／配信不可 174個） | ✅ 設定済。既定は「すべての国または地域（175個）」だった＝**EU配信になる既定値を明示的に日本限定へ変更** |
| 税金カテゴリ（親アプリ） | **App Storeソフトウェア** | ✅ ASC既定値のまま（対応不要）。サブスク側は「親アプリに一致する」で追従 |
| Mac App Store 配信（Appleシリコン搭載Mac） | **オフ** | ✅ 2026-07-10 変更（**既定はオン**）。380×780px のスマホ枠UI・Face IDロック・IAP を Mac で未検証のため明示的に除外 |
| Apple Vision Pro 配信 | **オフ** | ✅ 2026-07-10 変更（**既定はオン**）。Apple 側も「バージョン1.0は互換性がないため配信できません」と表示＝実害はなかったが意図を設定に反映 |
| アプリの配信方法 | **公開**（既定） | ⚠️ 変更せず。**「一度アプリが承認されると、配信方法を変更することはできません」**＝提出前が最終確認の窓 |

> ✅ **有料アプリ契約（Paid Apps Agreement）＝2026-07-10 締結完了**（owner実施）。**アプリ本体が無料でも IAP があるため必須**で、これが未締結だと IAP は実機・Sandbox で機能せず審査提出もできなかった＝**IAP系の最上流ブロッカーが解除された**。
>
> | 項目 | ステータス（2026-07-10 実確認） |
> |---|---|
> | 有料アプリ契約 | ✅ 有効（2026/7/10 – 2027/7/8） |
> | 無料アプリ契約 | ✅ 有効（2026/7/7 – 2027/7/8） |
> | 銀行口座（住信SBI） | ✅ 有効（銀行通貨 JPY／ロイヤルティ通貨 USD） |
> | U.S. Form W-8BEN | ✅ 有効（ニックネーム `W-8BEN 2026`） |
> | U.S. Certificate of Foreign Status of Beneficial Owner | ✅ 有効（`Certificate 2026`） |
>
> **実施順序**（依存関係あり）＝①法人情報の更新（種類=個人）→②有料アプリ契約に署名→③銀行口座登録→④納税フォーム2種を送信。**すべて owner 実施**（Claude は本人特定情報・銀行口座番号・宣誓署名を入力しない）。
>
> **納税フォームの実記入（記録）**＝W-8BEN は Part II 第10項に **Article and paragraph `12 (1)`／rate `0`％／`Income from the sale of applications`** を選択（日米租税条約第12条1項＝使用料は居住地国のみ課税→米国源泉徴収0%）。生年月日欄は **`MM-DD-YYYY`**（米国式）に注意。6.a. Foreign TIN（＝マイナンバー）は `(if any)`＝任意で、空欄でも送信可。送信ボタンは Part III の**2つ目**のチェック「I certify that I have the capacity to sign…」を入れるまで無効。Certificate 側は 1〜5 が自動入力・編集不可で、入力するのは**ニックネーム・宣誓チェック・署名・Title（`Owner` 等）**のみ。※**W-8BEN 送信では Certificate は自動充足されない**（個別に記入・署名が要る）。

> 📌 §6.2 の 📌（日本のみ配信の根拠）は本セクションのアプリ本体配信にもそのまま適用される。**EU DSA トレーダーステータス要件が効くのはアプリ本体の配信国**と考えられる。
>
> ✅ **完了＝EU DSA トレーダーステータス（2026-07-11 申告実施済）**。ビジネス画面が緑チェック**「現時点で、すべての規制要件を満たしています」**表示に変わり、赤バナー解消を実測確認。**申告内容＝『トレーダーではないアカウント（This is not a trader account）』**（日本のみ配信ゆえ・連絡先登録不要）。以下は要否確定の根拠（2026-07-11 Apple公式ヘルプで確認）＝**申告は必須・回避不可だが、日本のみ配信なら非トレーダーを選ぶだけ**。Apple公式は「EUのApp Storeで配信しない（＝日本のみ・TestFlight・代替配信のみ 等）場合、App Store上でトレーダーとして行動していない」と明記＝**非トレーダー申告が正**。赤バナーが消えないのは**アカウント単位の未申告**が理由で、配信を日本限定にしても申告するまでは消えない仕様（回避ではなく申告で解消する）。**申告導線**＝ASC「ビジネス」→ **契約（Agreements）タブ** → コンプライアンス欄「**コンプライアンス要件を満たす（Complete Compliance Requirements）**」→ **「This is not a trader account（トレーダーではないアカウント）」を選択 → 完了**。新規App提出時にも同じ申告を求められるため**提出前に必ず完了**（申告すればバナー解消・提出のブロック要因も解除）。※旧記述「日本限定にしたことで当該要件を回避している」は誤り＝**回避ではなく非トレーダーとして申告する**のが正（2026-07-11 確定・出典＝Apple Developer Help『Manage European Union Digital Services Act trader requirements』）。

---

## 6.4 Sandbox 実機購入検証（ランブック）✅ 2026-07-11 実機PASS

> StoreKit Config テスト（ローカル）と **Sandbox 実機検証（実サンドボックスサーバ経由）は別物**。後者はASC登録商品が実際に取得・購入できるかを実機で通しで確認するもの。**提出前に一度は通しておく**。以下は 2026-07-11 に実施し PASS した手順（再審査・別端末でも再現可）。

**前提（すべて充足済）**：有料アプリ契約 有効（§6.3）／ASCサブスク商品「送信準備完了」（§6.2）／実機（本検証は iPhone・**シミュレータ不可**＝実サンドボックスは物理デバイスのみ）。

**手順**
1. **Sandbox テスターを作成**（ASC → ユーザとアクセス → **Sandbox** → テストアカウント → ＋）
   - 🔴 **メールは受信可能な `+エイリアス` にする**（例 `bati10.inter+kbsandbox@gmail.com`）。Gmail は `+○○` を本アドレスに配送＝新規メール作成不要。**`+`抜き（例 `…interkbsandbox@…`）は実在せず、サインイン時の2ファクタ確認コードが届かず詰む**（初回はこれで作り直しになった）。
   - 国＝**日本**（アプリのストアフロントと一致／不一致だと商品を取得できない）。パスワードは8文字以上・大小英字＋数字、控える。
2. **スキームの StoreKit Config を外す**（Xcode → Product → Scheme → Edit Scheme → **Run → Options → StoreKit Configuration = `None`**）
   - 🔴 これをやらないと**ローカルStoreKitテストが使われ実サンドボックスに届かない**（=既済みのテストと同じ）。検証後は `App.storekit` に戻す。
3. **実機ビルド**：`cd native && npx cap copy ios` → Xcode で**物理iPhone**を選択 → ⌘R（署名は Personal/自Team の Apple Development でOK）。
4. **iPhone をサンドボックスにサインイン**：設定 → デベロッパ → **SANDBOX APPLE ACCOUNT** に①のテスターでサインイン → 「メールアドレスを確認」→ コード送信 → 届いたコードを入力。
5. **購入**：アプリ → 設定 → プランを見る・変える → 家族プラン購入。**購入シート上部に `Sandbox` 表示＋月額¥500（JPY）＋「テスト用に限ります。請求は発生しません」**＝実サンドボックス取得成功の証拠。サイドボタン2回で承認。
6. **確認（実測PASS）**：購入後「現在: 家族プラン ご利用中」＋解約導線「きずなbaton の解約・プラン変更」出現（`isPaid=true`）／「購入を復元」で加入維持／（任意）数分後の自動失効→無料復帰。
7. **後片付け**：スキームの StoreKit Configuration を `App.storekit` に戻す（スクショ撮影ワークフローで必要）。

---

## 6.5 SUBMIT-DAY ⑧ Review Notes（ASC「App Review に関する情報」→メモ欄）ドラフト

> 提出時に ASC のバージョンページ「App Review に関する情報」→「メモ」へ貼り付け（4000字制限・英語推奨）。サインイン情報欄は**「サインインが必要」チェックを外す**（アカウント任意のため）。内容根拠＝TASKS.md APPSTORE-PREFLIGHT-FIX ⑧（アカウント任意／家族ピル疑似ビュー・サンプル9件／招待機能説明／Face ID fallback）＋v119 フィードバック復活。
> **2026-07-14 追記＝再提出用「RESUBMISSION NOTE」を冒頭に追加**（Guideline 2.1(b) リジェクト対応・v120/Build 9）。何を直したか＋購入→即切替の検証手順＋解約直後も期間満了まで「ご利用中」表示が正である旨（審査員の誤解予防）を明記。実機×Sandbox で購入→即切替は 2026-07-14 オーナー確認済。

```
Thank you for reviewing Kizuna Baton (きずなbaton).

RESUBMISSION NOTE — this build resolves the previous rejection under Guideline 2.1(b) Performance / App Completeness (the subscription did not switch to the paid plan after purchase).

What was fixed: on a successful purchase the app now applies the paid entitlement immediately from the purchase result, instead of waiting on a follow-up entitlement query that can lag right after purchase (especially in the sandbox). The plan screen switches to the paid state without needing to relaunch the app.

How to verify:
- Open Settings (gear icon, top-right) > プランを見る・変える (View / change plan).
- On 家族プラン (Family plan) tap このプランを選ぶ and complete the sandbox purchase.
- The Family plan card immediately shows 現在ご利用中 / ご利用中のプラン (currently subscribed) and the free 10-contract limit is removed. No restart needed.
- 購入を復元 (Restore Purchases) re-syncs the entitlement from the App Store.

Note on cancellation (expected behavior): after cancelling, the app intentionally keeps showing the plan as active until the end of the already-paid period (StoreKit currentEntitlements), and switches back to the free plan automatically when the subscription actually expires.

1. NO SIGN-IN REQUIRED: The app is fully functional without an account. All data is stored locally on the device. Creating an account (email + password) is optional and only used for the optional cloud backup and family invitation features. No demo account is needed for review.

2. SAMPLE DATA: On first launch the app is pre-populated with 9 sample contract entries (Netflix, utilities, etc.) so you can immediately see how contracts, sharing settings and monthly totals are presented. Samples can be edited or deleted freely.

3. FAMILY MEMBER PILLS (top of home screen): The pills (husband / wife / child) are a built-in simulated preview on a single device: tapping a member shows what that person WOULD see under the current per-contract sharing settings. This is a core demonstration feature and makes no network calls.

4. FAMILY INVITATION (Settings > 家族とつなぐ準備): Optional cloud feature. An account owner can enable cloud backup and send an email invitation (one-time code) to a family member, who then sees only the contracts explicitly shared with them. It requires two accounts; the main review flow does not depend on it.

5. FACE ID: Used only to lock/unlock the app locally (NSFaceIDUsageDescription provided). If Face ID is unavailable or fails, the app falls back to the device passcode. No biometric data leaves the device.

6. IN-APP FEEDBACK (Settings > アプリ情報 > ご意見・フィードバック): Sends only pre-defined choice values (a 3-option impression and fixed tags) to our feedback form endpoint. There is no free-text input field, and no personal data is attached.

7. SUBSCRIPTION: One auto-renewable subscription group ("家族プラン", ¥500/month or ¥5,000/year) unlocks unlimited contract entries; the free tier allows up to 10. Cancellation is reachable in-app within two taps (Settings > プランを見る・変える > manage subscriptions sheet).
```

> **SUBMIT-DAY ⑨（リリース方式）**：同じバージョンページ下部「バージョンのリリース」＝**「このバージョンを手動でリリース」**を選択してから Submit for Review（審査通過後に自分のタイミングで公開＝push/Pages 目視との順序を守るため）。

---

## 7. 残作業（このタスクのクローズ条件）

### 7.1 META 文言・素材
1. ✅ スクショ 6.9"(1320×2868) を5枚（§4）— **2026-07-10 v113 ビルドで再取得（βバッジ解消）→ 2026-07-11 ASC 6.9インチ枠へアップロード完了**（6.5インチ枠は「6.9インチディスプレイを使用」の自動流用＝別途不要）。手順＝`npx cap copy ios`→シミュレータ raw 5枚→`build-appstore-marketing-screenshots.js` で store 版再生成→ASC差替
2. ✅ メタデータ文言の**オーナー最終確認**（§1〜§3）— **2026-07-02 完了**（サブタイトル/プロモ/説明文をv0.8で確定反映・改訂履歴 v0.8 参照）
3. ✅ App Privacy ラベル回答（§5）を App Store Connect に登録・**2026-07-11 公開完了**（7種＝名前/メール/支払い情報/その他の財務情報/その他のユーザコンテンツ/ユーザID/購入履歴・全て App機能/リンクあり/トラッキングなし）
4. ✅ プライバシーポリシー/サポートURL の公開URL化（§6）→ **2026-06-30 `support.html`＋`tokushoho.html` 公開済（`55f01d8`）／2026-07-03 PP/ToS `.html` 化完了（案A＝リンク差替のみ・v89）**
5. ✅ アイコン1024・PrivacyInfo.xcprivacy・NSFaceIDUsageDescription（完了済）
6. ✅ **ASC 各URL欄の登録（§6.1）＋サブスク商品登録（§6.2）**＝**2026-07-10 いずれも完了**（§6.1 全項目クローズ／§6.2 は 1〜3・グループ表示名 完了）
7. 🔄 ~~✅~~ **IAP 審査用スクショ**（プラン画面・§6.2-4）＝2026-07-11 登録完了 → **⚠️同日 ✅→🔄 に格下げ＝差し替え必須**（APPSTORE-PREFLIGHT-FIX ①：プラン画面に未実装の有料特典「お支払い日のリマインダー」行が写り込み確定→行削除後の画面で両商品とも再撮影・再登録。差替後「送信準備完了」維持を確認）。旧記録＝両商品へ登録し「メタデータが不足」→「送信準備完了」に解消（上記1のスクショ再取得と同一 v113 ビルド・Xcode Run 起動で ¥ 表示を撮影）
8. ✅ **Small Business Program 申請**（手数料30%→15%・§6.2-5）＝**2026-07-11 送信完了（承認待ち・結果はメール通知）**。
9. ✅ **EU DSA トレーダーステータス申告**（§6.3 末尾）＝**2026-07-11 申告完了**。『This is not a trader account（トレーダーではないアカウント）』を申告＝ビジネス画面が緑チェック「すべての規制要件を満たしています」表示・赤バナー解消を確認。
10. ✅ 親アプリの**税金カテゴリ**＝`App Storeソフトウェア`（ASC既定値）で設定済＝**対応不要**（v0.12 で確認・§6.2-8）

### 7.2 課金（配信＝同時課金）に伴う提出前タスク（2026-06-29 是正＝個人開発スケールに proportionate 化）

> 🟢 **是正**：旧「⛔提出ブロッカー＝税理士/弁護士の専門家確認必須」を撤回。Apple が merchant of record として課金・領収・自動更新表示・解約導線・消費税の多くを肩代わりするため、開発者の実務はセルフサービスで足りる。**実質やるのは「特商法ページ＋PP の公開URL化」だけ**。詳細＝`../finance/fin-tax-iap-worksheet.md §0`。

6. ✅ **特商法に基づく表記**＝テンプレ自前で足りる（弁護士不要）。氏名/住所は「請求があれば遅滞なく開示」で省略運用。**2026-06-30 `tokushoho.html` 本番公開済（`55f01d8`・HTTPS 200 確認）**。`../finance/fin-tax-iap-worksheet.md §1,§5.5`。
7. 🟢 **FIN-TAX（消費税/インボイス）＝専門家確認不要**。消費税＝国内事業者ゆえプラットフォーム課税の対象外だが**免税事業者（課税売上1,000万円以下）ゆえ申告・納付なし**（売上1,000万円接近時に再訪）。インボイス＝**登録しない**（B2C＝登録すると免税が外れ損）。事実確認のみで close。`../finance/fin-tax-iap-worksheet.md §2,§3`。
8. ✅ **APPSTORE-IAP**＝StoreKit2 自前プラグイン（竹=¥500/月・¥5,000/年）実装済（v82・`native/ios/App/App/KizunaIAPPlugin.swift`）。**2026-07-10 ASC 側のサブスク商品設定も完了**（商品ID `io.dorize.kizunabaton.take.monthly`/`.yearly`・グループ `take`＝§6.2）。審査用スクショ（§7.1-7）・**Sandbox 実機購入検証（2026-07-11 実機PASS・手順=§6.4）** ともに完了。残＝提出時 push のみ。
9. ✅ **アプリ内 解約導線**（2タップ以内）・**自動更新の表示**＝Apple 標準＋v82 実装済（`planManage`＝`AppStore.showManageSubscriptions`／renderPlanModal に自動更新開示文）。新規対応なし＝renderPlanModal と特商法表記の文言一致を自分で確認。
10. 🟢 **課金まわりの有料法務レビュー＝不要**。不安が残る論点のみ無料窓口（よろず支援拠点・税務署無料相談）で当てる任意の保険。

---

## 文言精査ログ（2026-07-01・Claude）

DUNS待ちの並行作業として §1〜§3 を精査。オーナー最終確認（§7.1-2）の前段。

- **文字数検証（日本語1文字＝1カウント）**：全フィールド制限内。App名 **8字**/30（旧記載「9」を訂正）・サブタイトル 14/30・プロモ **102**/170（残68）・キーワード **80字**/100（残20・確定案＝18語＋17カンマ＝63＋17）・説明文 §3.1 は4000内。
- **リスク照合＝クリア**：①「死亡／生存確認／死亡判定」表現は全フィールドで**不使用**②emergencyModeの自動発動・自動通知は**非宣伝**（β=OFF・§7整合）③Guideline 2.3.1（無料誤認）＝説明文 §3.1 が「基本機能は無料＋有料プラン（月額制・自動更新）」と freemium を明示＝クリア。
- **キーワード確定（オーナー 2026-07-01）**：64字案→**80字案に確定**＝`親/老後/自動更新/支払い管理` を追加、`見守り` は**採用**、`おひとりさま` は**不採用**（家族へ手渡す核とミスマッチ）。§3.2 参照。
- **残＝オーナー最終確認のみ**（App名/サブタイトル/プロモ/説明文の文面トーン最終判断）。文面本体は据置（churn回避）。
- **【2026-07-02 オーナー最終確認 完了】** ①App名＝**確定**（据置）②サブタイトル＝現案14字→**「サブスクや契約を、家族にそっと手渡す」(18字)** へ変更（カテゴリ語＝サブスク/契約 を追加し「何のアプリか」を明示・検索インデックスも活用）③プロモ＝末尾に **「無料ではじめられます。」** 追加（102→113字・閲覧者の第一疑問への即答）＋ASC入力時は改行なし1段落④説明文＝最終行のみ「さらに便利にお使いいただける」→**「より多くの契約を登録できる」** に差替（有料の実利を具体化・件数は非固定で将来変更耐性）。他は据置。**→ §1〜§3 反映済み（v0.8）**。

## 改訂履歴

- v0.22 (2026-07-20): **スクショ1枚目＋プロモテキストを「もしもの時」訴求へ差替（オーナー起票「何のためのアプリかわかりづらい」・1.1(10) 提出に同乗）**。①store-01 見出し「契約を、家族で見やすく整理。」→「**もしもの時も、家族が契約に迷わない。**」＋サブ「契約の存在と解約の手がかりを、元気なうちにそっと共有」（§4/§4.1・ビルダー更新→5枚再生成・目視検証済）②プロモテキスト（§2）を「もしもの時、ご家族はあなたの契約にたどり着けますか？…」118/170字へ差替（審査不要フィールド）。いずれも**事前共有型の表現＝発動・自動開示の示唆なし・死亡等の直接表現なし**（冒頭ガードレール準拠）。2〜5枚目・App名/サブタイトル/説明文/キーワードは据置。**✅同日 ASC 反映完了＝バージョン 1.2 (11) として審査提出済**（⚠️提出先は 1.1 ではない＝**1.1 は 2026-07-17 に配信済みと ASC 実査で判明**したため 1.2 を新規作成。詳細＝TASKS.md `APP-PLAN-LIMIT-SYNC` 行／handover 2026-07-20(3)）。プロモテキストは 1.2 で保存済（**配信済みバージョンのメタデータは読み取り専用＝1.1 側では編集不可**）。スクショ1枚目はオーナーが手動差替（Claude の file_upload はローカルパスを拒否）。あわせて **§2 の新設項目「このバージョンの最新情報」94字を記入**＝「・料金プランの画面で、ご家族と共有できる人数の表示を正しくしました。／・無料プランでご家族と共有できる人数を1名までとしました。すでに共有を始めているご家族は、そのままご利用いただけます。」（アップデート版では必須フィールド・grandfather を利用者向けに明示）。
- v0.21 (2026-07-14): **§6.5 Review Notes 冒頭に「RESUBMISSION NOTE」を追加＝Guideline 2.1(b) リジェクト（Build 8）対応の再提出用**。何を直したか（購入成立結果を即反映＝Sandbox 反映遅延の回避）＋検証手順（設定→プランを見る・変える→家族プラン購入→即「ご利用中」・復元）＋解約直後も期間満了まで active 表示が正である旨を明記。対応コードは v120/Build 9。実機×Sandbox の購入→即切替はオーナー確認済（2026-07-14）。
- v0.20 (2026-07-12): **§6.5 新設＝SUBMIT-DAY ⑧ Review Notes（ASC メモ欄）貼り付け用英語ドラフト＋⑨手動リリース選択の手順**。内容＝アカウント任意（サインイン不要・デモアカウント不要）／サンプル9件＝仕様デモ／家族ピル＝疑似ビュー／招待機能＝任意クラウド／Face ID＝パスコード fallback／v119 で復活したアプリ内フィードバック（選択式のみ・自由記述なし）／サブスク解約導線2タップ。ASC への実反映（⑦説明文の■規約ブロック含む）は提出時オーナー作業。
- v0.19 (2026-07-11): **提出前最終レビュー（Fable）でブロッカー4件発見→本書の関連2箇所を格下げ同期**（状態正本は TASKS.md `APPSTORE-PREFLIGHT-FIX`）。①§6.2-4／§7.1-7 の IAP 審査用スクショを ✅→🔄 差し替え必須へ（プラン画面に未実装の有料特典「お支払い日のリマインダー」行が写り込み＝行削除後に両商品とも再撮影・再登録）②§1 説明文末尾に「■ 規約」ブロック（ToS/PP の公開 URL）を追加＝標準 EULA 採用時の 3.1.2 メタデータ保険（PREFLIGHT-FIX ⑦・ASC 実反映は提出時 owner 作業）。※他のブロッカー（規約バイナリ同梱＝生成器 `tests/gen-legal-html.py` 実装済／同意モーダル版番号／「プロトタイプ」文言）はアプリ側＝本書の対象外。
- v0.18 (2026-07-11): **APPSTORE-IAP「Sandbox 実機購入検証」完了（実機PASS）**＝§6.4 にランブックを新設。iPhone実機＋Sandboxテスター（`+エイリアス`メール・日本）＋スキームの StoreKit Configuration=`None` で実サンドボックス経由の購入を通し確認＝`Sandbox` 表示・月額¥500(JPY)・購入→「家族プラン ご利用中」＋解約導線→復元 PASS。詰まった2点をランブック化＝①メールを`+`抜きにすると2FA確認コードが届かず詰む②スキームのStoreKit Configを`None`にしないと実サンドボックスに届かない。§7.2-8 更新（Sandbox検証を完了へ）。**これで IAP の提出ブロッカーは全消化＝残るは提出時 push（Small Business は承認待ち）**。
- v0.17 (2026-07-11): **EU DSA トレーダーステータスの要否を Apple 公式ヘルプで確定**（提出直前の最大の未確定点を解消）。**結論＝申告は全開発者に必須・回避不可だが、日本のみ配信なら『This is not a trader account（トレーダーではないアカウント）』を選ぶだけ**（連絡先登録不要）。Apple は「EUのApp Storeで配信しない場合、App Store上でトレーダーとして行動していない」と明記＝非トレーダー申告が正。赤バナーはアカウント単位の未申告が理由で、日本限定にしても申告するまで消えない仕様（回避ではなく申告で解消）。導線＝ビジネス→契約タブ→コンプライアンス欄「コンプライアンス要件を満たす」→非トレーダー選択→完了。新規App提出時も同申告を要求されるため提出前に完了必須。§6.3 ⚠️→✅ 化・§7.1-9 更新。出典＝Apple Developer Help『Manage EU DSA trader requirements』。※Small Business Program 申請は導線確認済（developer.apple.com/app-store/small-business-program →「Enroll」／要件＝前年・当年とも総収益100万USD以下＝個人開発は対象。承認月の翌月15日から15%適用）。**∴ 同日 owner が両件を ASC で実行完了**＝EU DSA は『This is not a trader account』申告→ビジネス画面が緑「すべての規制要件を満たしています」表示・赤バナー解消／Small Business は enrollment 送信完了（承認待ち・結果メール通知）。**APPSTORE-META の owner ASC 残作業は全消化**（Sandbox 実機購入検証も 2026-07-11 完了＝APPSTORE-IAP・残るは提出時 push）。
- v0.16 (2026-07-11): **ASC 提出用アセット3件を実アップロード完了（オーナー手動）→ §6.2/§7 を同期**。①アプリ本体スクショ5枚を 6.9インチ枠へ（6.5インチ枠は自動流用）②IAP審査用スクショ（¥500/¥5,000）＋審査メモを月額・年額 両商品へ→**「メタデータが不足」→「送信準備完了」**③App Privacy ラベルを公開（7種＝名前/メール/支払い情報/その他の財務情報/その他のユーザコンテンツ/ユーザID/購入履歴・全て App機能/リンクあり/トラッキングなし・アナリティクス未使用）。学び＝IAP画面は Xcode の Run(⌘R) から起動して撮る（StoreKit Config は `simctl launch` 未適用でUSD表示になる）／ASC スクショ枠はドラッグ即コミットで「保存」ボタン対象外。**∴ APPSTORE-META の残＝2件＝Small Business 申請・EU DSA トレーダーステータス確認**（いずれもオーナー作業・依存なし。次セッションで実施予定）。
- v0.15 (2026-07-10): **§7 残作業チェックリストを §6 の実施結果に同期**（§6.1〜§6.3 で完了した項目が §7 で 🔲 のまま残り、残作業の全体像が読めない状態だった）。①§7.1-4/-6・§7.2-6/-8 の stale な「残＝…」記述を完了に更新（ASC URL欄・サブスク商品登録・特商法ページ公開）②§7.1-1 のスクショを ✅→🔄 に格下げ（β排除前の撮影＝`APP-DEBETA` 後に再取得必須）③未記載だった残項目3件を §7.1 に明示追加＝**IAP審査用スクショ**（両商品「メタデータが不足」の唯一の要因・⛔`APP-DEBETA` 後）・**Small Business 申請**・**EU DSA トレーダーステータス確認**（いずれも依存なし＝着手可）④§7.1-10 に親アプリ税金カテゴリ＝設定済・対応不要を明記。**∴ APPSTORE-META の残＝5件（うち2件が `APP-DEBETA` 待ち＝APPSTORE-SUBMIT へのクリティカルパス）**。
- v0.14 (2026-07-10): **Mac App Store 配信・Apple Vision Pro 配信をオフに変更**（両方とも ASC 既定はオン）。理由＝380×780px のスマホ枠UI・生体ロック・IAP を Mac/visionOS で未検証。Vision Pro は Apple 側も「v1.0 は互換性なし」と表示していたが意図を設定に反映。⚠️「アプリの配信方法＝公開」は**承認後に変更不可**のため提出前が最終確認の窓（§6.3 表に追記）。※v0.12 で「1つ目のチェックは Vision Pro」と記していたのは誤りで、実際は **Mac App Store 配信**（訂正済み）。
- v0.13 (2026-07-10): **有料アプリ契約 締結完了（owner実施）＝IAP系の最上流ブロッカー解除**。有料アプリ契約・銀行口座（住信SBI）・W-8BEN・Certificate of Foreign Status がすべて「有効」。§6.3 に締結手順と納税フォームの実記入内容（W-8BEN 第10項＝日米租税条約 `12 (1)`／`0`%／`Income from the sale of applications`、生年月日 `MM-DD-YYYY`、送信ボタンは Part III の2つ目のチェックで有効化、Certificate は W-8BEN 送信では自動充足されず個別署名要）を記録。これで **Sandbox 実機購入検証が着手可能**に。⚠️ EU DSA トレーダーステータスの赤バナーは**契約完了後も消えず**＝提出前の要確認事項として継続。
- v0.12 (2026-07-10): **§6.3 新設＝アプリ本体の価格・配信状況を設定**。基準国=日本(JPY)・**本体価格=¥0（無料）**・**配信=日本のみ**（既定は「すべての国175個」＝EU含む → 明示的に日本限定へ変更＝EU DSA トレーダーステータス要件を回避）。**税金カテゴリは親アプリも設定済み（`App Storeソフトウェア`）と判明＝v0.11 §6.2-8 の「親アプリ未設定」は誤りにつき訂正**（サブスクページの「親アプリに一致する」表示から参照先を未確認のまま推測したもの）。新規フォロー2件を記録＝⚠️**有料アプリケーション契約が未締結**（IAPがあるため本体無料でも必須・銀行/税務情報の登録を伴う owner作業）／⚠️**Apple Vision Pro 配信が既定オン**（未検証・オフ推奨）。
- v0.11 (2026-07-10): **§6.2 サブスク商品登録 完了**。グループ `take`（ID `22222383`・表示名「家族プラン」）＋商品2件（月額 `6789450550`／¥500／1か月・年額 `6789451136`／¥5,000／1年・年額は「1年間前払い」）を作成。製品IDはコード `IAP_PRODUCTS` と実測一致。**配信地域＝日本のみをオーナー決定**（PP第5条3項の国内前提・ToS日本法・EU DSA トレーダーステータス回避／自動配信オフ）＝§6.2 📌 に根拠を新設。ローカリゼーション（表示名・説明）も両商品＋グループに登録。税金カテゴリはサブスク側は既定「親アプリに一致する」で不要と判明したが、**親アプリ側が未設定**であることを新規フォロー項目として §6.2-8 に追記。残＝審査用スクショ（**APP-DEBETA 後**＝βバッジ写り込み回避）・Small Business 申請。
- v0.10 (2026-07-10): **§6.1 ASC URL欄登録 完了**。App Store Connect に App レコード新規作成（Apple ID `6789437356`）＝サポートURL・マーケティングURL・プライバシーポリシーURLの3件を登録・保存。EULAは ASC 既定の「Appleの標準使用許諾契約」を採用＝追加対応不要と判明（独自ToSはアプリ内リンクで到達性を既に充足）。§6.1 は全項目クローズ、残は §6.2（サブスク商品登録・App Privacyラベル登録）のみ。
- v0.9 (2026-07-10): **APPSTORE-DEV 有効化（ASC 利用可）に伴う stale 記述の是正**。①§6.2-7 の「App Privacy は **Data Not Collected 維持**」を撤回＝v100 のクラウド保存(Firebase)導入で §5 が既に `Data Is Collected` に更新済みだったのに §6.2 が旧記述のまま残り、ASC 登録時に誤申告を招く矛盾だった。純正StoreKit ゆえ「購入(Purchases)」ラベル不要である点は維持しつつ、総合回答は「収集あり」と明記。②§5 の「招待先メール（第三者情報）は申告対象外＝`cloudInvite=false` で休眠」を再判定＝**v112 で `cloudInvite:true` に解禁済みのため前提が消滅**。招待先メールは収集にあたるが `Contact Info → Email Address`（Linked・App Functionality）で既にカバー済＝ASC ラベル回答・`PrivacyInfo.xcprivacy` とも追加変更なし。
- v0.8 (2026-07-02): **メタデータ文言 オーナー最終確認 完了・反映**（§1〜§3）。②サブタイトルを「家族に「契約」をそっと手渡す」(14)→**「サブスクや契約を、家族にそっと手渡す」(18)**（カテゴリ語追加・検索インデックス活用）③プロモ末尾に **「無料ではじめられます。」** 追加(102→113/170)＋ASC入力は改行なし1段落の注記追加④説明文 最終行「さらに便利にお使いいただける有料プラン」→**「より多くの契約を登録できる有料プラン」**（有料の実利を具体化・件数は非固定で審査再提出回避）。①App名＝確定据置。**残＝ASC URL欄登録（§6.1・owner）のみ＝META文言はクローズ可**。
- v0.7 (2026-07-02): **スクショ6.9"(1320×2868)5枚 取得完了**（§0/§7.1）。取得過程で **ネイティブ側の運用バグを発見・修正**＝`native/ios/App/App/public/`（Capacitorのビルド投入先）が `npx cap copy` 未実行のためstale＝ソース(`shukatsu-prototype.html`/`native/www`)には既にある `env(safe-area-inset-top)` 対応がバンドルに未反映で、実機/シミュレータでステータスバーとユーザーバー(⚙/アバター)が重なっていた。**ソースコード変更なし＝`cap copy`→リビルドのみで解消**。今後の版bump運用に「HTML変更後は必ず `npx cap copy ios` を実行してからネイティブビルドする」を追記要（TASKS.md参照）。
- v0.6 (2026-07-01): **キーワード確定（オーナー）**＝80字案（`見守り`採用・`おひとりさま`不採用〔家族へ手渡す核とミスマッチ〕・`親/老後/自動更新/支払い管理`追加）。§3.2 を単一の確定案へ収束。
- v0.5 (2026-07-01): **文言精査（Claude・DUNS並行）**。全フィールドの文字数を実測検証（App名の記載「9」→実測「8」に訂正）＝全て制限内。リスク照合クリア（死亡/生存確認 不使用・emergencyMode非宣伝・2.3.1無料誤認クリア）。§3.2 にキーワード拡張案（64→87字・高意図低リスク語）と `見守り` 注記を追加。文面本体は churn 回避のため据置＝残はオーナー最終確認のみ。
- v0.4 (2026-07-01): **ASC 登録の段取りをチェックリスト化（§6.1 URL欄／§6.2 サブスク商品IAP）＝owner作業**。§6 URL表を公開済みの実HTTPS URL（`support.html`/`tokushoho.html`＝`55f01d8`・2026-06-30公開）へ更新し「未push/未公開」のstale注記を解消。利用規約行に v83 の購入画面リンク（3.1.2）追加を反映。§7.1 残作業を更新（残＝ASC URL欄登録＋サブスク商品登録）。
- v0.3 (2026-06-29): **課金の提出ブロッカーを個人開発スケールに proportionate 化（オーナー是正）**。旧「⛔提出ブロッカー＝税理士/弁護士の専門家確認必須」を §0/§7.2/優先表で撤回。Apple が merchant of record として課金・領収・自動更新・解約・消費税を肩代わりするため、消費税（免税事業者ゆえ納付なし）・インボイス（B2C＝登録しない）は専門家確認不要、特商法はテンプレ自前（弁護士不要）、有料法務レビュー不要。実質の提出前タスクは「特商法ページ＋PP の公開URL化」のみへ。詳細＝`../finance/fin-tax-iap-worksheet.md §0`。
- v0.2 (2026-06-28): **課金方針変更「配信＝同時課金」を反映**（オーナー決定）。説明文の価格表現を「将来有料予定（β無料）」→ freemium（無料開始＋有料プラン稼働）へ。課金に伴う提出ブロッカー（特商法表記・FIN-TAX消費税・解約導線・APPSTORE-IAP実装）を §0/§7.2 に追加。App Privacy に IAP（StoreKit純正推奨／RevenueCat導入時はPurchases申告）の注記。無料一次確認は emergencyMode 限定で課金は対象外と明記。
- v0.1 (2026-06-28): 新規作成。App名/サブタイトル/プロモ/説明文/キーワード/スクショ計画/App Privacyラベル/カテゴリ・年齢・URL を下書き。アイコン・Privacy Manifest・FaceID は既完了として内訳整理。β=emergencyMode OFF 前提で「もしもの時自動発動」は非宣伝・柔らかい文言で統一。

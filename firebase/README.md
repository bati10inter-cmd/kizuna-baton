# firebase/ — きずなbaton クラウド接続の開発環境（APP-V2-SYNC）

道②（端末間の家族接続・v2アップデート）の Firebase 関連を集約するディレクトリ。
正本アプリは従来どおり `shukatsu-prototype.html`（単一HTML・ビルドツール不使用）。ここは**開発ツールとサーバ側資産のみ**。

- P1（APP-V2-AUTH）: Auth Emulator（本README）
- P2a（APP-V2-FIRESTORE）: `firestore.rules` ＋ ルールのエミュレータテスト（`test/`）追加済 ← **本節「Firestore セキュリティルール」参照**
- P3-core（APP-V2-INVITE-SERVER）: `functions/`（Cloud Functions callable）＋結合テスト追加済 ← **本節「招待サーバ化（Cloud Functions）」参照**

`node_modules/` は `.gitignore` 対象（native/ と同様）。

## Auth Emulator の起動（実プロジェクト・実APIキー不要）

```bash
cd firebase
npm install          # 初回のみ
npx firebase emulators:start --only auth --project demo-kizuna-baton
```

- `demo-` プレフィックスのプロジェクトIDは Firebase Emulator の「デモプロジェクト」＝実リソースに一切接続しない
- Emulator UI: http://127.0.0.1:4000 （登録ユーザーの一覧・パスワード再設定メールの oob リンク確認）
- Auth API: http://127.0.0.1:9099

## アプリ側の接続切替（自動）

`shukatsu-prototype.html` の `isCloudDevHost()` が `localhost`/`127.0.0.1`（Web のみ・native 除外）を検知したときだけ `connectAuthEmulator` に接続する。
本番 config は `FIREBASE_CONFIG` プレースホルダ（`__FIREBASE_API_KEY__` 等）に、オーナーのコンソール作業（TASKS.md **APP-V2-FIREBASE-SETUP**）完了後に差し込む。

## オーナー作業: 実プロジェクトの作成（APP-V2-FIREBASE-SETUP）

エミュレータ検証はこの作業なしで完結する。実端末・本番での動作にはこの作業が必要。

1. https://console.firebase.google.com → 「プロジェクトを追加」→ 名前例 `kizuna-baton`（Google アナリティクスは不要=オフでよい）
2. 左メニュー「構築 > Authentication」→「始める」→ ログイン方法で **「メール / パスワード」を有効化**（他は不要）
3. プロジェクト概要 ⚙ →「プロジェクトの設定」→「マイアプリ」→ **Web アプリ（</>）を追加**（ニックネーム例 `kizuna-baton-web`・Hosting は不要）→ 表示される `firebaseConfig` の **apiKey / authDomain / projectId / appId** を控える
4. `shukatsu-prototype.html` の `FIREBASE_CONFIG`（`__FIREBASE_API_KEY__` 等のプレースホルダ）へ差し込む（Claude に貼り付けで依頼可。apiKey は公開可能な識別子＝秘密情報ではない）
5. **Blaze（従量課金）への切替は P3（Cloud Functions）着手時でよい**。P1（Auth）・P2（Firestore）は無料の Spark プランで動く。切替時もエミュレータ・小規模利用なら実費ほぼ ¥0（budget アラート設定を推奨）

### Firestore ロケーション（APP-V2-FIREBASE-REGION・確定）

- **`asia-northeast1`（東京）＝日本国内保管**（2026-07-07 オーナーが実プロジェクトで作成・Standard エディション・本番モード）。**ロケーションは作成後変更不可**。
- 越境（個情法28条）への含意＝**契約・資産・カード会社名/下4桁・メモ・家族メッセージ等の本体は日本国内**。一方 **Firebase Authentication はリージョン選択不可＝Google グローバル基盤（米国想定）にメール/uid 等の認証情報のみ保管**＝この部分だけ国外が残る。
- 28条は「外国にある第三者」該当が **事業者所在（Google LLC＝米国法人）** で判断されうるため、東京保管でも検討自体は残る＝**基準適合体制ルート（Google Cloud DPA を相当措置と整理し国名(米国)・制度概要・措置を自前開示）** で対応（LEG-CROSSBORDER・個人開発スケールで弁護士不要の方針）。PP v4.0 第7条3項は「Firestore＝東京(国内)／Authentication＝Google(国外・限定情報)」の2分割で記述する。

## 動作確認の手順（P1）

1. 上記でエミュレータ起動
2. 別ターミナルでリポジトリルートから `python3 -m http.server 8000`
3. `shukatsu-prototype.html` の `FEATURES.cloudSync` を一時的に `true` へ（**コミットしない**）
4. http://localhost:8000/shukatsu-prototype.html → 設定 →「家族とつなぐ準備」で 登録/ログイン/ログアウト/パスワード再設定 を確認
5. 検証後 `cloudSync:false` に戻す

## Firestore セキュリティルール（P2a・APP-V2-FIRESTORE）

`firestore.rules` はクライアントの `canViewContract(c, viewerId)`（`shukatsu-prototype.html`）の **live ステージ**をサーバ側へ写像したもの。**権限の真の境界はこのルール**（クライアント判定は UX 用）。P2a はルール本体とエミュレータテストのみ＝アプリ本体・`sw.js`・本番には一切触れない（`cloudSync:false` のまま）。Firestore への実データ書込・同意つき移行UIは P2b（別）。

### canViewContract(live) → ルールの対応

| visibility.mode | 本人(owner) | 承諾済み share を持つ家族(viewer) |
|---|---|---|
| `all`（未設定も `getVisibility` が all 正規化） | 可 | 可 |
| `selected` | 可 | `liveViewers` に viewer の memberId を含むときのみ可 |
| `private` | 可 | 不可 |
| `after_only` | 可 | **live では不可**（もしもの時＝emergencyMode P5 の別ゲート・本ルールでは非実効） |
| 未知mode | 可 | 不可（fail-safe） |

- **memberId↔uid ブリッジ**: `liveViewers` は memberId（`'m2'`）を持つが Firestore 認証は uid。`shares/{ownerUid}_{viewerUid}` に **`viewerMemberId`** を持たせてルールで照合する。この share は **P3（Cloud Functions）が招待受諾時に生成**（P2a ではテストが合成 share を seed して検証）。
- **後方互換**: `visibility` 未設定＝`{mode:'all'}`（`getVisibility` 正規化）をルールでも維持（`visMode()`）。
- `shares`/`invitations` へのクライアント書込は禁止（P3 の admin SDK 専用）。`consentLogs` は追記のみ（update/delete 不可）。

### ルールのテスト（エミュレータ・Java 必須）

Firestore エミュレータは **Java（JRE）が必要**（Auth エミュレータは不要だった）。未導入なら:

```bash
brew install openjdk        # keg-only。PATH に前置して使う（sudo 不要）
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
```

テスト実行（`firebase/` 直下）:

```bash
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"   # java を PATH に（未設定なら）
npm install                                          # 初回のみ（@firebase/rules-unit-testing・firebase）
npm run test:rules                                   # Firestore エミュレータ(8080)を起動しルールテストを実行
```

`test/firestore.rules.test.mjs` が canViewContract 写像の全分岐（all/selected/private/after_only・未設定=all・未承諾share・viewer write 拒否・assets 同型・cards owner-only・consentLogs 追記のみ・invitations/shares 書込禁止）を検証。**全 29 ケース PASS が受け入れ基準**（stage-2b v99 で list クエリ系を追加＝viewer の 2クエリ〔mode=='all' ／ 'selected'＋array-contains〕許可・フィルタ無し全件 list 拒否・shares のフィールドベース list・assets 同型）。実行中に出る `PERMISSION_DENIED` ログは拒否系テスト（assertFails）が意図的に発生させたもの。

## 招待サーバ化（Cloud Functions）（P3-core・APP-V2-INVITE-SERVER）

`functions/` は招待フローを **Cloud Functions v2 callable（Admin SDK）** で実装したもの。Admin SDK は `firestore.rules` をバイパスするため、rules で `allow write:false` にした `invitations`/`shares` への書込はここでのみ行う。**権限の真の境界は firestore.rules（家族の契約 read）＋本 functions（発行/受諾/取消）**。

### callable の一覧

| 関数 | 呼び出し | 役割 |
|---|---|---|
| `issueInvite` | owner | token/OTP サーバ発行・レート制限強制（1日3件/pending+accepted 5件）・invitations と pending member 作成・OTP を招待先メールへ送信。**戻り値に OTP を含めない**（到達確認は招待先メールでのみ得られる＝サーバ化の肝） |
| `acceptInvite` | invitee | OTP＋同意で受諾。`shares/{ownerUid}_{viewerUid}` 作成（rules の memberId↔uid ブリッジ `viewerMemberId` を転写）＋ consentLog 追記＋ member accepted 化＋ owner 通知。誤 OTP は `otpAttempts++`、5回でロック |
| `revokeInvite` | owner | pending 招待を取消（以後受諾不可） |
| `unlinkShare` | owner | 受諾済み share を `status:'revoked'` に（rules read ゲートで家族の閲覧を即遮断＝閲覧権限停止） |
| `listInvites` | owner | 自分の招待一覧を **OTP/otpHash 抜き**で返す |
| `deleteAccount` | 本人 | **アカウントと全データの即時完全削除**（APP-V2-ACCOUNT-DELETE・Apple 5.1.1(v)・ToS第18条/PP第14条「14日以内・復元不可」整合）。順序＝shares 両方向整理（viewer 側は相手 owner の member を `unlinked` 化）→ invitations（発行分＋受諾分）削除 → `users/{uid}` サブツリー＋`consentLogs/{uid}` を `recursiveDelete` → **最後に Auth `deleteUser`**（途中失敗時は認証が残り再実行で完遂＝冪等） |

- **OTP は平文保存しない**（`otpHash` のみ・token を salt に sha256）。純ロジックは `functions/lib/`（`otp.js`/`rateLimit.js`/`validators.js`/`invite.js`/`constants.js`）に分離しテスト容易化。
- **メール送信は差替アダプタ** `functions/lib/email.js`（env `EMAIL_PROVIDER`）。既定 `'log'`＝**エミュレータ限定**で OTP を console 出力（実送信なし）。`'smtp'`/`'sendgrid'` は**デプロイ時にオーナーが有効化するスタブ**。**⚠️本番（エミュレータ外）で `EMAIL_PROVIDER` 未設定のまま呼ばれると `'log'` は使えず明示 throw**（OTP 平文が Cloud Logging に残る誤設定デプロイを防ぐ厳格ゲート＝`_devOutbox` と同型・APP-V2-SEC-REVIEW 2026-07-07）。よって deploy 前に下記手順2で実プロバイダ設定が必須。
- **`_devOutbox/{token}`** はエミュレータ限定（`isEmulator()` ゲート）の OTP 露出で、結合テストが受諾に使う。firestore.rules に match が無く既定 deny＝クライアント不可視。**本番デプロイでは絶対に書かれない**。

### テスト（エミュレータ・Java 必須）

```bash
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"   # java を PATH に
npm run test:functions:deps    # 初回のみ（functions/ の firebase-admin・firebase-functions を install）
npm run test:functions         # Functions+Firestore+Auth エミュレータで結合テスト
```

`test/functions.test.mjs` が issueInvite（正常/不正入力/1日3件超/pending5件超/未認証）・acceptInvite（正常で share/consentLog/member/通知生成・誤OTP・5回ロック・期限切れ・revoked・自己受諾不可）・revokeInvite・unlinkShare（rules 経由で家族 read が遮断されることまで）・listInvites（OTP 非返却）・**deleteAccount（未認証拒否／本人の全データ・共有・招待・Auth の完全削除＋家族 read 遮断＋再サインイン不可／viewer 側削除の owner 非干渉＋member unlinked 化）**を検証。**全 20 ケース PASS が受け入れ基準**（削除系は専用 Auth ユーザーを都度作成＝共有 owner/viewer 非破壊。stage-2b v99 で acceptInvite の ownerName 転写 2件＋inviteLink 形式検証を追加）。

> ⚠️ **`.env.local`（エミュレータ専用・deploy 非同梱）**: O4 deploy 用の `.env` が `EMAIL_PROVIDER=sendgrid` を持つため、エミュレータではそのままだと Secret 不在で issueInvite が throw する。`functions/.env.local` が `EMAIL_PROVIDER=log` で上書きしテストを成立させる（firebase emulators は `.env.local` を優先）。

### オーナー deploy 作業（P3-deploy・本セッション対象外）

エミュレータ検証はこの作業なしで完結する。**実端末で別端末の家族へ届けるには次が必要**（いずれもオーナー・課金/資格情報を伴う）:

1. **Blaze（従量課金）へ切替**（Cloud Functions deploy の前提。小規模は無料枠内の公算・budget アラート推奨）。
2. **メール送信基盤の選定・設定**＝`email.js` の本番実装を有効化。候補: (a) Firebase 拡張「Trigger Email」＋ SendGrid/SMTP、(b) `nodemailer`＋SMTP（SendGrid/Mailgun/SES 等）。API キー等は functions シークレット（`defineSecret`）で管理し**リポジトリに置かない**。
3. `firebase deploy --only functions,firestore:rules`（push/deploy はオーナー確認）。
4. ~~**クライアント配線**~~ **✅完了＝発行側 stage-2a（v98）＋受諾/閲覧側 stage-2b（v99）**。
5. ~~**O5 再deploy（stage-2b 変更分）**~~ **✅完了（2026-07-08）**＝`firebase deploy --only functions,firestore:rules,firestore:indexes`（exit 0・asia-northeast1）。stage-2b の rules（shares フィールドベース化・contracts/assets の get/list 分離）＋functions（acceptInvite ownerName 転写・招待リンク実URL `APP_INVITE_BASE_URL`・inviterName 修正）＋**複合インデックス2本**（`firestore.indexes.json`＝contracts/assets の `visibility.mode` 等値＋`visibility.liveViewers` array-contains）を反映。**Q-B（selected＋array-contains）は本番のみ複合インデックスを要求＝エミュレータでは発覚しないため事前に `firestore.indexes.json` で整備**。`firebase firestore:indexes` で登録確認済。
6. 実端末 E2E（owner 端末で発行 → 別端末の invitee がアカウント作成 → メールのリンク（`#invite=<token>`）または貼り付け＋OTP＋同意で受諾 → メンバーピルに owner が出て共有契約が read-only で見える）。

## 受諾者側 cross-account read（stage-2b・v99・APP-V2-INVITE-CLIENT）

受諾者（viewer）が owner の共有契約を読む経路。**権限の真の境界は firestore.rules**：

- viewer は `shares` を `where('viewerUid','==',自分)`＋`where('status','==','accepted')` で逆引き（rules はフィールドベース照合＝list 証明可能）。
- owner の契約は **2クエリ**で取得＝`where('visibility.mode','==','all')` ／ `where('visibility.mode','==','selected')`＋`where('visibility.liveViewers','array-contains',<share の viewerMemberId>)`。rules の `allow list`（クエリと同形の平坦式）が静的証明で許可。private/after_only/対象外 selected はクエリにも rules にも載らない（二重防御）。フィルタ無し全件 getDocs は拒否。
- cards は owner-only（読まない）。categories は share 保有で read 可（ラベル・アイコン用）。owner の members/プロフィールは読めないため、**表示名は acceptInvite が share doc に転写する `ownerName`**（owner の members/m1 由来・未ミラーは null→クライアント「ご家族」）。
- クライアント側は取得データを**メモリのみ**保持（localStorage へ他人の契約を永続しない）。端末保存はピル表示用メタ `SHARED_OWNERS_KEY` のみ。

### ブラウザ2プロファイル E2E（エミュレータ）

```bash
# 1. エミュレータ（アプリは localhost では実 projectId で接続するため --project kizuna-baton）
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
npx firebase emulators:start --only auth,firestore,functions --project kizuna-baton
# 2. リポジトリルートで
python3 -m http.server 8796
```

1. `shukatsu-prototype.html` の `FEATURES.cloudSync` を一時 `true` に（**コミットしない**）。
2. ブラウザA（owner）: `http://localhost:8796/shukatsu-prototype.html` → 設定からアカウント作成 → クラウド保存を有効化（ミラー） → 家族管理から招待発行（メール欄・メンバー選択=m2 等）。
3. OTP と招待リンクの取得＝エミュレータ実行中は `_devOutbox/{token}`（Emulator UI の Firestore タブ、または REST: `curl -H "Authorization: Bearer owner" "http://127.0.0.1:8080/v1/projects/kizuna-baton/databases/(default)/documents/_devOutbox/<token>"`）。
4. ブラウザB（別プロファイル・viewer）: `http://localhost:8796/shukatsu-prototype.html#invite=<token>` で開く → アカウント作成 → 確認コード（OTP）→ 同意4件 → 受諾。
5. 確認: ピルに「○○さんの契約（共有）」が出る／all と selected（自分対象）のみ見える／private・after_only・selected（非対象）が見えない／追加FAB・編集/削除・公開範囲バッジが無い／機密はマスク表示／owner 側で unlinkShare（または share を revoked 化）→ viewer の `loadMyShares()` 後にピルから消え自分ビューへ退避。
6. 終了後 `FEATURES.cloudSync` を `false` に戻し、特性テスト（`tests/characterization.html`）が ALL PASS であること。

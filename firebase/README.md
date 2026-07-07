# firebase/ — きずなbaton クラウド接続の開発環境（APP-V2-SYNC）

道②（端末間の家族接続・v2アップデート）の Firebase 関連を集約するディレクトリ。
正本アプリは従来どおり `shukatsu-prototype.html`（単一HTML・ビルドツール不使用）。ここは**開発ツールとサーバ側資産のみ**。

- P1（APP-V2-AUTH）: Auth Emulator（本README）
- P2（APP-V2-FIRESTORE）: `firestore.rules` を追加予定
- P3（APP-V2-INVITE-SERVER）: `functions/` を追加予定

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

## 動作確認の手順（P1）

1. 上記でエミュレータ起動
2. 別ターミナルでリポジトリルートから `python3 -m http.server 8000`
3. `shukatsu-prototype.html` の `FEATURES.cloudSync` を一時的に `true` へ（**コミットしない**）
4. http://localhost:8000/shukatsu-prototype.html → 設定 →「家族とつなぐ準備」で 登録/ログイン/ログアウト/パスワード再設定 を確認
5. 検証後 `cloudSync:false` に戻す

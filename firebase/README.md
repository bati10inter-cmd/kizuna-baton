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

## 動作確認の手順（P1）

1. 上記でエミュレータ起動
2. 別ターミナルでリポジトリルートから `python3 -m http.server 8000`
3. `shukatsu-prototype.html` の `FEATURES.cloudSync` を一時的に `true` へ（**コミットしない**）
4. http://localhost:8000/shukatsu-prototype.html → 設定 →「家族とつなぐ準備」で 登録/ログイン/ログアウト/パスワード再設定 を確認
5. 検証後 `cloudSync:false` に戻す

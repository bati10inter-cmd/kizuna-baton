# native/ — Capacitor ラップ（App Store 用）

きずなbaton の既存単一HTML（`../shukatsu-prototype.html`）を Capacitor で iOS アプリ化するためのプロジェクト。
**戦略・手順の正本は `../docs/app-store-submission-plan.md`。状態の正本は `../TASKS.md`「📱 App Store 公開（appstore）」。**

## 構成
- `capacitor.config.json` … appId=`app.kizunabaton` / webDir=`www`
- `www/` … 同梱する Web 資産（**git 管理外＝ルートからコピー生成**）

## www/ の再生成（チェックアウト直後に必要）
```bash
cd native
cp ../shukatsu-prototype.html www/index.html
cp ../sw.js www/sw.js
cp ../manifest.json www/manifest.json
mkdir -p www/icons && cp ../icons/icon-180.png ../icons/icon-192.png ../icons/icon-512.png www/icons/
```

## iOS 追加・ビルド
```bash
npm install
npx cap sync ios   # 既に ios/ 追加済み（cap add ios 実行済み・Cap8/SPM構成）
npx cap open ios
```

> 環境は導入済み（Xcode 26.6 / CocoaPods 1.16.2・ただし本プロジェクトは Pods 不使用＝SPM＝`Podfile` なし）。`ios/` は生成済み。

## APPSTORE-IAP（家族プラン・竹 / StoreKit2 自前プラグイン）
- `ios/App/App/KizunaIAPPlugin.swift`（jsName=`KizunaIAP`）。JS は `window.Capacitor.Plugins.KizunaIAP` 経由で呼ぶ（Preferences/BiometricAuthNative と同方式・バンドラ不使用）。
- objectVersion=60 のため File System Synchronized Group は非対応＝Swift ファイル追加時は `App.xcodeproj/project.pbxproj` の 4 セクション（PBXBuildFile / PBXFileReference / PBXGroup(App) / PBXSourcesBuildPhase）へ手動登録が必要。
- **App Store Connect 側で要設定**＝サブスクグループ `take` ＋商品2件：`io.dorize.kizunabaton.take.monthly`（¥500/月）/ `io.dorize.kizunabaton.take.yearly`（¥5,000/年）。商品IDは作成後変更不可。
- ローカル検証は **StoreKit Configuration ファイル**（Xcode Scheme で指定）でシミュレータ購入/復元/解約/更新失効を確認。
- 提出前タスク（2026-06-29 是正＝proportionate 化）＝特商法ページ＋PP の公開URL化のみ。特商法はテンプレ自前（弁護士不要）・消費税/インボイスは免税・B2Cで専門家確認不要（`../docs/app-store-metadata-draft.md §7.2`）。

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

## iOS 追加・ビルド（Xcode/CocoaPods 導入後）
```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

> Xcode・CocoaPods 未導入の環境では `cap add ios` 以降は実行不可。導入手順は submission-plan §3 参照。

import Foundation
import UIKit
import Capacitor

/// v137(APP-BACKUP-NATIVE): データ書き出し（バックアップ／JSONエクスポート）を標準共有シート
/// （UIActivityViewController）経由でファイル化するプラグイン。
///
/// 背景: 従来の `doBackup()`/`doExportJSON()` は Blob URL + `<a download>` 方式だったが、
/// iOS の WKWebView（capacitor://localhost）では blob ダウンロードが機能せず、販売中の
/// App Store 版でバックアップが一度も保存されていなかった（オーナー実機FB・Codexレビュー確認済み）。
///
/// 注意: `UIActivityViewController` の `completed` は「選択したサービスが実行されたか」を示す
/// だけで、Files アプリへの永続保存を保証しない（AirDrop 等でも true になり得る）。そのため
/// メソッド名は saveFile ではなく shareFile とし、JS 側の成功文言も「保存しました」ではなく
/// 「書き出しが完了しました」とする（Codexレビュー B-1）。
///
/// 機密情報はこのプラグイン自体が生成しない＝呼出元がすでに組み立てたバックアップ/エクスポート
/// JSON 文字列をそのままファイル化するだけ（CLAUDE.md「データ範囲」に適合）。
///
/// 公開メソッド:
///  - shareFile({filename, data}) -> {status:'completed'|'cancelled', activityType}
@objc(KizunaSharePlugin)
public class KizunaSharePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KizunaSharePlugin"
    public let jsName = "KizunaShare"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "shareFile", returnType: CAPPluginReturnPromise)
    ]

    @objc func shareFile(_ call: CAPPluginCall) {
        guard let rawFilename = call.getString("filename"), !rawFilename.isEmpty else {
            call.reject("filename is required")
            return
        }
        guard let data = call.getString("data"), !data.isEmpty else {
            call.reject("data is required")
            return
        }
        // basename 化＋拡張子検証（細工された filename でのパストラバーサル等を避ける）
        let basename = URL(fileURLWithPath: rawFilename).lastPathComponent
        guard !basename.isEmpty, basename.lowercased().hasSuffix(".json") else {
            call.reject("filename must be a non-empty .json basename")
            return
        }

        let tmpDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let fileURL = tmpDir.appendingPathComponent(basename)

        func cleanup() {
            try? FileManager.default.removeItem(at: tmpDir)
        }

        do {
            try FileManager.default.createDirectory(at: tmpDir, withIntermediateDirectories: true)
            try data.write(to: fileURL, atomically: true, encoding: .utf8)
        } catch {
            cleanup()
            call.reject("failed to write temp file: \(error.localizedDescription)")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self, let viewController = self.bridge?.viewController else {
                cleanup()
                call.reject("viewController unavailable")
                return
            }

            let activityVC = UIActivityViewController(activityItems: [fileURL], applicationActivities: nil)

            let completion: UIActivityViewController.CompletionWithItemsHandler = { activityType, completed, _, error in
                cleanup()
                if let error = error {
                    call.reject("share failed: \(error.localizedDescription)")
                    return
                }
                call.resolve([
                    "status": completed ? "completed" : "cancelled",
                    "activityType": activityType?.rawValue ?? ""
                ])
            }
            activityVC.completionWithItemsHandler = completion

            if UIDevice.current.userInterfaceIdiom == .pad {
                // iPad は popover 起点が必須。KizunaPrintPlugin と同様に画面中央から表示する。
                let sourceView = viewController.view!
                activityVC.popoverPresentationController?.sourceView = sourceView
                activityVC.popoverPresentationController?.sourceRect = CGRect(
                    x: sourceView.bounds.midX, y: sourceView.bounds.midY, width: 0, height: 0)
                activityVC.popoverPresentationController?.permittedArrowDirections = []
            }
            viewController.present(activityVC, animated: true)
        }
    }
}

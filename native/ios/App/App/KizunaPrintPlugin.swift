import Foundation
import UIKit
import Capacitor

/// v135(APP-PRINT-NATIVE): 印刷用書面をネイティブ印刷ダイアログ（UIPrintInteractionController）へ渡すプラグイン。
///
/// 背景: 「データ出力＞出力する」が押しても何も起きないというオーナー実機FBを調査した結果、
/// `window.open('','_blank')` が iOS WKWebView では不可視 window を返し、書き込んだ印刷書面が
/// どこにも表示されない（v115 が規約表示で iframe 化した際に印刷側だけ取り残されていた）ことが
/// 判明。JS 側はアプリ内 iframe（#print-doc-overlay）に書面を表示するよう是正し、「印刷する」
/// ボタンからこのプラグインを呼んでネイティブの印刷シートを開く。
///
/// 機密情報は一切扱わない＝画面にすでに表示済みの書面HTML文字列を受け取り、そのまま
/// UIMarkupTextPrintFormatter に渡すだけ（CLAUDE.md「データ範囲」に適合）。
///
/// 公開メソッド:
///  - printHtml({html}) -> {status}
@objc(KizunaPrintPlugin)
public class KizunaPrintPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KizunaPrintPlugin"
    public let jsName = "KizunaPrint"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "printHtml", returnType: CAPPluginReturnPromise)
    ]

    @objc func printHtml(_ call: CAPPluginCall) {
        guard let html = call.getString("html"), !html.isEmpty else {
            call.reject("html is required")
            return
        }
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { call.reject("plugin deallocated"); return }
            let printController = UIPrintInteractionController.shared
            let printInfo = UIPrintInfo(dictionary: nil)
            printInfo.outputType = .general
            printInfo.jobName = "きずなbaton"
            printController.printInfo = printInfo
            printController.printFormatter = UIMarkupTextPrintFormatter(markupText: html)

            let completion: UIPrintInteractionController.CompletionHandler = { _, completed, error in
                if let error = error {
                    call.reject("print failed: \(error.localizedDescription)")
                } else {
                    // completed=false はユーザーがキャンセルした場合＝正常系としてresolve（JS側でエラー扱いしない）
                    call.resolve(["status": completed ? "completed" : "cancelled"])
                }
            }

            if UIDevice.current.userInterfaceIdiom == .pad,
               let sourceView = self.bridge?.viewController?.view {
                // iPad は popover 起点が必須。画面中央から表示する。
                printController.present(from: CGRect(x: sourceView.bounds.midX, y: sourceView.bounds.midY, width: 0, height: 0),
                                         in: sourceView, animated: true, completionHandler: completion)
            } else {
                printController.present(animated: true, completionHandler: completion)
            }
        }
    }
}

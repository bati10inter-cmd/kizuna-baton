import UIKit
import Capacitor

/// APPSTORE-IAP: アプリ内カスタムプラグイン(KizunaIAPPlugin)の登録用 ViewController。
///
/// Capacitor は `capacitor.config.json` の `packageClassList`（`npx cap sync` が
/// npm パッケージから自動生成）に載っているプラグインのみ自動登録する。
/// アプリターゲット内のカスタムプラグインは公式手順どおり CAPBridgeViewController を
/// サブクラス化して `capacitorDidLoad()` で手動登録する（Main.storyboard の
/// customClass をこのクラスに変更済み）。
class KizunaViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(KizunaIAPPlugin())
        bridge?.registerPluginInstance(KizunaPrintPlugin()) // v135(APP-PRINT-NATIVE)
    }
}

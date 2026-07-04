import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    /// APP-LOCK-REGAP(v91): アプリロックの目隠し・再ロックを JS へ通知するヘルパー。
    /// visibilitychange('hidden') は素早いアプリ切替・App Switcher 覗き見では発火しないため、
    /// UIKit のライフサイクルを正として window イベントを発火する（Web 側は未発火＝後方互換）。
    private func triggerKizunaEvent(_ name: String) {
        (window?.rootViewController as? CAPBridgeViewController)?.bridge?.triggerWindowJSEvent(eventName: name)
    }

    // APP-LOCK-REGAP(v92): JS 側マスクは WKWebView の描画タイミング次第で App Switcher
    // スナップショットに反映されないことがある（別アプリ起動後にマスク欠落の実機報告）。
    // UIKit で同期的に不透明カバービューを重ね、スナップショットの目隠しを確実にする。
    // ロックONかは Capacitor Preferences（UserDefaults "CapacitorStorage.<key>"）を直接参照。
    private var privacyMaskView: UIView?

    private var isAppLockEnabled: Bool {
        UserDefaults.standard.string(forKey: "CapacitorStorage.kizuna-baton:app-lock:v79") == "1"
    }

    private func showPrivacyMask() {
        guard isAppLockEnabled, privacyMaskView == nil, let window = window else { return }
        let mask = UIView(frame: window.bounds)
        mask.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        mask.backgroundColor = UIColor { tc in
            tc.userInterfaceStyle == .dark
                ? UIColor(red: 0.12, green: 0.12, blue: 0.11, alpha: 1)  // ≒ #1F1E1B
                : .white
        }
        let icon = UIImageView(image: UIImage(systemName: "lock.shield"))
        icon.tintColor = .systemGray2
        icon.contentMode = .scaleAspectFit
        icon.translatesAutoresizingMaskIntoConstraints = false
        let label = UILabel()
        label.text = "きずなbaton"
        label.font = .systemFont(ofSize: 17, weight: .semibold)
        label.textColor = .label
        label.translatesAutoresizingMaskIntoConstraints = false
        mask.addSubview(icon)
        mask.addSubview(label)
        NSLayoutConstraint.activate([
            icon.centerXAnchor.constraint(equalTo: mask.centerXAnchor),
            icon.centerYAnchor.constraint(equalTo: mask.centerYAnchor, constant: -20),
            icon.widthAnchor.constraint(equalToConstant: 48),
            icon.heightAnchor.constraint(equalToConstant: 48),
            label.centerXAnchor.constraint(equalTo: mask.centerXAnchor),
            label.topAnchor.constraint(equalTo: icon.bottomAnchor, constant: 10)
        ])
        window.addSubview(mask)
        privacyMaskView = mask
    }

    private func hidePrivacyMask() {
        privacyMaskView?.removeFromSuperview()
        privacyMaskView = nil
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // APP-LOCK-REGAP(v91): 切替アニメ開始の瞬間に目隠しマスク（再認証はまだ要求しない）。
        triggerKizunaEvent("kizunaResign")
        // APP-LOCK-REGAP(v92): スナップショット目隠しはネイティブビューで確実に行う。
        showPrivacyMask()
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // APP-LOCK-REGAP(v91): 本当にアプリを離れた＝ここで再ロック（復帰時に再認証）。
        triggerKizunaEvent("kizunaBackground")
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // APP-LOCK-REGAP(v91): 未解錠なら再認証ゲート、解錠済みならマスク解除（JS 側で判定）。
        triggerKizunaEvent("kizunaActive")
        // APP-LOCK-REGAP(v92): ネイティブ目隠しを外す（未解錠時は JS 側ゲートが下に表示済み）。
        hidePrivacyMask()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

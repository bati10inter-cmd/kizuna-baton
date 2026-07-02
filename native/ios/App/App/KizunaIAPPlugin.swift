import Foundation
import UIKit
import Capacitor
import StoreKit

/// APPSTORE-IAP(v82): きずなbaton 家族プラン(竹) の StoreKit 2 自前プラグイン。
///
/// バンドラ不使用構成のため、JS 側は `window.Capacitor.Plugins.KizunaIAP` 経由で呼ぶ
/// （BiometricAuthNative / Preferences と同方式）。
/// 機密情報は一切扱わない＝Apple が管理する購入トランザクションのみを参照する
/// （CLAUDE.md「データ範囲」に適合。カード番号・口座番号等は保存しない）。
///
/// 公開メソッド:
///  - getProducts({productIds}) -> {products:[{id,displayName,description,price,priceAmount}]}
///  - purchase({productId})     -> {status,active,productId}
///  - restorePurchases()        -> {active}
///  - currentEntitlement()      -> {active}
///  - manageSubscriptions()     -> {status}（アプリ内の解約導線＝消費者法対応）
@objc(KizunaIAPPlugin)
public class KizunaIAPPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KizunaIAPPlugin"
    public let jsName = "KizunaIAP"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "currentEntitlement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise)
    ]

    private var updatesTask: Task<Void, Never>?

    /// プラグイン読み込み時に Transaction.updates を購読し、更新・更新失敗・失効を JS へ通知する。
    /// （アプリ外で発生する自動更新／返金等を反映するため）
    override public func load() {
        updatesTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard let self = self else { continue }
                if case .verified(let transaction) = result {
                    await transaction.finish()
                    await self.notifyEntitlementChanged()
                }
            }
        }
    }

    deinit { updatesTask?.cancel() }

    @objc func getProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("productIds", String.self) ?? []
        guard !ids.isEmpty else { call.reject("productIds is required"); return }
        Task {
            do {
                let products = try await Product.products(for: ids)
                let arr: [[String: Any]] = products.map { p in
                    [
                        "id": p.id,
                        "displayName": p.displayName,
                        "description": p.description,
                        "price": p.displayPrice,                    // ローカライズ済み価格文字列（税込表示）
                        "priceAmount": (p.price as NSDecimalNumber).doubleValue
                    ]
                }
                call.resolve(["products": arr])
            } catch {
                call.reject("getProducts failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else { call.reject("productId is required"); return }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else { call.reject("product not found: \(productId)"); return }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        call.resolve(["status": "purchased", "active": true, "productId": productId])
                    case .unverified(_, let error):
                        call.reject("purchase unverified: \(error.localizedDescription)")
                    }
                case .userCancelled:
                    let active = await self.hasActiveEntitlement()
                    call.resolve(["status": "cancelled", "active": active])
                case .pending:
                    call.resolve(["status": "pending", "active": false])
                @unknown default:
                    call.reject("purchase: unknown result")
                }
            } catch {
                call.reject("purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            // sync は失敗しても currentEntitlements は読めるため致命ではない
            try? await AppStore.sync()
            let active = await self.hasActiveEntitlement()
            call.resolve(["active": active])
        }
    }

    @objc func currentEntitlement(_ call: CAPPluginCall) {
        Task {
            let active = await self.hasActiveEntitlement()
            call.resolve(["active": active])
        }
    }

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        Task { @MainActor in
            if let scene = self.bridge?.viewController?.view.window?.windowScene {
                do {
                    try await AppStore.showManageSubscriptions(in: scene)
                    call.resolve(["status": "shown"])
                } catch {
                    call.reject("manageSubscriptions failed: \(error.localizedDescription)")
                }
            } else if let url = URL(string: "https://apps.apple.com/account/subscriptions") {
                // フォールバック: App Store のサブスク管理ページを開く
                await UIApplication.shared.open(url)
                call.resolve(["status": "fallback"])
            } else {
                call.reject("manageSubscriptions: no scene")
            }
        }
    }

    /// 竹(家族プラン)のサブスクが現在有効か。失効・返金済みは false。
    private func hasActiveEntitlement() async -> Bool {
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result, transaction.revocationDate == nil {
                return true
            }
        }
        return false
    }

    private func notifyEntitlementChanged() async {
        let active = await hasActiveEntitlement()
        self.notifyListeners("entitlementChanged", data: ["active": active])
    }
}

# Design Reference — getdesign.md (VoltAgent awesome-design-md)

このディレクトリは **きずなbaton の UI/UX 磨き込み（F4）で参照する DESIGN.md** を配置する。
ランタイムには 1byte も入らない（単一HTML原則維持）。Claude Code が CSS 設計時に**参照する資料**として使う。

## ファイル

| ファイル | 出典 | 役割 |
|---|---|---|
| `stripe-DESIGN.md` | VoltAgent/awesome-design-md `design-md/stripe/DESIGN.md` | **構造系画面の骨格**（契約一覧 / 詳細 / 設定 / もしもの時の情報部分） |
| `airbnb-DESIGN.md` | VoltAgent/awesome-design-md `design-md/airbnb/DESIGN.md` | **情感系画面の温度**（家族への一言 / ウェルカム / 削除モーダル等の決断モーメント） |
| `LICENSE.voltagent.txt` | VoltAgent/awesome-design-md LICENSE | MIT License 原文（著作権表示保持の義務） |

出典リポジトリ: <https://github.com/VoltAgent/awesome-design-md>

## 使い方（F4 磨き込み時のルール）

### 抽出するもの（採用OK）
- タイポグラフィスケール（フォントサイズ階層・行間・字間・weight 階層）
- spacing スケール（4/8/12/16/24/32/48/64 等の標準化）
- list-item / card / button の内側 padding 規約
- shadow / border-radius / transition の標準値

### 抽出しないもの（採用NG）
- **カラートークン全般**
  - 所有者カラー 3 色（夫 `#185FA5` / 妻 `#D4537E` / 子 `#1D9E75`）は CLAUDE.md で変更禁止
  - family-message 関連 4 色（背景 `#FFF5F8` / ボーダー `#F2D4DE` / テキスト `#5A2638` / ラベル `#A04B6E`）も変更禁止
  - Rausch / Indigo 等のブランド色を取り入れない
- 重い CSS フレームワーク
- 独自フォント CDN 読み込み（Sohne / Cereal は採用しない・system stack のまま）
- 「広告効果のある」エディトリアル装飾（gradient mesh 等）

### 適用方針
- **第1スプリント = 契約一覧（Stripe ベース）**
- 第2スプリント以降は plan mode で個別合意
- 1スプリント = 1〜2画面に絞る（変更点を可視化しやすくするため）

## ライセンス

MIT License（VoltAgent）。改変・再配布自由。著作権表示は `LICENSE.voltagent.txt` で保持。

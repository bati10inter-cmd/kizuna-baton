# AGENTS.md — Codex / 外部AI 向け作業ルール（きずなbaton 正本リポジトリ）

> 詳細な作業ルールは同ディレクトリの **`CLAUDE.md`** が正本。本ファイルは **Codex（および repo外で動く外部AI）** 向けに、ファイル共有境界と画像ガードレールを抜粋・明示するもの。

## Claude ⇄ Codex ファイル共有プロトコル（オーナー決定 2026-07-15）

- **正本リポジトリ**: ここ `/Users/sasakikyouhei/dev/kizuna-baton`（GitHub `bati10inter-cmd/kizuna-baton`）。**書き込み＝Claude Code のみ**（唯一の committer）。
- **Codex 作業場所**: `~/Documents/きずなbaton/`（ローカルのみ・remoteなし）。Codex はここに読み書きする。
- **Codex → repo は読み取り専用**: Codex は `~/Documents/きずなbaton/_repo/`（このリポジトリへのシンボリックリンク）経由で repo を**読む**。**書き込みはサンドボックスが拒否**する（＝オーナー要件「Codexは確認のみ／書き込みはClaudeまたは都度許可」を物理的に担保）。
- **成果物の流れ**: Codex が `~/Documents/きずなbaton/marketing/generated/<topic>/` に出力 → Claude がコピー→ガードレール検証→ここにコミット。
- **入力の受け渡し**: Claude が `~/Documents/きずなbaton/marketing/_inbox/<topic>/` に素材を置く。
- ⚠️ **`_repo/...` が読めなければ、記憶で再現せず即「読めない」と報告して止まる。**

## 画像ガードレール（Codex 生成物の不採用基準）

1. 「β／ベータ／プロトタイプ」文言を入れない。
2. カード番号・口座番号・暗証番号・マイナンバー等の数字を描かない。
3. 「死亡判定／生存確認」等の直接表現を使わない（「もしもの時」は可）。
4. 解約代行の読みを出さない。
5. 誇大・効果断定なし（景表法）。「無料ではじめられます」は確定文言。
6. **日本語テキストは焼き込まない**（gpt-image は日本語が文字化けする）。Codex は写真調KV／情景のみ、日本語コピーは Claude が SVG/PIL で重ねる。

配色: 夫 `#185FA5` / 妻 `#D4537E` / 子 `#1D9E75`・暖色ピンク基調。
規格: 1080×1080 / 1080×1350 / 1080×1920・不透明。完成版＋文字なし版の2系統。

詳細: `CLAUDE.md`（作業全般）・`marketing/AGENTS-image-guardrails` 相当は本節が正。

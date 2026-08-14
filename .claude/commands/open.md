---
description: セッション開始。作業ルール・git状態・版数・引き継ぎを確認し、現在地と次の一手を報告する
argument-hint: [今回やりたいこと（任意）]
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git branch:*), Bash(git fetch:*), Bash(grep:*), Bash(ls:*), Read, Glob, Grep
---

# セッションを開く（きずなbaton）

今回の依頼: $ARGUMENTS
（空なら「前回の続きから」として扱う）

## 収集済みコンテキスト

- ブランチ: !`git branch --show-current`
- 未コミット: !`git status --porcelain | head -30`
- 直近コミット: !`git log --oneline -10`
- origin との差: !`git status -sb | head -1`
- アプリ版数: !`grep -o -m1 'きずなbaton v[0-9]*' shukatsu-prototype.html`
- iOS 版数: !`grep -m2 -E 'MARKETING_VERSION|CURRENT_PROJECT_VERSION' native/ios/App/App.xcodeproj/project.pbxproj | tr -d '\t;'`
- ローカル限定ファイルの有無: !`ls CLAUDE.md HANDOVER.md TASKS.md NEXT_SESSION_PROMPT.md 2>/dev/null`

## やること

### 1. 作業ルールを読む

1. `CLAUDE.md`（作業ルールの**正本**）。
2. `AGENTS.md`（Codex/外部AI 向けの共有境界・画像ガードレール）。

### 2. 引き継ぎを読む

上の「ローカル限定ファイルの有無」に出たものだけを読む。
`HANDOVER.md` → `TASKS.md` → `NEXT_SESSION_PROMPT.md` の順。

⚠️ **これらは `.gitignore` 済み＝オーナーのMacにしか無い。**
Claude Code on the web / リモートセッションは repo を新規クローンして起動するため
存在しない。**無い場合は探し回らず、報告に「未読（ローカル限定ファイル）」と
明記して次へ進む。記憶で内容を再現しない。**

### 3. 現在地を組み立てる

- 直近コミット10件から、いま何の作業系列の途中かを読む
  （`feat:/fix: vNNN …` が機能変更、`chore: iOS 版数を … bump` が提出用ビルド）
- アプリ版数（`<title>` の `vNNN`）と iOS 版数（`MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`）の対応関係を確認する
- 未コミット差分があれば、それが何の作業の途中かを `git diff` で確認する

### 4. 報告する

以下の形式で簡潔に報告し、**そこで止まってオーナーの指示を待つ**。

```
## 現在地
ブランチ / 版数（アプリ vNNN・iOS x.y (z)）/ 作業ツリーの状態

## 前回の続き
直近コミットと引き継ぎから読める、進行中の作業

## 未処理
未コミット差分・未pushコミット・TASKS.md の残件（読めた範囲で）

## 次の一手（最大3件）
1. …
2. …
```

## このセッション中ずっと守ること

- **書き込みは Claude のみ**（AGENTS.md の共有プロトコル。Codex は読み取り専用）
- アプリ本体は単一HTML `shukatsu-prototype.html`。**機能を変えたら `<title>` の版数を上げ、
  コミットメッセージの `vNNN` と一致させる**
- ロジックを変えたら `tests/characterization.html` をブラウザで開いて回帰確認
  （`tests/goldens.json` が期待値。意図的な変更なら goldens を更新して理由をコミットに書く）
- 法務文言（`docs/`・`lp.html`・アプリ内規約）は連動する。片方だけ直さない
- 実装に入る前に、まず上の報告を出す。**勝手に走り出さない**

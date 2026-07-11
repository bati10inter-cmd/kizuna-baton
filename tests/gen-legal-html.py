#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen-legal-html.py — 規約 Markdown を自己完結 HTML へ変換し native バンドルへ同梱する。

背景（APPSTORE-PREFLIGHT-FIX / BLOCKER②）:
  アプリ内の規約リンク `docs/terms-of-service.html` / `docs/privacy-policy.html` は
  GitHub Pages では Jekyll が .md→.html 変換して配信するため 200 になるが、
  Capacitor でラップした native バンドル（native/www・iOS public）には docs/ が存在せず
  リンクが不達（＝3.1.2 の「機能する規約リンク」要件を満たさない）。
  本スクリプトが .md から CDN 非依存・オフライン可の自己完結 HTML を生成し、
  native/www/docs/ と native/ios/App/App/public/docs/ の両方へ出力する。

方針:
  - 依存ゼロ（標準ライブラリのみ）。プロジェクトの「ビルドツール不使用・依存は CDN アイコンのみ」思想に整合。
  - 規約 md が使う記法サブセットのみ対応（見出し h1-h3 / 順序・無順序リスト＋インデントネスト /
    **太字** / `インラインコード` / 段落 / --- 水平線）。テーブル・画像・生 HTML・相互リンクは md 側に不使用。
  - 高齢者ターゲット向けに base 15px・行間広め・max-width 720px。prefers-color-scheme で dark 対応。

使い方:
  python3 tests/gen-legal-html.py            # 生成＋native両所へ配置
  python3 tests/gen-legal-html.py --check    # 生成せず、既存出力が最新 md と一致するか検証（CI/DoD 用）

規約改訂時（版数を上げたら）必ず本スクリプトを再実行し、native バンドルの HTML を更新すること。
"""
import html
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (入力 md, 出力ファイル名) — 出力名はアプリ内リンク href と一致させる
DOCS = [
    ("docs/terms-of-service.md", "terms-of-service.html"),
    ("docs/privacy-policy.md", "privacy-policy.html"),
]

# 出力先（アプリ内リンクは index.html からの相対 docs/…＝各バンドル直下に docs/ を作る）
OUT_DIRS = [
    "native/www/docs",
    "native/ios/App/App/public/docs",
]

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{title} — きずなbaton</title>
<style>
  :root{{
    --bg:#FBFAF6; --fg:#2A2A28; --muted:#6B6A64; --line:#E4E1D7;
    --link:#185FA5; --code-bg:#F1EFE8; --warn-bg:#FFF8E1; --warn-line:#E0B43D; --warn-fg:#754C00;
  }}
  @media (prefers-color-scheme: dark){{
    :root{{
      --bg:#1B1B19; --fg:#E7E5DE; --muted:#A7A69E; --line:#3A3A36;
      --link:#7FB2E6; --code-bg:#2A2A26; --warn-bg:#2E2718; --warn-line:#8A6D22; --warn-fg:#E4C77E;
    }}
  }}
  *{{box-sizing:border-box}}
  html{{-webkit-text-size-adjust:100%}}
  body{{
    margin:0; background:var(--bg); color:var(--fg);
    font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,sans-serif;
    font-size:15px; line-height:1.9; letter-spacing:.01em;
  }}
  .wrap{{max-width:720px; margin:0 auto; padding:20px 18px 64px}}
  .topbar{{
    position:sticky; top:0; background:var(--bg); border-bottom:.5px solid var(--line);
    margin:0 -18px 14px; padding:10px 18px; font-size:14px;
  }}
  .topbar a{{color:var(--link); text-decoration:none}}
  h1{{font-size:21px; line-height:1.5; margin:.4em 0 .5em}}
  h2{{font-size:17px; line-height:1.6; margin:1.6em 0 .5em; padding-top:.3em; border-top:.5px solid var(--line)}}
  h3{{font-size:15.5px; line-height:1.6; margin:1.2em 0 .4em}}
  p{{margin:.5em 0}}
  ul,ol{{margin:.4em 0 .8em; padding-left:1.5em}}
  li{{margin:.25em 0}}
  li>ul,li>ol{{margin:.2em 0 .3em}}
  a{{color:var(--link)}}
  code{{background:var(--code-bg); padding:.08em .4em; border-radius:4px; font-size:.9em;
    font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; word-break:break-all}}
  hr{{border:0; border-top:.5px solid var(--line); margin:1.6em 0}}
  strong{{font-weight:700}}
  .muted{{color:var(--muted)}}
</style>
</head>
<body>
<div class="wrap">
<div class="topbar"><a href="javascript:history.back()">‹ 戻る</a></div>
{body}
</div>
</body>
</html>
"""


def render_inline(text):
    """インライン記法を HTML へ。先に HTML エスケープし、code→bold→link の順で復元。"""
    # コード片を先に退避（内部の ** や [] を装飾解釈しないため）
    codes = []

    def stash_code(m):
        codes.append(m.group(1))
        return "\x00CODE%d\x00" % (len(codes) - 1)

    text = re.sub(r"`([^`]+)`", stash_code, text)
    text = html.escape(text, quote=False)
    # **bold**
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    # [label](url)
    text = re.sub(
        r"\[([^\]]+)\]\(([^)]+)\)",
        lambda m: '<a href="%s">%s</a>' % (html.escape(m.group(2), quote=True), m.group(1)),
        text,
    )
    # コード復元（コード内容もエスケープ）
    text = re.sub(
        r"\x00CODE(\d+)\x00",
        lambda m: "<code>%s</code>" % html.escape(codes[int(m.group(1))], quote=False),
        text,
    )
    return text


LIST_RE = re.compile(r"^(?P<indent>\s*)(?P<marker>\d+\.|-|\*)\s+(?P<text>.*)$")
HEAD_RE = re.compile(r"^(#{1,6})\s+(.*)$")


def md_to_body(md):
    lines = md.split("\n")
    out = []
    stack = []       # 開いているリスト: [(indent, tag)]
    li_open = False  # 最深レベルに未クローズの <li> があるか
    para = []        # 段落バッファ

    def flush_para():
        if para:
            out.append("<p>" + render_inline(" ".join(para).strip()) + "</p>")
            para.clear()

    def close_lists_to(indent):
        nonlocal li_open
        # indent より深い（または同値で後述処理）リストを閉じる
        while stack and stack[-1][0] > indent:
            if li_open:
                out.append("</li>")
                li_open = False
            out.append("</%s>" % stack[-1][1])
            stack.pop()
            if stack:
                # 親の <li>（ネストを内包していた）を閉じる
                out.append("</li>")
                li_open = False

    def close_all_lists():
        nonlocal li_open
        while stack:
            if li_open:
                out.append("</li>")
                li_open = False
            out.append("</%s>" % stack[-1][1])
            stack.pop()
            if stack:
                out.append("</li>")
                li_open = False

    for raw in lines:
        line = raw.rstrip()
        stripped = line.strip()

        # 空行: 段落を確定（リストは継続＝空行では閉じない）
        if stripped == "":
            flush_para()
            continue

        # 水平線
        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", stripped):
            flush_para()
            close_all_lists()
            out.append("<hr>")
            continue

        # 見出し
        m = HEAD_RE.match(stripped)
        if m:
            flush_para()
            close_all_lists()
            level = min(len(m.group(1)), 3)
            out.append("<h%d>%s</h%d>" % (level, render_inline(m.group(2)), level))
            continue

        # リスト項目
        m = LIST_RE.match(line)
        if m:
            flush_para()
            indent = len(m.group("indent").replace("\t", "    "))
            tag = "ol" if re.match(r"\d+\.", m.group("marker")) else "ul"
            text = m.group("text")

            close_lists_to(indent)

            if stack and stack[-1][0] == indent:
                # 同レベル: 直前の li を閉じる。マーカー種別が変われば貼り替え
                if li_open:
                    out.append("</li>")
                    li_open = False
                if stack[-1][1] != tag:
                    out.append("</%s>" % stack[-1][1])
                    stack.pop()
                    out.append("<%s>" % tag)
                    stack.append((indent, tag))
            else:
                # より深い（or 初）: 新しいリストを開く（直前 li の内側にネスト）
                out.append("<%s>" % tag)
                stack.append((indent, tag))

            out.append("<li>" + render_inline(text))
            li_open = True
            continue

        # 通常テキスト（段落）。リスト継続中のインデント折返しは li に足す
        if stack and li_open and raw.startswith((" ", "\t")):
            # 直前 li の続き行
            out[-1] = out[-1] + " " + render_inline(stripped)
            continue

        flush_para()
        close_all_lists()
        para.append(stripped)

    flush_para()
    close_all_lists()
    return "\n".join(out)


def build_pages():
    pages = {}
    for src, outname in DOCS:
        with open(os.path.join(ROOT, src), encoding="utf-8") as f:
            md = f.read()
        # タイトル＝最初の H1
        title = "きずなbaton"
        for line in md.split("\n"):
            hm = HEAD_RE.match(line.strip())
            if hm:
                title = hm.group(2).strip()
                break
        body = md_to_body(md)
        pages[outname] = PAGE_TEMPLATE.format(title=html.escape(title, quote=False), body=body)
    return pages


def main():
    check = "--check" in sys.argv
    pages = build_pages()
    mismatched = []
    written = []
    for outdir in OUT_DIRS:
        absdir = os.path.join(ROOT, outdir)
        for outname, content in pages.items():
            path = os.path.join(absdir, outname)
            if check:
                existing = None
                if os.path.exists(path):
                    with open(path, encoding="utf-8") as f:
                        existing = f.read()
                if existing != content:
                    mismatched.append(os.path.join(outdir, outname))
            else:
                os.makedirs(absdir, exist_ok=True)
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                written.append(os.path.join(outdir, outname))

    if check:
        if mismatched:
            print("STALE（再生成が必要）:")
            for p in mismatched:
                print("  - " + p)
            sys.exit(1)
        print("OK: native バンドルの規約 HTML は最新 md と一致")
        return
    for p in written:
        print("wrote " + p)
    print("done: %d ファイル生成" % len(written))


if __name__ == "__main__":
    main()

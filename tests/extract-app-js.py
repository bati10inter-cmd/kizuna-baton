#!/usr/bin/env python3
# shukatsu-prototype.html のメインJSブロックを抽出して標準出力へ。
# ルール: 「行全体が <script> の最初の行」の次から「</script> で始まる最後の行」の直前まで。
# （印刷テンプレート内 <script>...<\/script> は行頭一致しない/エスケープ済のため誤検出しない）
import sys

lines = open(sys.argv[1], encoding='utf-8').read().split('\n')
start = next(i for i, l in enumerate(lines) if l.strip() == '<script>')
end = max(i for i, l in enumerate(lines) if l.startswith('</script>'))
sys.stdout.write('\n'.join(lines[start + 1:end]))

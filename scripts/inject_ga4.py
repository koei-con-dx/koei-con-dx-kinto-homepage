"""
全HTMLページに GA4 ブートストラップスクリプトタグを挿入する。
挿入位置: <meta name="viewport"...> の直後。

CLAUDE.md指定により kintone/html/ 配下は除外（Git管理外・本番無関係）。
冪等性あり: 既に挿入済みのファイルはスキップ。
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent  # work/

VIEWPORT_LINE = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
INJECTION_TAG = '<script src="/scripts/ga4.js"></script>'

# 全 index.html を再帰検索（ただし kintone/ は除外）
def find_target_files():
    targets = []
    for p in ROOT.rglob("index.html"):
        rel = p.relative_to(ROOT)
        parts = rel.parts
        # 除外: kintone/ 配下、node_modules、新規事業、エンゲージメントサーベイ
        if parts[0] in ("kintone", "node_modules", "新規事業", "エンゲージメントサーベイ", "business-idea-reviewer"):
            continue
        targets.append(p)
    return sorted(targets)


def inject(path: Path) -> str:
    """戻り値: 'updated' / 'skipped (already injected)' / 'skipped (no viewport)'"""
    content = path.read_text(encoding="utf-8")
    if INJECTION_TAG in content:
        return "skipped (already injected)"
    if VIEWPORT_LINE not in content:
        return "skipped (no viewport line)"
    # viewport行の直後に挿入（インデント揃え）
    new_content = content.replace(
        VIEWPORT_LINE,
        VIEWPORT_LINE + "\n    " + INJECTION_TAG,
    )
    path.write_text(new_content, encoding="utf-8")
    return "updated"


def main():
    targets = find_target_files()
    print(f"対象ファイル数: {len(targets)}\n")
    for p in targets:
        rel = p.relative_to(ROOT)
        status = inject(p)
        mark = "OK" if status == "updated" else "--"
        print(f"  {mark} {rel}  [{status}]")
    print(f"\n完了")


if __name__ == "__main__":
    main()

# 興栄コンサルタント Web サイト編集ガイド（Claude Code 共有設定）

社員が複数人で Claude Code を使ってサイトを更新する前提のガイド。
新規ジョインしたメンバーは **必ず最初にこのファイルを読むこと**。

---

## 1. このリポジトリは何か

静的 HTML マルチページサイト（Vanilla HTML / CSS / JS、ビルドツールなし）。
Netlify で自動デプロイされ、本番は `https://koei-con-dx.jp/`。

Netlify プロジェクトは **`koei-con-dx.jp` の 1 つだけ**（`Deploys from GitHub` でこのリポジトリを参照）。
ローカルに `kintone/html/` フォルダがあるが、これは Git 管理外の旧ドラフト・本番未デプロイなので **触らない**。

---

## 2. ディレクトリ地図

```
/
├── index.html              トップ
├── private/index.html      民間企業向け
├── public/index.html       自治体向け
├── cases/index.html        導入事例一覧
├── cases/{slug}/index.html 個別事例（例: inuyama, kasugai）
├── column/index.html       コラム一覧
├── column/{slug}/index.html 個別記事
├── company/index.html      会社概要
├── news/index.html         お知らせ一覧
├── contact/index.html      問い合わせフォーム
├── events/index.html       イベント一覧
├── downloads/              配布PDF
├── images/                 画像
├── styles/                 共通CSS
├── robots.txt              クローラー制御（全許可 + sitemap参照）
└── sitemap.xml             サイトマップ（Search Console 送信用）
```

ナビ・フッターは **テンプレート化されていません**。各 `*/index.html` にインライン記載。
**ナビを変更したときは全ページを横並びで修正すること**（`Grep` で `<nav>` を探して全件確認）。

なお、ローカルには上記以外に `kintone/`、`新規事業/`、`エンゲージメントサーベイ/`、各種 `build_*.py` や `*.xlsx`/`*.pptx`/`*.docx` があるが、いずれも Git 管理外（本番無関係）なので触らない。

---

## 3. ブランチ運用 & デプロイ

- `main` ... 本番（Netlify 自動デプロイ）。本番ドメイン: `https://koei-con-dx.jp/`
- `dev` ... ステージング。**固定プレビュー URL: `https://dev--koei-con-kintone.netlify.app/`**（push されるたびに同 URL に最新版が反映）

Netlify サイト名は `koei-con-kintone`（GitHub `koei-con-dx/koei-con-dx-kinto-homepage` リポジトリの GitHub 連携でデプロイ）。

### 標準フロー

1. `dev` ブランチで編集 → コミット
2. `dev` に `git push` → Netlify がプレビューを自動ビルド（数十秒〜数分）
3. **ユーザーに `https://dev--koei-con-kintone.netlify.app/` を案内し、目視確認してもらう**（自動化されたテストは無し）
4. OK が出たら **GitHub の Web UI で `dev` → `main` の Pull Request を作って Merge**（本番反映）

### スタッフ運用 / プレビューアクセス（Netlify アカウント不要）

このリポジトリは複数スタッフ運用を想定。Netlify アカウントは小野様 1 つで足り、**スタッフは GitHub アクセスだけでプレビュー確認可能**。アクセスルートは 3 つ：

| # | ルート | 用途 |
|---|---|---|
| A | 固定 URL `https://dev--koei-con-kintone.netlify.app/` を直接ブラウザで開く | dev push 後すぐ確認したい時 |
| B | GitHub の自分のコミットページ → 緑✓マーク →「Details」→ Netlify Deploy Preview | コミット単位の確認 |
| C | PR ページに Netlify ボットが自動コメントするプレビュー URL | PR レビュー時 |

**前提**: スタッフは GitHub Organization `koei-con-dx` のメンバーで、リポジトリ `koei-con-dx-kinto-homepage` に Write 権限が必要（Private リポジトリのため未招待者は GitHub からも見られない）。

### main への直接操作は Claude からは禁止

`.claude/settings.json` で以下を deny してあるため、Claude Code 経由では main を絶対に触れません：

- `git push origin main`（main への直 push）
- `git checkout main` / `git switch main`（main への切替）
- `git push --force` / `-f`（force push 全般）

これは **「main の更新は必ず dev を経由した PR マージのみ」** という運用を強制するための設計。
GitHub Free プランの Organization × Private リポジトリでは Branch protection が機能しないため、
Claude 設定側で同等の安全装置を実装している。

### main 反映の手順（社員はこの手順だけ）

1. dev ブランチでの編集 → push まで完了し、Netlify プレビューでユーザーが OK を出している前提
2. ブラウザで `https://github.com/koei-con-dx/koei-con-dx-kinto-homepage` を開く
3. 上部「Pull requests」タブ →「New pull request」
4. **base: `main`, compare: `dev`** を選択 →「Create pull request」
5. タイトルは dev ブランチの最新コミットメッセージで OK
6. 「Merge pull request」→「Confirm merge」
7. 数分で本番（`koei-con-dx.jp`）に反映

### Claude が dev に push したら必ず行うこと

> dev ブランチへの push 後は **`https://dev--koei-con-kintone.netlify.app/` を案内**し、
> 確認結果を待ってから次のアクション（main マージなど）に進む。
> main へのマージは Claude 側では実行できないので、ユーザーに以下の compare URL での PR マージを案内する：
> `https://github.com/koei-con-dx/koei-con-dx-kinto-homepage/compare/main...dev`

理由：このリポジトリには自動テストが無いため、人間の目視確認が唯一の品質ゲート。

### Netlify 認証 / 公開状態

現在は **完全公開** 状態（`netlify.toml` を 2026-05 に削除、`robots.txt` も `Allow: /` に変更、`sitemap.xml` を追加済み）。
Basic 認証や noindex は今は無し。再度クローラーを止めたい時は `robots.txt` で `Disallow: /` にするのが最短。

---

## 4. デザイン仕様（厳守）

### カラー
- イエロー（kintoneアクセント）: `#FFCB05`
- ネイビー（メイン）: `#003366`
- ブルー（サブ）: `#005A9C`
- オレンジ（民間CTA）: `#FF6B35`
- テキストグレー: `#4A5568`
- 背景グレー: `#F7FAFC`

### タイポグラフィ
- フォント: Noto Sans JP（Google Fonts CDN）
- 本文: 16px / line-height 1.8

### レスポンシブ閾値
- PC: 1200px〜
- タブレット: 768〜1199px
- モバイル: 〜767px（ハンバーガーメニュー）

### 技術制約
- **依存ライブラリ追加禁止**（Vanilla JS のみ）
- フレームワーク（React / Vue / jQuery 等）導入禁止
- 例外: Font Awesome 6.4.0（CDN）と Google Fonts のみ

---

## 5. 編集してはいけないファイル

サイト更新と無関係なので Claude は触らない：

- `build_marketing_excel.py`, `build_marketing_pptx.py`
- `kintone_3year_marketing_plan.{xlsx,pptx}`
- `business-idea-reviewer/`, `エンゲージメントサーベイ/`
- `kintone/` 配下一式（旧ドラフト・本番無関係。Git 管理外）
- `新規事業/`, `エンゲージメントサーベイ/`（事業計画ドラフト）
- `.claude/settings.local.json`（個人設定、gitignore 済み）

---

## 6. よくある作業のレシピ

### ニュース追加
- `news/index.html` の記事カード一覧に **新しい順** で追加
- 日付フォーマットは既存カードに合わせる

### 導入事例の追加
1. `cases/index.html` に新規カード（`<article class="case-card">`）を追加
2. `cases/{slug}/index.html` を新規作成（既存事例 `cases/inuyama/index.html` をコピーして作るのが速い）
3. 写真は `images/cases/{slug}/` に配置
4. 顔写真など個人特定情報を含む写真はぼかし処理を確認

### ナビゲーション変更
- 全 `*/index.html` の `<nav>` ブロックを横並びで同じように修正
- `Grep "<nav"` で全件洗い出してから一括対応

### コミットメッセージ
- 日本語で簡潔に。例:
  - `ニュースを新しい順に並べ替え（4/20→4/9→4/1→11/4）`
  - `犬山事例のphoto3をぼかし版に差し替え`
- 既存の `git log` のスタイルを踏襲

---

## 7. ローカル確認

```bash
# Python（推奨。標準で入っている）
python -m http.server 8000
# → http://localhost:8000

# Node がある場合
npx http-server -p 8000
```

Live Server（VS Code 拡張）でも可。

---

## 8. Claude Code 利用上の注意

- このリポジトリの `.claude/settings.json` には **チーム共通の権限ルール** が入っている（編集する場合はチームに共有）
- 個人用の権限上書きは `.claude/settings.local.json` に書く（gitignore 済み・他人には見えない）
- `git push` / `git commit` / `git merge` などサイトに影響する操作は **必ず確認プロンプトが出る** 設計
- 確認プロンプトが出たときは内容を読んでから承認すること
- main 関連の操作（`git push origin main`, `git checkout main`, `git switch main`, force push）は **Claude では deny 済み** ＝ プロンプトすら出ずに拒否される。main を更新したいときは GitHub Web UI で PR マージする運用

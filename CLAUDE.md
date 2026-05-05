# 興栄コンサルタント Web サイト編集ガイド（Claude Code 共有設定）

社員が複数人で Claude Code を使ってサイトを更新する前提のガイド。
新規ジョインしたメンバーは **必ず最初にこのファイルを読むこと**。

---

## 1. このリポジトリは何か

静的 HTML マルチページサイト（Vanilla HTML / CSS / JS、ビルドツールなし）。
Netlify で自動デプロイされ、本番は `https://koei-con-dx.jp/` 系。

サイトは2系統入っています：

| パス | 内容 |
|---|---|
| `/`（ルート） | 本サイト（自治体・民間共通の入り口） |
| `/kintone/html/` | kintone 専用サイトのソース（別 Netlify サイト） |

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
├── netlify.toml            Netlify設定（Basic認証あり）
└── kintone/html/...        kintone専用サイト一式（同様の構造）
```

ナビ・フッターは **テンプレート化されていません**。各 `*/index.html` にインライン記載。
**ナビを変更したときは全ページを横並びで修正すること**（`Grep` で `<nav>` を探して全件確認）。

---

## 3. ブランチ運用 & デプロイ

- `main` ... 本番（Netlify 自動デプロイ）
- `dev` ... ステージング（Netlify がプレビュー URL を払い出す）

### 標準フロー

1. `dev` ブランチで編集 → コミット
2. `dev` に `git push` → Netlify がプレビューを自動ビルド
3. **ユーザーにプレビュー URL を案内し、目視確認してもらう**（自動化されたテストは無し）
4. OK が出たら **GitHub の Web UI で `dev` → `main` の Pull Request を作って Merge**（本番反映）

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
2. ブラウザで `https://github.com/koei-con-dx/kinto-homepage` を開く
3. 上部「Pull requests」タブ →「New pull request」
4. **base: `main`, compare: `dev`** を選択 →「Create pull request」
5. タイトルは dev ブランチの最新コミットメッセージで OK
6. 「Merge pull request」→「Confirm merge」
7. 数分で本番（`koei-con-dx.jp`）に反映

### Claude が dev に push したら必ず行うこと

> dev ブランチへの push 後は「Netlify のプレビュー URL を確認してください」と
> ユーザーに案内し、確認結果を待ってから次のアクション（main マージなど）に進む。
> main へのマージは Claude 側では実行できないので、ユーザーに Web UI での PR マージを案内する。

理由：このリポジトリには自動テストが無いため、人間の目視確認が唯一の品質ゲート。

### Netlify 認証

`netlify.toml` で Basic 認証あり：
- ユーザー: `koei` / パスワード: `demo2024`
- `X-Robots-Tag: noindex, nofollow` を全ページに付与（検索エンジンブロック）

本番公開時は `netlify.toml` のパスワードと noindex 設定を見直すこと。

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
- `kintone/blog_kintone_what_can_it_do.md`, `kintone/revision_*.txt`, `kintone/interview_annotated.txt`
  （編集中ドラフト・元原稿。HTML 化されたものは `kintone/html/` 配下）
- `.claude/settings.local.json`（個人設定、gitignore 済み）

---

## 6. よくある作業のレシピ

### ニュース追加
- `news/index.html` の記事カード一覧に **新しい順** で追加
- `kintone/html/news/index.html` 側にも同じ更新が必要なら確認する
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

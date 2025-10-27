# freee-chat-mcp-server


freee会計APIをClaude Desktopで簡単に使えるMCPサーバーです。経費登録、取引管理、帳票確認などがClaude上で直接操作できます。

<img width="895" height="474" alt="スクリーンショット 2025-10-27 15 52 50" src="https://github.com/user-attachments/assets/73b873a1-641d-4826-a6b5-34a67923a455" />

## 主な機能

### スマート経費登録
- **create_smart_expense**: 経費の種類を指定するだけで、適切な勘定科目と税区分を自動選択
- 軽減税率（食品8%）と標準税率（10%）に自動対応
- **レシート画像アップロード対応**: レシート・領収書の画像をClaude Desktopにアップロードすると、画像の内容を読み取って自動で経費登録
- 画像から金額、店舗名、購入内容を自動抽出して経費データとして活用可能

### 会社管理
- **suggest_company**: 複数会社がある場合の自動選択・提案
- **list_companies**: アクセス可能な全事業所の一覧取得

### 経費管理
- **suggest_common_expenses**: よく使う経費科目の提案（交際費、旅費交通費、消耗品費など）
- **get_recent_deals**: 最近の取引一覧表示
- **delete_deal**: 間違って登録した取引の削除

### 取引・帳票
- **create_deal**: 取引（収入・支出）の作成
- **list_deals**: 取引一覧の取得（期間・種類での絞り込み可能）
- **list_account_items**: 勘定科目一覧
- **list_partners**: 取引先一覧
- **list_taxes**: 税区分一覧

## 必要なもの

- [Claude Desktop](https://claude.ai/download)
- freee会計のアカウント
- freeeのアクセストークン（[freee developers](https://developer.freee.co.jp/)で取得）
- Node.js 18以上

## インストール方法

### 1. リポジトリをクローン
```bash
git clone https://github.com/YOUR_USERNAME/freee-mcp-server.git
cd freee-mcp-server
```

### 2. 依存関係をインストール
```bash
npm install
```

### 3. ビルド
```bash
npm run build
```

### 4. freeeアクセストークンの取得
1. [freee developers](https://developer.freee.co.jp/)にアクセス
2. アプリケーションを作成
3. アクセストークンを取得

### 5. Claude Desktopの設定

Claude Desktopの設定ファイルを開きます：

**macOS:**
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

設定ファイルに以下を追加：

```json
{
  "mcpServers": {
    "freee": {
      "command": "node",
      "args": ["/path/to/freee-mcp-server/dist/index.js"],
      "env": {
        "FREEE_ACCESS_TOKEN": "your_freee_access_token_here"
      }
    }
  }
}
```

> **注意**: `/path/to/freee-mcp-server`は実際のプロジェクトのパスに置き換えてください。

### 6. Claude Desktopを再起動

設定を反映するためにClaude Desktopを再起動してください。

## 使用例

### レシート画像からの経費登録
```
1. Claude Desktopにレシート・領収書の画像をアップロード
2. 「この画像から経費登録して」と依頼
3. Claudeが画像を解析して金額、店舗名、内容を抽出
4. create_smart_expense で自動で適切な勘定科目・税区分を選択して登録
```

### スマート経費登録
```
食材の買い物を経費登録したい

create_smart_expense を使用:
- company_id: 12345
- amount: 1500
- description: "スーパーマーケット - 野菜、肉類"
- expense_type: "food"
- transaction_date: "2024-01-15"

→ 自動で「消耗品費」+ 軽減税率8%で登録
```

### 間違った登録の修正
```
1. get_recent_deals で最近の取引を確認
2. delete_deal で間違った取引を削除
3. 正しい内容で再登録
```

### 会社の自動選択
```
suggest_company を実行
→ 複数会社がある場合は選択肢を表示
→ 単一会社の場合は自動選択
```

## 設定オプション

### 環境変数
| 変数名 | 説明 | 必須 |
|--------|------|------|
| `FREEE_ACCESS_TOKEN` | freee APIアクセストークン | はい |

### 経費の種類 (expense_type)
| 種類 | 説明 | 自動選択される勘定科目 | 税区分 |
|------|------|-------------------|---------|
| `food` | 食品・飲食物 | 消耗品費 | 軽減税率8% |
| `office_supplies` | 事務用品 | 消耗品費・事務用品費 | 標準税率10% |
| `transportation` | 交通費 | 旅費交通費 | 標準税率10% |
| `utilities` | 光熱費 | 水道光熱費 | 標準税率10% |
| `rent` | 地代家賃 | 地代家賃 | 標準税率10% |
| `entertainment` | 接待・会議 | 交際費・会議費 | 標準税率10% |
| `other` | その他 | 雑費・消耗品費 | 標準税率10% |

## よくある質問（FAQ）

### Q1: 「MCP freee: Unexpected token」エラーが表示される
**A:** 古いバージョンのコードが原因です。以下を確認してください：
- 最新版をgit pullしてビルドし直す
- Claude Desktopを完全に再起動する
- 設定ファイルのパスが正しいか確認する

### Q2: 「401 Unauthorized」エラーが出る
**A:** アクセストークンの問題です：
- freee developersでトークンを再発行する
- Claude Desktopの設定ファイルでトークンを更新する
- トークンの権限（経費申請、取引管理）が有効か確認する

### Q3: 複数の会社があるがどれを選べばいい？
**A:** `suggest_company`を実行すると：
- 単一会社の場合は自動選択されます
- 複数会社の場合は選択肢が表示されます
- 普段使用している事業所のIDを控えておくと便利です

### Q4: 間違って経費を登録してしまった
**A:** 削除機能を使用してください：
1. `get_recent_deals`で最近の取引を確認
2. 削除したい取引のIDを確認
3. `delete_deal`で該当する取引を削除

### Q5: 軽減税率と標準税率が自動で判別されない
**A:** `expense_type`を正しく指定してください：
- 食品・飲食物 → `"food"` (軽減税率8%)
- その他の消耗品 → `"office_supplies"` (標準税率10%)
- 手動で勘定科目を指定したい場合は`create_deal`を使用

## トラブルシューティング

### Claude Desktopで認識されない場合
1. 設定ファイルのJSONが正しいか確認
2. ファイルパスが絶対パスになっているか確認
3. `npm run build`が正常に完了しているか確認
4. Claude Desktopを完全に再起動

### freee APIエラーの場合
1. アクセストークンの有効期限を確認
2. freee会計の契約プランで該当APIが利用可能か確認
3. 事業所の権限設定を確認

### パフォーマンスの問題
- 大量のデータを扱う場合は`limit`パラメータで件数を制限
- 期間を指定して検索範囲を絞り込む

## コントリビューション

バグ報告や機能要望は[Issues](https://github.com/YOUR_USERNAME/freee-mcp-server/issues)でお知らせください。

プルリクエストも歓迎します！

## ライセンス

MIT License

## 関連リンク

- [freee API仕様書](https://developer.freee.co.jp/docs)
- [Claude Desktop](https://claude.ai/download)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/introduction)

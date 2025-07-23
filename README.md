# 🧰 医療データツールボックス

新調剤システム標準IF（NSIPS）対応のデータバリデーター & 多機能データ変換ツール

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://your-username.github.io/nsips-validator/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 機能一覧

### 🔍 NSIPSバリデーター
- **NSIPS Ver.1.06.03準拠**: 新調剤システム標準IF共有仕様書対応
- **改行コード自動判別**: Windows(CRLF)、Unix(LF)、Mac(CR)、エスケープシーケンス対応
- **詳細検証**: レコードタイプ別の完全バリデーション
- **エラーレポート**: 行番号、項目名、エラー詳細を明確に表示

### 🎨 データフォーマッター
- **JSON整形**: 見やすいインデント付きフォーマット
- **CSV整形**: カンマ区切りデータの整理
- **JSON圧縮**: ファイルサイズ最適化

### 🔄 データ変換器
- **JSON ⇄ CSV**: 双方向変換対応
- **NSIPS → JSON**: NSIPSデータを構造化JSON形式に変換
- **バッチ処理**: 大量データの一括変換

### 📝 Markdownテーブル変換器
- **多形式対応**: CSV、TSV、JSON、HTML、Excel貼り付け
- **自動検出**: データ形式の自動判別
- **カスタマイズ**: 配置調整、特殊文字エスケープ
- **リアルタイム変換**: 入力と同時に結果表示

## 🎯 使用シーン

### 医療・薬局業界
- **NSIPS準拠性チェック**: 調剤システム間でのデータ交換前の検証
- **データ移行**: 異なるシステム間でのデータ形式変換
- **API開発**: 医療データのJSON/CSV変換
- **文書作成**: 薬品情報をMarkdownテーブルで文書化

### 一般的な用途
- **GitHub README**: プロジェクト情報の表形式表示
- **技術文書**: APIレスポンス例をMarkdownテーブル化
- **データ分析**: Excel→CSV→JSON変換
- **Webサイト**: HTMLテーブル→Markdown変換

## 📁 ファイル構成

```
nsips-validator/
├── index.html          # メインHTML
├── styles.css          # スタイルシート
├── script.js          # JavaScript機能
├── README.md          # このファイル
└── LICENSE            # MITライセンス
```

## 🛠 GitHub Pagesでの公開手順

### 1. リポジトリ作成
```bash
git init nsips-validator
cd nsips-validator
```

### 2. ファイル配置
- `index.html`, `styles.css`, `script.js`, `README.md` を配置

### 3. GitHubにプッシュ
```bash
git add .
git commit -m "Add NSIPS Medical Data Toolbox"
git remote add origin https://github.com/your-username/nsips-validator.git
git push -u origin main
```

### 4. GitHub Pages設定
1. リポジトリの **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main / (root)
4. **Save** をクリック

## 🎨 特徴

### ✨ モダンなUI/UX
- **ツールボックス風デザイン**: プロフェッショナルな外観
- **アニメーション効果**: ホバーエフェクト、スムーズな遷移
- **レスポンシブ対応**: モバイル・タブレット・デスクトップ最適化
- **ダークモード対応**: 目に優しい配色

### 🔒 セキュリティ・プライバシー
- **完全クライアントサイド**: データがサーバーに送信されない
- **匿名化サンプル**: 個人情報を含まないテストデータ
- **ローカル処理**: すべての変換処理がブラウザ内で完結

### ⚡ パフォーマンス
- **軽量設計**: 外部ライブラリ不要
- **高速処理**: 大量データの効率的な変換
- **メモリ最適化**: ブラウザリソースの効率的な使用

## 🔧 カスタマイズ

### CSS変数での色調整
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #38a169;
  --warning-color: #ed8936;
  --error-color: #e53e3e;
}
```

### 新機能追加例
```javascript
// 新しいタブ追加
function addNewTab(tabName, tabConfig) {
  // タブナビゲーション追加
  // タブコンテンツ追加
  // イベントリスナー設定
}
```

## 📈 今後の拡張予定

- [ ] **ドラッグ&ドロップ**: ファイルアップロード機能
- [ ] **バッチ処理**: 複数ファイル一括変換
- [ ] **履歴機能**: 変換履歴の保存・復元
- [ ] **プリセット**: よく使う設定の保存
- [ ] **API連携**: 外部サービスとの連携

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 🙏 謝辞

- **公益社団法人日本薬剤師会**: NSIPS仕様書の提供
- **医療情報システム開発協会**: 医療データ標準化への貢献
- **オープンソースコミュニティ**: 素晴らしいツールとライブラリ

---

**🩺 Developed for Healthcare Professionals**  
*Making medical data exchange easier and more reliable*
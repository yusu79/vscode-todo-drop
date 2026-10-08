# Changelog

[English](#changelog) | [日本語](#日本語)

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

Change types:

- Added: new features
- Changed: changes to existing functionality
- Deprecated: features scheduled for removal
- Removed: removed features
- Fixed: bug fixes
- Security: vulnerability-related changes

Version X.Y.Z:

- X, major version: incompatible changes to the public API
- Y, minor version: backward-compatible additions to functionality
- Z, patch version: backward-compatible bug fixes

---

## [1.0.0] - 2026-10-08

### Added

- An Explorer Todo Drop view that accepts `.md`, `.markdown`, and `.txt` checklists by drag and drop without a modifier key, or through file selection.
- Task checkboxes that update source documents while preserving unsaved edits, line endings, and VS Code Undo history; source changes refresh the view.
- Nested tasks based on source indentation. Completed tasks are hidden by default while unfinished children remain visible, without deleting source lines.
- Checkbox, strikethrough, and strikethrough with a local `YYYY-MM-DD` date as source completion styles.
- Gray plain-text labels for completed tasks when shown, with a customizable theme color.
- Multiple source files remembered per workspace, source-file opening, refresh, and removal from the view without deleting files.
- Bullet and numbered checklist parsing that excludes fenced code blocks, and stale-edit protection to avoid changing the wrong task.
- English and Japanese localization for settings, commands, hints, errors, and task accessibility labels, following the VS Code display language.

## 日本語

[English](#changelog) | [日本語](#日本語)

すべての重要な変更はこのファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づき、
バージョニングは [Semantic Versioning](https://semver.org/lang/ja/) を採用しています。

変更の種類

- Added         新機能
- Changed       既存機能の変更
- Deprecated    間もなく削除される機能
- Removed       今回で削除された機能
- Fixed         不具合修正
- Security      脆弱性に関する報告

バージョン X.Y.Z

- X メジャーバージョン      パブリックAPIに対して後方互換性を持たない変更
- Y マイナーバージョン      後方互換性を保ちつつ機能性をパブリックAPIに追加した場合
- Z パッチバージョン        後方互換性を保ったバグ修正を取り込んだ場合


---

## [1.0.0] - 2026-10-08

### 追加

- `.md`・`.markdown`・`.txt`のチェックリストを、修飾キーなしのドロップやファイル選択で追加できるExplorerのTodo Drop欄。
- 元ドキュメントを更新するToDoチェック欄。未保存の変更・改行コード・VS CodeのUndo履歴を維持し、元ファイルの編集を専用欄へ反映。
- 元ファイルのインデントに基づく階層表示。完了項目は既定で非表示にし、未完了の子と元ファイルの行を保持。
- 元ファイルへの完了形式として、チェックのみ・取り消し線・取り消し線とローカル日付`YYYY-MM-DD`。
- 完了項目を再表示する際の灰色のプレーンテキストラベルと、テーマ色のカスタマイズ。
- ワークスペースごとの複数ファイル登録の記憶、元ファイルを開く操作、再読み込み、ファイルを削除しない登録解除。
- フェンス付きコードブロックを除外する箇条書き・番号付きチェックリストの解析と、古い表示から別の項目を誤更新しない保護。
- VS Codeの表示言語に合わせた、設定・コマンド・案内・エラー・ToDoの読み上げラベルの英語・日本語対応。

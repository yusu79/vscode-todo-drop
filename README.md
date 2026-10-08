# Todo Drop

[English](#todo-drop) | [日本語](#日本語)

A VS Code extension that displays Markdown and text checklists in a dedicated **Todo Drop** view in Explorer. Checking a task updates its source document.

## Installation

This project is under development. Open the repository in VS Code, run `npm install` and `npm run compile`, then press F5 to launch the Extension Development Host. The current manifest requires VS Code 1.140.0 or newer.

## Example

Drop a `.md`, `.markdown`, or `.txt` file containing:

```markdown
- [ ] Write the proposal
- [ ] Review the changes
```

Check a task in Todo Drop to update its source:

```markdown
- [x] Write the proposal
- [ ] Review the changes
```

## Features

- Multiple source files, remembered per workspace.
- Check and uncheck tasks directly in Explorer.
- Three completion styles: checkbox, strikethrough, and strikethrough with a local date.
- Nested tasks follow the source indentation. Completed tasks are hidden by default without deleting source lines.
- Completed task labels are gray for every source completion style.
- Updates from source-document edits; stale clicks are rejected to avoid modifying the wrong line.

## Usage

1. Open **Todo Drop** in Explorer.
2. Drop files from VS Code Explorer directly onto the **Todo Drop** list, including existing file or task rows and empty space. No modifier key is needed. You can also use the **+** button, the `Todo Drop: ファイルを追加` command, or the Explorer context menu.
3. Check or uncheck a task using the checkbox to its left.
4. Save the source document to persist the change to disk. Edits use VS Code's Undo history; Todo Drop does not automatically save.
5. Click the file name to open the source. Click the **×** beside the file name to remove it from the view without deleting the file.

Checking changes only the selected task, leaving unfinished children visible even when their parent is hidden. To show completed tasks in gray without strikethrough, disable `todoDrop.hideCompleted` or edit the source to uncheck them.

## Explanation

Supported task markers include `- [ ]`, `* [ ]`, `+ [ ]`, `1. [ ]`, and `1) [ ]`, including nested tasks. Completed markers `[x]` and `[X]` are recognized. Fenced code blocks are excluded. Ordinary bullet lists are left as-is. Task labels are displayed as plain text.

The date format is `YYYY-MM-DD`, using the extension host's local date. Unchecking removes whole-task strikethrough and an optional trailing date in the generated format. Original indentation, spacing, and line endings are preserved. Unavailable files are shown with an error and can be removed or refreshed.

The list uses VS Code's native TreeView and drag-and-drop API. Completion animations are currently unavailable. If a source does not expose a usable file URI, choose the original file with **ファイルを追加**.

Completed labels use VS Code's file decoration colors (`explorer.decorations.colors`). Their gray color follows the theme and can be customized with `todoDrop.completedForeground` in `workbench.colorCustomizations`. Source file names and incomplete tasks keep their usual color.


### Development checks

Tests run in an isolated Extension Development Host. Point `TODO_DROP_TEST_WORKSPACE` at a folder under your project-materials `test-workspace`:

```powershell
$env:TODO_DROP_TEST_WORKSPACE = 'C:\path\to\project-materials\test-workspace\todo-drop'
# Optional: use an existing compatible VS Code installation.
$env:TODO_DROP_VSCODE_PATH = 'C:\Program Files\Microsoft VS Code\Code.exe'
npm test
npm run lint
npm run package
```

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `todoDrop.completionStyle` | `checkbox` | `checkbox`: `- [x] todo`; `strikethrough`: `- [x] ~~todo~~`; `strikethroughDate`: `- [x] ~~todo~~ [YYYY-MM-DD]` |
| `todoDrop.hideCompleted` | `true` | Hide completed tasks in the view. |

## 日本語

[English](#todo-drop) | [日本語](#日本語)

Markdown・txtのチェックリストを、VS Codeのエクスプローラー内の専用欄 **Todo Drop** に表示する拡張機能です。専用欄でチェックすると、元のドキュメントにも反映します。

## インストール

現在は開発中です。リポジトリをVS Codeで開き、`npm install` と `npm run compile` を実行し、F5で拡張機能開発ホストを起動します。現在のマニフェストはVS Code 1.140.0以降を対象としています。

## 使用例

次の内容を持つ `.md`・`.markdown`・`.txt` ファイルをドロップします。

```markdown
- [ ] 提案書を書く
- [ ] 変更内容を確認する
```

専用欄でチェックすると、元ファイルは次のようになります。

```markdown
- [x] 提案書を書く
- [ ] 変更内容を確認する
```

## 機能

- 複数ファイルに対応し、登録内容をワークスペースごとに記憶します。
- エクスプローラー内でToDoをチェック・解除できます。
- 完了形式をチェックのみ・取り消し線付き・取り消し線＋日付から選べます。
- 元ファイルのインデントに沿ってToDoの階層を表示します。完了項目は既定で非表示になり、元ファイルの行は削除しません。
- 元ファイルの完了形式にかかわらず、完了したToDoの文字を灰色で表示します。
- 元ドキュメントの編集を反映し、古い表示に対するクリックによる誤更新を防ぎます。

## 使用方法

1. エクスプローラーの **Todo Drop** を開きます。
2. VS Codeのエクスプローラーから **Todo Drop** のリストへ直接ファイルをドロップします。ファイル行・ToDo行・空白部分でも受け取れます。Shiftなどの修飾キーは不要です。**+** ボタン、`Todo Drop: ファイルを追加` コマンド、エクスプローラーの右クリックメニューも使えます。
3. ToDoの左側にあるチェック欄でチェック・解除します。
4. ディスクへ保存するには元ドキュメントを保存します。変更はVS CodeのUndoに対応し、自動保存は行いません。
5. ファイル名をクリックすると元ファイルを開きます。ファイル名の横の **×** は専用欄の登録だけを解除し、ファイルは削除しません。

チェックは選択した項目だけに反映します。完了した親を隠しても、未完了の子は表示を残します。完了項目を打ち消し線なしの灰色で再表示するには、`todoDrop.hideCompleted` を無効にするか、元ファイルを編集してチェックを解除してください。

## 解説

`- [ ]`・`* [ ]`・`+ [ ]`・`1. [ ]`・`1) [ ]` の形式と、入れ子のToDoに対応します。完了は `[x]`・`[X]` として認識します。フェンス付きコードブロック内は除外し、通常の箇条書きは変換しません。専用欄のラベルはプレーンテキストで表示します。

日付は拡張ホストのローカル日付を使い、`YYYY-MM-DD` で記録します。チェック解除時は、生成形式に一致する項目全体の取り消し線と末尾の日付を取り除きます。インデント・空白・改行コードは維持します。読み込めないファイルはエラーを表示し、再読み込みや登録解除ができます。

リストはVS Code標準のTreeViewとドロップAPIを使います。完了アニメーションは現在利用できません。ドロップ元からファイルのURIが渡らない場合は **ファイルを追加** から元ファイルを選択してください。

完了項目の灰色表示はVS Codeのファイル装飾色（`explorer.decorations.colors`）を使います。テーマに応じた灰色で表示し、`workbench.colorCustomizations` の `todoDrop.completedForeground` で色を変更できます。元ファイルの名前や未完了項目は通常の文字色で表示します。


### 開発時の検証

テストは隔離した拡張機能開発ホストで実行します。`TODO_DROP_TEST_WORKSPACE` にプロジェクト資料の `test-workspace` 内のフォルダを指定します。

```powershell
$env:TODO_DROP_TEST_WORKSPACE = 'C:\path\to\project-materials\test-workspace\todo-drop'
# 任意: 対応する既存のVS Codeを使う場合に指定します。
$env:TODO_DROP_VSCODE_PATH = 'C:\Program Files\Microsoft VS Code\Code.exe'
npm test
npm run lint
npm run package
```

## 設定オプション

| 設定 | 既定値 | 内容 |
| --- | --- | --- |
| `todoDrop.completionStyle` | `checkbox` | `checkbox`: `- [x] todo`、`strikethrough`: `- [x] ~~todo~~`、`strikethroughDate`: `- [x] ~~todo~~ [YYYY-MM-DD]` |
| `todoDrop.hideCompleted` | `true` | 専用欄の完了項目を非表示にします。 |

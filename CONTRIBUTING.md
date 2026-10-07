# Contributing

[English](#contributing) | [日本語](#日本語)

Thank you for contributing to this project.

This document explains the basic development rules and procedures.

## Development Environment

After cloning the repository, install the dependencies.

```sh
npm install
```

Check the `scripts` section of `package.json` for available development commands.

Before running tests or lint checks, confirm which scripts are actually defined.

## Branches

This section describes the branches used in this project and how to work with them.

### Branch Naming

| Branch | Purpose | Base | Merge Target |
| --- | --- | --- | --- |
| `main` | Stable code ready for release | - | - |
| `develop` | Integrates development for the next release | `main` (initial creation) | - |
| `feature-*` | New features and individual changes | `develop` | `develop` |
| `release-*` | Release preparation | `develop` | `main` |
| `hotfix-*` | Urgent fixes for the released version | `main` | `main` |

If the project adopts a different branching workflow, update this table and the descriptions below.

### `main`

Maintains stable code ready for release.

Do not perform regular development directly on `main`.

Changes are normally accepted from `release-*` or `hotfix-*`.

### `develop`

Integrates development work for the next release.

For regular features and changes, create a `feature-*` branch from `develop`.

### `feature-*`

Used for new features and individual changes.

As a rule, each branch should contain changes for a single purpose.

Examples:

```text
feature-example
feature-new-option
```

Merge into `develop` when development is complete.

### `release-*`

Used to prepare the next release.

As a rule, do not add new features. Focus on release preparation such as:

* Testing before release
* Bug fixes
* Version updates
* Updating `CHANGELOG.md`
* Reviewing documentation
* Checking the contents of the npm package

Examples:

```text
release-1.0.0
release-1.1.0
```

When preparation is complete, merge `release-*` into `main` to finalize the version to be published, and add a version tag to the release commit on `main`.

After merging into `main` and adding the tag, delete the `release-*` branch that is no longer needed.

After publication, carry the release finalized on `main` forward into development. If `develop` has not advanced since the `release-*` branch was created, fast-forward `develop` to `main` so both branches point to the same release commit.

```sh
git switch develop
git merge --ff-only main
```

If changes for the next version have been added to `develop` since `release-*` was created, merge `main` into `develop`. Do not reverse the merge direction: merging `develop` into `main` would include changes for the next version in the released version.

### `hotfix-*`

Used for urgent fixes to the currently released version.

Create the branch from `main` and make only the changes needed to address the issue.

Examples:

```text
hotfix-example
hotfix-1.0.1
```

When the fix is complete, merge `hotfix-*` into `main`, add a version tag to the fix commit on `main`, and release it.

After merging into `main` and adding the tag, delete the `hotfix-*` branch that is no longer needed.

After release, if `develop` has not advanced from the commit on which the hotfix was based, fast-forward `develop` to `main` so both branches point to the same fix commit.

```sh
git switch develop
git merge --ff-only main
```

If `develop` contains changes for the next version, merge `main` into `develop` to carry the fix forward. Do not merge `develop` into `main`, as this would include changes for the next version in the released version.

## Implementation

Before implementing a change, review the relevant code, existing specifications, and tests to understand its impact.

Follow these guidelines:

* Follow the existing project structure
* Follow the existing coding style
* Place implementation code under `src/` as a rule
* Limit changes to what is needed to achieve the goal
* Do not modify unrelated files or code
* Do not add dependencies unless necessary
* Consider compatibility with existing public APIs and behavior

When making a decision about something not explicitly specified, check consistency with existing specifications and code.

Before implementation, clarify the approach for decisions that affect user-visible behavior, public APIs, or compatibility.

For minor internal implementation decisions, follow the existing code and design approach.

## Tests

Place test code under `test/` as a rule.

For new features or specification changes, add or update tests as needed to verify the behavior.

For bug fixes, add a test that reproduces the issue whenever possible, so a recurrence can be detected.

Do not change correct expectations or conditions in existing tests merely to make them pass.

Check the `scripts` section of `package.json` for the test command.

A typical command is:

```sh
npm test
```

Confirm that all tests pass.

## Lint

After implementation, check and run the lint script defined in `package.json`.

A typical command is:

```sh
npm run lint
```

Confirm that the changes do not introduce lint errors.

## Commits

Review the changes before committing.

```sh
git status
git diff
```

Check for unintended changes, and do not combine unrelated changes in one commit.

### Commit Messages

If the project has a `.gitmessage` file, follow its format and rules.

Commit messages must accurately describe the actual changes.

If `.gitmessage` is the authoritative rule, do not duplicate its format in this document.

## Pull Requests

As a rule, create each pull request for a single purpose.

Include the following as needed:

* What changed
* Why it changed
* Implementation details and significant design decisions
* Tests run
* Effects on existing features and compatibility
* Related issues

Keep unrelated changes out of the pull request to make it easier to review.

## Documentation

When changing user-visible behavior, public APIs, configuration, or usage, update related documentation as needed.

Examples:

* `README.md`
* API documentation
* Usage examples
* `CHANGELOG.md`

Ensure that the code and documentation agree.

## Dependencies

Add a dependency only when there is a clear need, such as when existing functionality or standard APIs cannot meet the requirement.

When adding or updating dependencies, check the following as needed:

* Why the dependency is needed
* Maintenance status
* License
* Security concerns
* Package size
* Effects on the existing environment

## Versions

Follow the project release workflow when deciding when to update version numbers.

With Git Flow, make version updates for regular releases on `release-*` and for urgent fixes on `hotfix-*`.

Do not make release-related version updates during regular feature development.

## Publishing

For projects that publish packages, check tests, lint, and package contents before publishing.

For npm packages, typical commands are:

```sh
npm test
npm run lint
npm pack --dry-run
```

Review the output of `npm pack --dry-run` and confirm that the npm package contains no unintended files.

Run `npm publish` according to the release procedure defined for the project.


---

# 日本語

[English](#contributing) | [日本語](#日本語)

このプロジェクトへのコントリビューションありがとうございます。

このドキュメントでは、開発時の基本的なルールと手順を説明します。

## 開発環境

リポジトリを取得したあと、依存パッケージをインストールします。

```sh
npm install
```

利用可能な開発用コマンドは `package.json` の `scripts` を確認してください。

テストやLintなどを実行するときも、実際に定義されているスクリプトを確認してから実行してください。

## ブランチ

このプロジェクトで使用するブランチと運用方法を記載します。

### ブランチの命名規則

| ブランチ名       | 役割               | 派生元           | マージ先              |
| ----------- | ---------------- | ------------- | ----------------- |
| `main`      | 公開可能な安定版         | -             | -                 |
| `develop`   | 次回リリース向けの開発内容を統合 | `main`（初回作成時） | -                 |
| `feature-*` | 新機能や個別の変更        | `develop`     | `develop`         |
| `release-*` | リリース準備           | `develop`     | `main`            |
| `hotfix-*`  | 公開中バージョンの緊急修正    | `main`        | `main`            |

プロジェクトで異なるブランチ運用を採用する場合は、この表と以下の説明を変更してください。

### `main`

公開可能な安定したコードを管理します。

通常の開発作業は `main` 上で直接行いません。

通常は `release-*` または `hotfix-*` から変更を受け入れます。

### `develop`

次回リリースに向けた開発内容を統合します。

通常の機能追加や変更では、`develop` から `feature-*` を作成します。

### `feature-*`

新機能や個別の変更に使用します。

原則として1つのブランチでは1つの目的に関する変更を行います。

例：

```text
feature-example
feature-new-option
```

開発完了後は `develop` にマージします。

### `release-*`

次回リリースの準備に使用します。

原則として新機能は追加せず、以下のようなリリース準備を行います。

* リリース前テスト
* バグ修正
* バージョン番号の更新
* `CHANGELOG.md` の更新
* ドキュメントの確認
* npmパッケージに含まれる内容の確認

例：

```text
release-1.0.0
release-1.1.0
```

リリース準備が完了したら、`release-*` を `main` にマージして公開するバージョンを確定し、`main` のリリースコミットへバージョンタグを付けます。

`main` へのマージとタグ付けが完了したら、不要になった `release-*` ブランチを削除します。

公開後は、`main` に確定したリリース内容を今後の開発へ引き継ぎます。`release-*` の作成後に `develop` が進んでいない場合は、`develop` を `main` へfast-forwardし、両ブランチが同じリリースコミットを指す状態に揃えます。

```sh
git switch develop
git merge --ff-only main
```

`release-*` の作成後に次期バージョン向けの変更が `develop` へ追加されている場合は、`main` を `develop` にマージします。`develop` を `main` へマージすると次期バージョン向けの変更が公開版へ混入するため、マージの向きを逆にしません。

### `hotfix-*`

現在公開されているバージョンの緊急修正に使用します。

`main` から作成し、対象となる問題に必要な変更だけを行います。

例：

```text
hotfix-example
hotfix-1.0.1
```

修正が完了したら `hotfix-*` を `main` にマージし、`main` の修正版コミットへバージョンタグを付けてリリースします。

`main` へのマージとタグ付けが完了したら、不要になった `hotfix-*` ブランチを削除します。

リリース後、`develop` がhotfixの派生元から進んでいない場合は、`develop` を `main` へfast-forwardし、両ブランチが同じ修正版コミットを指す状態に揃えます。

```sh
git switch develop
git merge --ff-only main
```

`develop` に次期バージョン向けの変更がある場合は、`main` を `develop` にマージし、修正を今後の開発へ反映します。この場合は、次期バージョン向けの変更が公開版へ混入しないように `develop` を `main` へマージしません。

## 実装

実装前に関連するコード、既存仕様、テストを確認し、変更による影響範囲を把握してください。

実装時は以下の方針に従います。

* 既存のプロジェクト構成に従う
* 既存のコーディングスタイルに従う
* 実装コードは原則として `src/` 以下に配置する
* 目的を達成するために必要な範囲だけ変更する
* 関係のないファイルやコードを変更しない
* 必要がない限り新しい依存パッケージを追加しない
* 既存の公開APIや動作との互換性を考慮する

仕様として明示されていない事項について判断が必要な場合は、既存仕様や既存コードとの整合性を確認してください。

ユーザーから見た動作、公開API、互換性などへ影響する判断については、実装前に方針を明確にしてください。

内部実装上の軽微な判断については、既存コードと既存の設計方針に従います。

## テスト

テストコードは原則として `test/` 以下に配置します。

機能追加や仕様変更では、その動作を確認できるテストを必要に応じて追加または更新してください。

バグ修正では、可能な限り問題を再現するテストを追加し、同じ問題が再発した場合に検出できるようにしてください。

テストを通すことだけを目的として、正しい既存テストの期待値や条件を変更しないでください。

実行するテストコマンドは `package.json` の `scripts` を確認してください。

一般的には次のようなコマンドを使用します。

```sh
npm test
```

すべてのテストが成功することを確認してください。

## Lint

実装後は、`package.json` に定義されているLintスクリプトを確認して実行してください。

一般的には次のようなコマンドを使用します。

```sh
npm run lint
```

変更によって発生したLintエラーがないことを確認してください。

## コミット

コミット前に変更差分を確認してください。

```sh
git status
git diff
```

意図しない変更が含まれていないことを確認し、複数の無関係な変更を1つのコミットにまとめないでください。

### コミットメッセージ

プロジェクトに `.gitmessage` がある場合は、その形式とルールに従ってください。

コミットメッセージは、実際の変更内容を正確に反映したものにしてください。

`.gitmessage` が正式なルールとして存在する場合は、同じ形式をこのドキュメントへ重複して定義しません。

## Pull Request

Pull Requestは原則として1つの目的に対して作成してください。

必要に応じて以下を記載します。

* 何を変更したか
* なぜ変更したか
* 実装方法や重要な設計判断
* 実行したテスト
* 既存機能や互換性への影響
* 関連するIssue

レビューしやすいよう、目的と関係のない変更を含めないでください。

## ドキュメント

ユーザーから見た動作、公開API、設定方法、使用方法などを変更した場合は、必要に応じて関連ドキュメントも更新してください。

例：

* `README.md`
* APIドキュメント
* 使用例
* `CHANGELOG.md`

コードとドキュメントの内容が一致していることを確認してください。

## 依存パッケージ

新しい依存パッケージは、既存機能や標準APIでは対応できないなど、必要性が明確な場合にだけ追加してください。

依存パッケージを追加または更新する場合は、必要に応じて以下を確認してください。

* 追加する必要性
* メンテナンス状況
* ライセンス
* セキュリティ上の問題
* パッケージサイズ
* 既存環境への影響

## バージョン

バージョン番号をどのタイミングで変更するかは、プロジェクトのリリース運用に従います。

Git Flowを採用する場合、通常のリリースに伴うバージョン変更は `release-*` で行い、緊急修正では `hotfix-*` で行います。

通常の機能開発中に、リリースを目的としたバージョン番号の変更は行いません。

## 公開

パッケージを公開するプロジェクトでは、公開前にテスト、Lint、公開内容を確認してください。

npmパッケージの場合は、一般的に以下を実行します。

```sh
npm test
npm run lint
npm pack --dry-run
```

`npm pack --dry-run` の結果を確認し、意図しないファイルがnpmパッケージへ含まれていないことを確認してください。

`npm publish` は、プロジェクトで定められたリリース手順に従って実行してください。

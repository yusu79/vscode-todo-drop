import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';
import { TodoViewProvider } from '../src/todoView';

suite('Localization', () => {
	suiteSetup(async () => {
		const expected = process.env.TODO_DROP_TEST_LOCALE ?? 'en';
		const nls = JSON.parse(process.env.VSCODE_NLS_CONFIG ?? '{}');
		assert.equal(vscode.env.language, expected,
			`Test display language differs: locale=${nls.userLocale}, resolved=${nls.resolvedLanguage}. Install the requested language pack in the isolated test environment.`);
		const extension = vscode.extensions.getExtension('yusu79.vscode-todo-drop');
		assert.ok(extension);
		// Runtime translation bundles are loaded when the extension is activated.
		await extension.activate();
	});

	test('loads the selected language for the drop hint and task status', () => {
		const japanese = process.env.TODO_DROP_TEST_LOCALE === 'ja';
		const provider = new TodoViewProvider({ workspaceState: {
			keys: () => [],
			get: <T>(_key: string, fallback?: T) => fallback!,
			update: async () => { /* No stored files. */ }
		} });
		try {
			assert.equal(provider.getChildren()[0].label, japanese ? 'ここにMarkdown・txtファイルをドロップ' : 'Drop Markdown or txt files here');
			assert.equal(provider.getChildren()[0].command?.title, japanese ? 'ファイルを追加' : 'Add Files');
			assert.equal(vscode.l10n.t('{0} (completed)', 'my task'), japanese ? 'my task (完了)' : 'my task (completed)');
			assert.equal(vscode.l10n.t('{0} (incomplete)', 'my task'), japanese ? 'my task (未完了)' : 'my task (incomplete)');
		} finally { provider.dispose(); }
	});

	test('localizes commands and configuration contributions', () => {
		const japanese = process.env.TODO_DROP_TEST_LOCALE === 'ja';
		const extension = vscode.extensions.getExtension('yusu79.vscode-todo-drop');
		assert.ok(extension);
		const contributions = extension.packageJSON.contributes;
		assert.deepEqual(contributions.commands[0].title, japanese
			? { value: 'Todo Drop: ファイルを追加', original: 'Todo Drop: Add Files' }
			: 'Todo Drop: Add Files');
		assert.equal(contributions.configuration.properties['todoDrop.completionStyle'].description,
			japanese ? '元ファイルに反映する完了形式。' : 'Completion format applied to source files.');
		assert.equal(contributions.configuration.properties['todoDrop.completionStyle'].enumDescriptions[0],
			japanese ? 'チェックのみ: - [x] todo' : 'Checkbox only: - [x] todo');
		assert.equal(contributions.configuration.properties['todoDrop.hideCompleted'].description,
			japanese ? '完了した項目を専用欄から非表示にします。' : 'Hide completed tasks from the Todo Drop view.');
	});
});

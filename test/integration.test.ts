import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';
import { TodoItem, TodoViewProvider } from '../src/todoView';

suite('Todo source integration', () => {
	let provider: TodoViewProvider;
	let uri: vscode.Uri;
	const file = () => provider.getChildren()[0];
	const tasks = () => provider.getChildren(file()).filter(item => item.kind === 'task');
	let storage: Map<string, unknown>;
	const contents = '- [ ] first\r\n- [ ] second\r\n';

	setup(async () => {
		const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
		assert.ok(folder, 'Set TODO_DROP_TEST_WORKSPACE to an isolated test-workspace folder.');
		uri = vscode.Uri.joinPath(folder, 'todo-' + Date.now() + '.md');
		await vscode.workspace.fs.writeFile(uri, Buffer.from(contents));
		storage = new Map();
		const workspaceState: vscode.Memento = {
			keys: () => [...storage.keys()],
			get: <T>(key: string, fallback?: T) => (storage.get(key) as T | undefined) ?? fallback!,
			update: async (key: string, value: unknown) => { storage.set(key, value); }
		};
		provider = new TodoViewProvider({ workspaceState });
		await provider.addFiles([uri]);
	});

	teardown(async () => {
		provider.dispose();
		for (const key of ['completionStyle', 'hideCompleted']) {
			await vscode.workspace.getConfiguration('todoDrop').update(key, undefined, vscode.ConfigurationTarget.Workspace);
		}
		const document = await vscode.workspace.openTextDocument(uri);
		if (document.isDirty) { await document.save(); }
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
		await vscode.workspace.fs.delete(uri);
	});

	test('loads and persists source files without duplicate tasks', async () => {
		assert.equal(provider.getChildren().filter(item => item.kind === 'file').length, 1);
		assert.deepEqual(tasks().map(task => task.label), ['first', 'second']);
		await provider.addFiles([uri]);
		assert.equal(provider.getChildren().filter(item => item.kind === 'file').length, 1);
		assert.deepEqual(storage.get('todoDrop.files'), [uri.toString()]);
	});

	test('updates current text, retains CRLF, and supports editor Undo', async () => {
		const document = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(document);
		await provider.toggleTask(tasks()[0].taskId!, true);
		assert.equal(document.getText(), '- [x] first\r\n- [ ] second\r\n');
		assert.equal(document.isDirty, true);
		assert.equal(Buffer.from(await vscode.workspace.fs.readFile(uri)).toString(), contents);
		await vscode.commands.executeCommand('undo');
		assert.equal(document.getText(), contents);
		await provider.refresh();
		assert.equal(tasks()[0].checkboxState, vscode.TreeItemCheckboxState.Unchecked);
	});

	test('rejects stale tasks after an external document edit', async () => {
		const oldId = tasks()[0].taskId!;
		const document = await vscode.workspace.openTextDocument(uri);
		const edit = new vscode.WorkspaceEdit();
		edit.insert(uri, new vscode.Position(0, 0), 'heading\r\n');
		assert.equal(await vscode.workspace.applyEdit(edit), true);
		await assert.rejects(provider.toggleTask(oldId, true));
		assert.equal(document.getText(), 'heading\r\n' + contents);
		await provider.refresh();
		await provider.toggleTask(tasks()[0].taskId!, true);
		assert.equal(document.getText(), 'heading\r\n- [x] first\r\n- [ ] second\r\n');
	});

	test('applies completion settings and reverses generated decoration', async () => {
		const config = vscode.workspace.getConfiguration('todoDrop');
		await config.update('completionStyle', 'strikethroughDate', vscode.ConfigurationTarget.Workspace);
		await config.update('hideCompleted', true, vscode.ConfigurationTarget.Workspace);
		await provider.refresh();
		await provider.toggleTask(tasks()[0].taskId!, true);
		const document = await vscode.workspace.openTextDocument(uri);
		assert.match(document.lineAt(0).text, /^- \[x\] ~~first~~ \[\d{4}-\d{2}-\d{2}\]$/);
		assert.equal(tasks().length, 1);
		assert.equal(tasks()[0].label, 'second');
		await config.update('hideCompleted', false, vscode.ConfigurationTarget.Workspace);
		await provider.refresh();
		await provider.toggleTask(tasks()[0].taskId!, false);
		assert.equal(document.getText(), contents);
	});

	test('shows missing sources and rejects unsupported file types', async () => {
		await vscode.workspace.fs.delete(uri);
		await provider.refresh();
		assert.equal(provider.getChildren(file())[0].label, vscode.l10n.t('Unable to read the file. Refresh or remove it from the list.'));
		await vscode.workspace.fs.writeFile(uri, Buffer.from(contents));
		await assert.rejects(provider.addFiles([uri.with({ path: uri.path + '.json' })]));
	});
	test('drops onto the list, a task row, and empty space using the same native controller', async () => {
		const task = tasks()[0];
		await provider.removeFile(file());
		assert.equal(provider.getChildren()[0].kind, 'hint');
		assert.equal(provider.getChildren()[0].label, vscode.l10n.t('Drop Markdown or txt files here'));
		const data = new vscode.DataTransfer();
		data.set('text/uri-list', new vscode.DataTransferItem(uri.toString()));
		const cancel = new vscode.CancellationTokenSource();
		try {
			await provider.handleDrop(provider.getChildren()[0], data, cancel.token);
			assert.deepEqual(tasks().map(item => item.label), ['first', 'second']);
			await provider.handleDrop(task, data, cancel.token);
			await provider.handleDrop(undefined, data, cancel.token);
			assert.equal(provider.getChildren().length, 1);
			assert.deepEqual(storage.get('todoDrop.files'), [uri.toString()]);
			await provider.removeFile(file());
			cancel.cancel();
			await provider.handleDrop(undefined, data, cancel.token);
			assert.equal(provider.getChildren()[0].kind, 'hint');
			assert.equal(provider.getChildren()[0].label, vscode.l10n.t('Drop Markdown or txt files here'));
			assert.deepEqual(storage.get('todoDrop.files'), []);
		} finally { cancel.dispose(); }
	});

	test('native checkbox events update multiple tasks together and can uncheck them', async () => {
		await vscode.workspace.getConfiguration('todoDrop').update('hideCompleted', false, vscode.ConfigurationTarget.Workspace);
		await provider.refresh();
		const changes = tasks().map(item => [item, vscode.TreeItemCheckboxState.Checked] as [TodoItem, vscode.TreeItemCheckboxState]);
		await provider.handleCheckboxChange({ items: changes });
		const document = await vscode.workspace.openTextDocument(uri);
		assert.equal(document.getText(), '- [x] first\r\n- [x] second\r\n');
		assert.ok(tasks().every(item => item.checkboxState === vscode.TreeItemCheckboxState.Checked));
		await provider.handleCheckboxChange({ items: [[tasks()[0], vscode.TreeItemCheckboxState.Unchecked]] });
		assert.equal(document.getText(), '- [ ] first\r\n- [x] second\r\n');
	});

	test('restores registered sources after recreating the provider', async () => {
		provider.dispose();
		provider = new TodoViewProvider({ workspaceState: {
			keys: () => [...storage.keys()],
			get: <T>(key: string, fallback?: T) => (storage.get(key) as T | undefined) ?? fallback!,
			update: async (key: string, value: unknown) => { storage.set(key, value); }
		} });
		await provider.refresh();
		assert.equal(file().uri?.toString(), uri.toString());
		assert.deepEqual(tasks().map(item => item.label), ['first', 'second']);
	});

	test('grays completed rows for every source completion style and clears color when unchecked or removed', async () => {
		await vscode.workspace.getConfiguration('todoDrop').update('hideCompleted', false, vscode.ConfigurationTarget.Workspace);
		await provider.refresh();
		const decorationUpdates: vscode.Uri[] = [];
		const listener = provider.onDidChangeFileDecorations(uris => decorationUpdates.push(...uris));
		try {
			for (const style of ['checkbox', 'strikethrough', 'strikethroughDate']) {
				await vscode.workspace.getConfiguration('todoDrop').update('completionStyle', style, vscode.ConfigurationTarget.Workspace);
				await provider.refresh();
				assert.equal(tasks()[0].resourceUri, undefined);
				assert.equal(tasks()[0].iconPath, undefined);
				await provider.handleCheckboxChange({ items: [[tasks()[0], vscode.TreeItemCheckboxState.Checked]] });
				const completed = tasks()[0];
				assert.equal(completed.label, 'first');
				assert.equal(completed.accessibilityInformation?.label, vscode.l10n.t('{0} (completed)', 'first'));
				assert.equal(provider.provideFileDecoration(completed.resourceUri!)?.color?.id, 'todoDrop.completedForeground');
				assert.equal(tasks()[1].resourceUri, undefined);
				assert.equal(provider.provideFileDecoration(uri), undefined);
				assert.ok(decorationUpdates.some(value => value.toString() === completed.resourceUri!.toString()));
				await provider.handleCheckboxChange({ items: [[completed, vscode.TreeItemCheckboxState.Unchecked]] });
				assert.equal(provider.provideFileDecoration(completed.resourceUri!), undefined);
			}
			await provider.toggleTask(tasks()[0].taskId!, true);
			const resource = tasks()[0].resourceUri!;
			await provider.removeFile(file());
			assert.equal(provider.provideFileDecoration(resource), undefined);
		} finally { listener.dispose(); }
	});
	test('hides checked tasks by default without deleting Markdown and leaves unfinished children visible', async () => {
		const document = await vscode.workspace.openTextDocument(uri);
		const edit = new vscode.WorkspaceEdit();
		edit.replace(uri, new vscode.Range(0, 0, document.lineCount, 0), '- [ ] parent\r\n  - [ ] child\r\n    - [ ] grandchild\r\n  - [ ] sibling\r\n- [ ] next\r\n');
		assert.equal(await vscode.workspace.applyEdit(edit), true);
		await provider.refresh();
		assert.deepEqual(tasks().map(item => item.label), ['parent', 'next']);
		const parent = tasks()[0];
		assert.equal(parent.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
		assert.deepEqual(provider.getChildren(parent).map(item => item.label), ['child', 'sibling']);
		assert.deepEqual(provider.getChildren(provider.getChildren(parent)[0]).map(item => item.label), ['grandchild']);
		await provider.handleCheckboxChange({ items: [[parent, vscode.TreeItemCheckboxState.Checked]] });
		assert.equal(document.lineAt(0).text, '- [x] parent');
		assert.equal(document.lineAt(1).text, '  - [ ] child');
		assert.equal(document.lineCount, 6);
		assert.deepEqual(tasks().map(item => item.label), ['child', 'sibling', 'next']);
		assert.deepEqual(provider.getChildren(tasks()[0]).map(item => item.label), ['grandchild']);
		assert.deepEqual(provider.getChildren(parent), []);
	});

	test('shows an empty-list hint when all tasks are completed and restores gray plain labels on request', async () => {
		await provider.handleCheckboxChange({ items: tasks().map(item => [item, vscode.TreeItemCheckboxState.Checked]) });
		assert.equal(tasks().length, 0);
		assert.equal(provider.getChildren(file())[0].label, vscode.l10n.t('No incomplete tasks.'));
		const document = await vscode.workspace.openTextDocument(uri);
		assert.equal(document.getText(), '- [x] first\r\n- [x] second\r\n');
		await vscode.workspace.getConfiguration('todoDrop').update('hideCompleted', false, vscode.ConfigurationTarget.Workspace);
		await provider.refresh();
		assert.deepEqual(tasks().map(item => item.label), ['first', 'second']);
		assert.ok(tasks().every(item => provider.provideFileDecoration(item.resourceUri!)?.color?.id === 'todoDrop.completedForeground'));
	});
});

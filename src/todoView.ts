import * as vscode from 'vscode';
import { randomUUID } from 'node:crypto';
import { CompletionStyle, formatTask, parseTasks, Task } from './tasks';
import { readDroppedFiles } from './fileDrop';

interface Snapshot {
	uri: vscode.Uri;
	task: Task;
	version: number;
}

export class TodoItem extends vscode.TreeItem {
	constructor(label: string, readonly kind: 'file' | 'task' | 'hint', readonly uri?: vscode.Uri,
		readonly taskId?: string, readonly children: TodoItem[] = []) {
		super(label, kind === 'file' ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
	}
}

export class TodoViewProvider implements vscode.TreeDataProvider<TodoItem>, vscode.TreeDragAndDropController<TodoItem>, vscode.FileDecorationProvider, vscode.Disposable {
	static readonly viewId = 'vscode-todo-drop.todos';
	readonly dropMimeTypes = ['text/uri-list', 'files'];
	readonly dragMimeTypes: string[] = [];
	private readonly changed = new vscode.EventEmitter<TodoItem | undefined>();
	readonly onDidChangeTreeData = this.changed.event;
	private readonly decorationsChanged = new vscode.EventEmitter<vscode.Uri[]>();
	readonly onDidChangeFileDecorations = this.decorationsChanged.event;
	private completedResources = new Set<string>();
	private roots: TodoItem[] = [];
	private items = new Map<string, TodoItem>();
	private readonly files = new Map<string, vscode.Uri>();
	private readonly snapshots = new Map<string, Snapshot>();
	private readonly disposables: vscode.Disposable[] = [];
	private generation = 0;
	private pendingRefresh: Promise<void> = Promise.resolve();
	private queue: Promise<void> = Promise.resolve();
	private disposed = false;

	constructor(private readonly context: Pick<vscode.ExtensionContext, 'workspaceState'>) {
		for (const value of context.workspaceState.get<string[]>('todoDrop.files', [])) {
			try {
				const uri = vscode.Uri.parse(value, true);
				if (this.supported(uri)) { this.files.set(uri.toString(), uri); }
			} catch { /* Ignore invalid saved URIs. */ }
		}
		this.disposables.push(
			vscode.workspace.onDidChangeTextDocument(e => {
				if (this.files.has(e.document.uri.toString())) { void this.refresh(); }
			}),
			vscode.workspace.onDidChangeConfiguration(e => {
				if (e.affectsConfiguration('todoDrop')) { void this.refresh(); }
			})
		);
		const watcher = vscode.workspace.createFileSystemWatcher('**/*');
		const changed = (uri: vscode.Uri) => {
			if (this.files.has(uri.toString())) { void this.refresh(); }
		};
		this.disposables.push(watcher, watcher.onDidChange(changed), watcher.onDidCreate(changed), watcher.onDidDelete(changed));
		this.disposables.push(vscode.workspace.onDidRenameFiles(async e => {
			let changed = false;
			for (const file of e.files) {
				if (this.files.delete(file.oldUri.toString())) {
					if (this.supported(file.newUri)) { this.files.set(file.newUri.toString(), file.newUri); }
					changed = true;
				}
			}
			if (changed) { await this.persist(); await this.refresh(); }
		}));
	}

	getTreeItem(element: TodoItem): TodoItem { return element; }

	provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
		if (!this.completedResources.has(uri.toString())) { return undefined; }
		return new vscode.FileDecoration(undefined, undefined, new vscode.ThemeColor('todoDrop.completedForeground'));
	}

	getChildren(element?: TodoItem): TodoItem[] {
		if (element) { return this.items.get(element.id ?? '')?.children ?? []; }
		if (this.roots.length) { return this.roots; }
		const hint = new TodoItem('ここにMarkdown・txtファイルをドロップ', 'hint');
		hint.id = 'todo-drop-hint';
		hint.iconPath = new vscode.ThemeIcon('cloud-download');
		hint.command = { command: 'vscode-todo-drop.addFiles', title: 'ファイルを追加' };
		return [hint];
	}

	async handleDrop(_target: TodoItem | undefined, data: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
		try {
			const uris = await readDroppedFiles(data, token);
			if (token.isCancellationRequested) { return; }
			if (!uris.length) {
				await vscode.window.showWarningMessage('Markdownまたはtxtファイルをドロップしてください。');
				return;
			}
			await this.addFiles(uris);
		} catch (error) { await this.showError(error); }
	}

	handleCheckboxChange(event: vscode.TreeCheckboxChangeEvent<TodoItem>): Promise<void> {
		const changes = event.items.flatMap(([item, state]) => item.taskId
			? [{ id: item.taskId, checked: state === vscode.TreeItemCheckboxState.Checked }] : []);
		this.queue = this.queue.then(() => this.toggleTasks(changes)).catch(error => this.showError(error));
		return this.queue;
	}

	async removeFile(item?: TodoItem): Promise<void> {
		if (item?.kind === 'file' && item.uri && this.files.delete(item.uri.toString())) {
			await this.persist(); await this.refresh();
		}
	}

	private supported(uri: vscode.Uri): boolean {
		return ['file', 'vscode-remote'].includes(uri.scheme) && /\.(md|markdown|txt)$/i.test(uri.path);
	}

	async addFiles(uris?: readonly vscode.Uri[]): Promise<void> {
		const selected = uris ?? await vscode.window.showOpenDialog({
			canSelectMany: true, canSelectFolders: false,
			filters: { 'Markdown / Text': ['md', 'markdown', 'txt'] },
			openLabel: 'Todo Dropへ追加'
		});
		if (!selected) { return; }
		for (const uri of selected) {
			if (!this.supported(uri)) { throw new Error('Markdownまたはtxtファイルを追加してください。'); }
			await vscode.workspace.openTextDocument(uri);
		}
		for (const uri of selected) { this.files.set(uri.toString(), uri); }
		await this.persist();
		await this.refresh();
	}

	private async persist(): Promise<void> {
		await this.context.workspaceState.update('todoDrop.files', [...this.files.keys()]);
	}

	async refresh(): Promise<void> {
		const update = this.publishState(++this.generation);
		this.pendingRefresh = update;
		await update;
	}

	private async publishState(generation: number): Promise<void> {
		const snapshots = new Map<string, Snapshot>();
		const completedResources = new Set<string>();
		const items = new Map<string, TodoItem>();
		const config = vscode.workspace.getConfiguration('todoDrop');
		const hideCompleted = config.get<boolean>('hideCompleted', true);
		const roots = await Promise.all([...this.files].map(async ([key, uri]) => {
			const name = uri.path.split('/').pop() ?? uri.path;
			const file = new TodoItem(name, 'file', uri);
			file.id = key;
			items.set(key, file);
			file.contextValue = 'todoDrop.file';
			file.resourceUri = uri;
			file.tooltip = uri.fsPath;
			file.command = { command: 'vscode.open', title: '元ファイルを開く', arguments: [uri] };
			try {
				// stat first so a deleted but still-open document is shown as unavailable.
				await vscode.workspace.fs.stat(uri);
				const document = await vscode.workspace.openTextDocument(uri);
				const tasks = parseTasks(document.getText());
				const parents = new Map<number, TodoItem>();
				for (const task of tasks) {
					const parent = task.parentLine === undefined ? file : (parents.get(task.parentLine) ?? file);
					if (hideCompleted && task.checked) {
						parents.set(task.line, parent);
						continue;
					}
					const id = randomUUID();
					snapshots.set(id, { uri, task, version: document.version });
					const item = new TodoItem(task.label, 'task', uri, id);
					item.id = key + ':' + task.line;
					items.set(item.id, item);
					parents.set(task.line, item);
					// Only completed rows need a decoration resource. Plain rows have no icon slot.
					if (task.checked) {
						item.resourceUri = vscode.Uri.from({ scheme: 'todo-drop-task', path: '/' + encodeURIComponent(key), fragment: String(task.line) });
						item.iconPath = new vscode.ThemeIcon('blank');
						completedResources.add(item.resourceUri.toString());
					}
					item.checkboxState = task.checked ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
					item.tooltip = task.label;
					item.accessibilityInformation = { label: task.label + (task.checked ? ' (完了)' : ' (未完了)') };
					parent.children.push(item);
					parent.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
				}
				if (!file.children.length) {
					file.children.push(new TodoItem(tasks.length ? '未完了のToDoはありません。' : 'チェックリストが見つかりません。例: - [ ] todo', 'hint'));
				}
			} catch (error) {
				const hint = new TodoItem('ファイルを読み込めません。再読み込みするか、リストから外してください。', 'hint');
				hint.iconPath = new vscode.ThemeIcon('warning');
				hint.tooltip = String(error);
				file.children.push(hint);
			}
			return file;
		}));
		if (this.disposed) { return; }
		if (generation !== this.generation) { await this.pendingRefresh; return; }
		this.snapshots.clear();
		for (const [id, snapshot] of snapshots) { this.snapshots.set(id, snapshot); }
		this.roots = roots;
		this.items = items;
		const decorationUpdates = new Set([...this.completedResources, ...completedResources]);
		this.completedResources = completedResources;
		if (decorationUpdates.size) {
			this.decorationsChanged.fire([...decorationUpdates].map(value => vscode.Uri.parse(value)));
		}
		this.changed.fire(undefined);
	}

	async toggleTask(id: string, checked: boolean): Promise<void> {
		await this.toggleTasks([{ id, checked }]);
	}

	private async toggleTasks(changes: { id: string; checked: boolean }[]): Promise<void> {
		if (!changes.length) { return; }
		const edit = new vscode.WorkspaceEdit();
		for (const { id, checked } of changes) {
			const snapshot = this.snapshots.get(id);
			if (!snapshot) { throw new Error('リストが更新されています。最新の項目をもう一度選択してください。'); }
			await vscode.workspace.fs.stat(snapshot.uri);
			const document = await vscode.workspace.openTextDocument(snapshot.uri);
			if (document.version !== snapshot.version || document.lineAt(snapshot.task.line).text !== snapshot.task.raw) {
				await this.refresh();
				throw new Error('元ファイルが変更されています。最新の項目をもう一度選択してください。');
			}
			const config = vscode.workspace.getConfiguration('todoDrop', snapshot.uri);
			const style = config.get<CompletionStyle>('completionStyle', 'checkbox');
			edit.replace(snapshot.uri, document.lineAt(snapshot.task.line).range, formatTask(snapshot.task, checked, style));
		}
		if (!await vscode.workspace.applyEdit(edit)) { throw new Error('元ファイルを更新できませんでした。'); }
		await this.refresh();
	}

	private async showError(error: unknown): Promise<void> {
		await vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
		await this.refresh();
	}

	dispose(): void {
		this.disposed = true;
		this.generation++;
		this.changed.dispose();
		this.decorationsChanged.dispose();
		for (const disposable of this.disposables) { disposable.dispose(); }
	}
}

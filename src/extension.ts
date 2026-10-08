import * as vscode from 'vscode';
import { TodoItem, TodoViewProvider } from './todoView';

export function activate(context: vscode.ExtensionContext): void {
	const provider = new TodoViewProvider(context);
	const view = vscode.window.createTreeView(TodoViewProvider.viewId, {
		treeDataProvider: provider, dragAndDropController: provider, manageCheckboxStateManually: true
	});
	context.subscriptions.push(provider, view,
		vscode.window.registerFileDecorationProvider(provider),
		view.onDidChangeCheckboxState(event => { void provider.handleCheckboxChange(event); }),
		view.onDidChangeVisibility(event => { if (event.visible) { void provider.refresh(); } }),
		vscode.commands.registerCommand('vscode-todo-drop.removeFile', (item: TodoItem) => provider.removeFile(item)),
		vscode.commands.registerCommand('vscode-todo-drop.addFiles', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
			try {
				await provider.addFiles(uris ?? (uri ? [uri] : undefined));
			} catch (error) {
				await vscode.window.showErrorMessage(String(error));
			}
		}),
		vscode.commands.registerCommand('vscode-todo-drop.refresh', () => provider.refresh())
	);
	void provider.refresh();
}

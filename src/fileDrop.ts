import * as vscode from 'vscode';

/** Read native Explorer URI lists and OS file drops without copying source contents. */
export async function readDroppedFiles(data: vscode.DataTransfer, token: vscode.CancellationToken): Promise<vscode.Uri[]> {
	const uris = new Map<string, vscode.Uri>();
	const add = (uri: vscode.Uri) => {
		const clean = uri.with({ query: '', fragment: '' });
		if (['file', 'vscode-remote'].includes(clean.scheme) && /\.(md|markdown|txt)$/i.test(clean.path)) {
			uris.set(clean.toString(), clean);
		}
	};
	const list = data.get('text/uri-list');
	if (list) {
		for (const line of (await list.asString()).split(/\r?\n/)) {
			if (token.isCancellationRequested) { return []; }
			const value = line.trim();
			if (!value || value.startsWith('#')) { continue; }
			try { add(vscode.Uri.parse(value, true)); } catch { /* Ignore invalid URI entries. */ }
		}
	}
	for (const [, item] of data) {
		if (token.isCancellationRequested) { return []; }
		const file = item.asFile();
		if (file?.uri) { add(file.uri); }
	}
	return token.isCancellationRequested ? [] : [...uris.values()];
}

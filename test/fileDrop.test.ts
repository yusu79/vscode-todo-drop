import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';
import { readDroppedFiles } from '../src/fileDrop';

suite('Native file drops', () => {
	test('reads Explorer URI lists, ignores comments, deduplicates and strips editor selection', async () => {
		const data = new vscode.DataTransfer();
		data.set('text/uri-list', new vscode.DataTransferItem('# files\r\nfile:///notes/task.md#L2,1\r\nfile:///notes/task.md\r\nfile:///notes/list.txt\r\nfile:///notes/no.json'));
		const cancel = new vscode.CancellationTokenSource();
		try {
			assert.deepEqual((await readDroppedFiles(data, cancel.token)).map(uri => uri.toString()),
				['file:///notes/task.md', 'file:///notes/list.txt']);
		} finally { cancel.dispose(); }
	});
	test('reads file items with source URIs and leaves cancelled drops untouched', async () => {
		const uri = vscode.Uri.file('C:/notes/tasks.txt');
		const item = {
			asString: async () => '',
			asFile: () => ({ uri, name: 'tasks.txt', id: 'file', data: async () => new Uint8Array() }),
			value: undefined
		} as vscode.DataTransferItem;
		const data = new vscode.DataTransfer();
		data.set('application/octet-stream', item);
		const cancel = new vscode.CancellationTokenSource();
		try {
			assert.deepEqual((await readDroppedFiles(data, cancel.token)).map(u => u.toString()), [uri.toString()]);
			cancel.cancel();
			assert.deepEqual(await readDroppedFiles(data, cancel.token), []);
		} finally { cancel.dispose(); }
	});
});

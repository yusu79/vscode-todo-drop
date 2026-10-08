import { defineConfig } from '@vscode/test-cli';
import path from 'node:path';

const workspace = process.env.TODO_DROP_TEST_WORKSPACE;
if (!workspace) {
	throw new Error('Set TODO_DROP_TEST_WORKSPACE to an isolated folder under your project-materials test-workspace.');
}

const quote = value => process.platform === 'win32' ? '"' + value + '"' : value;

export default defineConfig({
	files: 'out/test/**/*.test.js',
	workspaceFolder: workspace,
	useInstallation: process.env.TODO_DROP_VSCODE_PATH ? { fromPath: process.env.TODO_DROP_VSCODE_PATH } : undefined,
	launchArgs: [
		'--user-data-dir=' + quote(path.join(workspace, '.vscode-user')),
		'--extensions-dir=' + quote(path.join(workspace, '.vscode-extensions')),
		'--skip-welcome', '--skip-release-notes', '--disable-workspace-trust'
	],
	mocha: { ui: 'tdd', timeout: 15000 }
});

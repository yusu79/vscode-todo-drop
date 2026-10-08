import * as assert from 'node:assert/strict';
import { formatTask, localDate, parseTasks } from '../src/tasks';

suite('Task parsing and completion', () => {
	test('tracks nested parents across siblings, tabs and section boundaries', () => {
		const tasks = parseTasks('- [ ] parent\n  - [ ] child\n    1. [ ] grandchild\n  + [ ] sibling\n- [ ] next\n\t* [ ] tab child\n# Section\n  - [ ] separate');
		assert.deepEqual(tasks.map(task => task.parentLine), [undefined, 0, 1, 0, undefined, 4, undefined]);
	});
	test('parses bullets, nested and numbered tasks, preserving line numbers and whitespace', () => {
		const tasks = parseTasks('# Tasks\r\n- [ ] first\r\n\t* [X] done\r\n1. [ ] numbered\r\n+ [x] ~~finished~~ [2026-10-07]\r\n- plain text');
		assert.deepEqual(tasks.map(t => [t.line, t.checked, t.label]), [
			[1, false, 'first'], [2, true, 'done'], [3, false, 'numbered'], [4, true, 'finished']
		]);
		assert.equal(formatTask(tasks[1], false, 'checkbox'), '\t* [ ] done');
	});
	test('ignores fenced code and requires a matching closing fence', () => {
		const tasks = parseTasks('- [ ] before\n````md\n- [ ] code\n```\n- [ ] still code\n````\n~~~\n- [ ] code too\n~~~\n- [ ] after');
		assert.deepEqual(tasks.map(t => t.label), ['before', 'after']);
		assert.deepEqual(parseTasks('```\n- [ ] unclosed'), []);
	});
	test('formats all three completion styles and reverses completion decoration', () => {
		const task = parseTasks('  - [ ]  日本語 task')[0];
		for (const [style, expected] of [
			['checkbox', '  - [x]  日本語 task'],
			['strikethrough', '  - [x]  ~~日本語 task~~'],
			['strikethroughDate', '  - [x]  ~~日本語 task~~ [2026-10-07]']
		] as const) {
			const completed = formatTask(task, true, style, '2026-10-07');
			assert.equal(completed, expected);
			assert.equal(formatTask(parseTasks(completed)[0], false, style), task.raw);
			assert.equal(formatTask(parseTasks(completed)[0], true, style), completed);
		}
	});
	test('does not strip dates or partial strikethrough belonging to task text', () => {
		assert.equal(formatTask(parseTasks('- [x] meeting [2026-10-07]')[0], false, 'checkbox'), '- [ ] meeting [2026-10-07]');
		assert.equal(formatTask(parseTasks('- [x] ~~old~~ new')[0], false, 'checkbox'), '- [ ] ~~old~~ new');
	});
	test('formats local dates with zero padding', () => {
		assert.equal(localDate(new Date(2026, 0, 2, 23, 59)), '2026-01-02');
	});
});

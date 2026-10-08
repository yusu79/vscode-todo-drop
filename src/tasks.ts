export type CompletionStyle = 'checkbox' | 'strikethrough' | 'strikethroughDate';

export interface Task {
	line: number;
	raw: string;
	prefix: string;
	spacing: string;
	body: string;
	checked: boolean;
	label: string;
	parentLine?: number;
}

const taskPattern = /^(\s*(?:[-+*]|\d+[.)])\s+)\[([ xX])\](\s+)(.*)$/;
const decoratedPattern = /^~~(.*)~~(?: \[(\d{4}-\d{2}-\d{2})\])?$/;

export function parseTasks(text: string): Task[] {
	const tasks: Task[] = [];
	const ancestors: { indent: number; line: number }[] = [];
	let fence: { marker: string; length: number } | undefined;
	text.split(/\r\n|\n|\r/).forEach((raw, line) => {
		const boundary = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(raw);
		if (boundary) {
			ancestors.length = 0;
			if (!fence) {
				fence = { marker: boundary[1][0], length: boundary[1].length };
			} else if (boundary[1][0] === fence.marker && boundary[1].length >= fence.length && !boundary[2].trim()) {
				fence = undefined;
			}
			return;
		}
		if (fence) { return; }
		const match = taskPattern.exec(raw);
		const indentation = /^[ \t]*/.exec(raw)![0];
		const indent = [...indentation].reduce((column, char) => char === '\t' ? column + 4 - column % 4 : column + 1, 0);
		if (!match) {
			if (raw.trim()) {
				while (ancestors.length && ancestors[ancestors.length - 1].indent >= indent) { ancestors.pop(); }
			}
			return;
		}
		while (ancestors.length && ancestors[ancestors.length - 1].indent >= indent) { ancestors.pop(); }
		const checked = match[2].toLowerCase() === 'x';
		const body = match[4];
		tasks.push({ line, raw, prefix: match[1], spacing: match[3], body, checked,
			label: checked ? (decoratedPattern.exec(body)?.[1] ?? body) : body,
			parentLine: ancestors[ancestors.length - 1]?.line });
		ancestors.push({ indent, line });
	});
	return tasks;
}

export function localDate(date = new Date()): string {
	return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function formatTask(task: Task, checked: boolean, style: CompletionStyle, date = localDate()): string {
	if (task.checked === checked) { return task.raw; }
	const body = task.checked ? (decoratedPattern.exec(task.body)?.[1] ?? task.body) : task.body;
	const completed = style === 'checkbox' ? body : `~~${body}~~${style === 'strikethroughDate' ? ' [' + date + ']' : ''}`;
	return `${task.prefix}[${checked ? 'x' : ' '}]${task.spacing}${checked ? completed : body}`;
}

import type { KanbanPriority, KanbanSection, KanbanSectionName, KanbanTask } from '../types';

const SECTION_NAMES: KanbanSectionName[] = ['Backlog', 'Ready', 'In Progress', 'Done'];
const CANONICAL_SECTION_PATTERN = /^##\s+(Backlog|Ready|In Progress|Done)\s*$/m;

function isSectionName(value: string): value is KanbanSectionName {
  return SECTION_NAMES.includes(value as KanbanSectionName);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[`'"“”‘’().,:/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function trimBlock(value: string) {
  return value.replace(/^\s+|\s+$/g, '');
}

function createTaskId(taskFile: string | undefined, title: string, section: KanbanSectionName) {
  if (taskFile) {
    return taskFile.replace(/^tasks\//, '').replace(/\.md$/i, '');
  }

  return `${section.toLowerCase()}-${slugify(title)}`;
}

type TaskNote = Partial<
  Pick<
    KanbanTask,
    'title' | 'priority' | 'section' | 'aiAppetite' | 'why' | 'outcome' | 'source' | 'details'
  >
>;

function parseScalarValue(rawValue: string) {
  const value = rawValue.trim();

  if (!value) {
    return '';
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  return value;
}

function parseFrontmatter(markdown: string) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return null;
  }

  const data = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf(':');
        const key = line.slice(0, separatorIndex).trim();
        const rawValue = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1);
        return [key, parseScalarValue(rawValue)];
      }),
  );

  return {
    data,
    body: markdown.slice(match[0].length),
  };
}

function parseTaskBody(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  let title = '';
  const why: string[] = [];
  const outcome: string[] = [];
  const details: string[] = [];
  let mode: 'body' | 'why' | 'outcome' | 'details' = 'body';

  for (const line of lines) {
    const titleMatch = !title ? line.match(/^#\s+(.+)$/) : null;
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();

      if (heading === 'Why') {
        mode = 'why';
        continue;
      }

      if (heading === 'Outcome') {
        mode = 'outcome';
        continue;
      }

      if (heading === 'Details') {
        mode = 'details';
        continue;
      }

      mode = 'details';
      details.push(line);
      continue;
    }

    if (mode === 'why') {
      why.push(line);
      continue;
    }

    if (mode === 'outcome') {
      outcome.push(line);
      continue;
    }

    details.push(line);
  }

  return {
    title,
    why: trimBlock(why.join('\n')) || undefined,
    outcome: trimBlock(outcome.join('\n')) || undefined,
    details: trimBlock(details.join('\n')) || undefined,
  };
}

function parseLegacyTaskNote(markdown: string): TaskNote {
  const lines = markdown.split(/\r?\n/);
  const metadata: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (index === 0 && line.startsWith('# ')) {
      continue;
    }

    if (line.startsWith('## ')) {
      break;
    }

    metadata.push(line);
  }

  let priority: KanbanPriority | undefined;
  let section: KanbanSectionName | undefined;
  let aiAppetite: number | undefined;
  let source: string | undefined;

  for (const line of metadata) {
    const priorityMatch = line.match(/^Priority:\s*`(P[0-3])`\s*$/);
    if (priorityMatch) {
      priority = priorityMatch[1] as KanbanPriority;
      continue;
    }

    const sectionMatch = line.match(/^Status:\s*`(.+)`\s*$/);
    if (sectionMatch && isSectionName(sectionMatch[1].trim())) {
      section = sectionMatch[1].trim() as KanbanSectionName;
      continue;
    }

    const appetiteMatch = line.match(/^AI Appetite:\s*(\d{1,3})%\s*$/);
    if (appetiteMatch) {
      aiAppetite = Math.max(0, Math.min(100, Number(appetiteMatch[1])));
      continue;
    }

    const sourceMatch = line.match(/^Source:\s*(.+)\s*$/);
    if (sourceMatch) {
      source = sourceMatch[1].trim();
    }
  }

  return {
    ...parseTaskBody(markdown),
    priority,
    section,
    aiAppetite,
    source,
  };
}

export function parseTaskNote(markdown: string): TaskNote {
  const frontmatter = parseFrontmatter(markdown);

  if (!frontmatter) {
    return parseLegacyTaskNote(markdown);
  }

  const title = frontmatter.body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const body = parseTaskBody(frontmatter.body);
  const priority = typeof frontmatter.data.priority === 'string' ? frontmatter.data.priority : undefined;
  const status = typeof frontmatter.data.status === 'string' ? frontmatter.data.status : undefined;
  const aiAppetite =
    typeof frontmatter.data.ai_appetite === 'number' ? frontmatter.data.ai_appetite : undefined;
  const source =
    typeof frontmatter.data.source === 'string' ? frontmatter.data.source.trim() || undefined : undefined;

  return {
    ...body,
    title,
    priority: priority && /^P[0-3]$/.test(priority) ? (priority as KanbanPriority) : undefined,
    section: status && isSectionName(status) ? status : undefined,
    aiAppetite,
    source,
  };
}

export function parseKanban(taskNotes: Record<string, string> = {}): KanbanSection[] {
  const sections = new Map<KanbanSectionName, KanbanTask[]>();

  for (const [taskFile, markdown] of Object.entries(taskNotes)) {
    const parsedNote = parseTaskNote(markdown);

    if (!parsedNote.title || !parsedNote.priority || !parsedNote.section) {
      continue;
    }

    const task: KanbanTask = {
      id: createTaskId(taskFile, parsedNote.title, parsedNote.section),
      title: parsedNote.title.trim(),
      priority: parsedNote.priority,
      section: parsedNote.section,
      aiAppetite: parsedNote.aiAppetite,
      why: parsedNote.why,
      outcome: parsedNote.outcome,
      source: parsedNote.source,
      details: parsedNote.details,
      taskFile,
    };

    const sectionTasks = sections.get(task.section) ?? [];
    sectionTasks.push(task);
    sections.set(task.section, sectionTasks);
  }

  return SECTION_NAMES.map((name) => ({
    name,
    tasks: (sections.get(name) ?? []).sort((a, b) => a.title.localeCompare(b.title)),
  }));
}

export function parseKanbanDocument(markdown: string, taskNotes: Record<string, string> = {}) {
  const firstSectionMatch = markdown.match(CANONICAL_SECTION_PATTERN);
  const firstSectionIndex = firstSectionMatch?.index ?? -1;
  const preamble =
    firstSectionIndex === -1 ? markdown.trimEnd() : markdown.slice(0, firstSectionIndex).trimEnd();

  return {
    preamble,
    sections: parseKanban(taskNotes),
  };
}

export function serializeKanban(preamble: string, sections: KanbanSection[]) {
  void sections;
  return `${preamble.trimEnd()}\n`;
}

export function ensureTaskFile(task: KanbanTask) {
  return task.taskFile?.trim() ? task.taskFile : `tasks/${slugify(task.title)}.md`;
}

export function serializeTaskNote(task: KanbanTask) {
  const frontmatterLines = [
    '---',
    'type: repo-task',
    'repo: playground',
    `id: ${task.id}`,
    `priority: ${task.priority}`,
    `status: ${task.section}`,
  ];

  if (typeof task.aiAppetite === 'number') {
    frontmatterLines.push(`ai_appetite: ${task.aiAppetite}`);
  }

  if (task.source?.trim()) {
    frontmatterLines.push(`source: ${JSON.stringify(task.source.trim())}`);
  }

  frontmatterLines.push('---', '', `# ${task.title}`);

  const lines = [...frontmatterLines];

  if (task.why?.trim()) {
    lines.push('', '## Why', '', task.why.trim());
  }

  if (task.outcome?.trim()) {
    lines.push('', '## Outcome', '', task.outcome.trim());
  }

  if (task.details?.trim()) {
    lines.push('', '## Details', '', task.details.trim());
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

export function countByPriority(tasks: KanbanTask[]) {
  return tasks.reduce<Record<KanbanPriority, number>>(
    (acc, task) => {
      acc[task.priority] += 1;
      return acc;
    },
    { P0: 0, P1: 0, P2: 0, P3: 0 },
  );
}

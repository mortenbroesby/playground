import type { KanbanPriority, KanbanSection, KanbanSectionName, KanbanTask } from '../types';

const SECTION_NAMES: KanbanSectionName[] = ['Backlog', 'Ready', 'In Progress', 'Done'];
const CANONICAL_SECTION_PATTERN = /^##\s+(Backlog|Ready|In Progress|Done)\s*$/m;
const DETAIL_HEADING_PATTERN = /^\s{2}[A-Z][A-Za-z -]*:/;

function isSectionName(value: string): value is KanbanSectionName {
  return SECTION_NAMES.includes(value as KanbanSectionName);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[`'"“”‘’().,:/]/g, '')
    .replace(/\s+/g, '-');
}

function parseWrappedValue(lines: string[], startIndex: number) {
  const firstLine = lines[startIndex];
  const firstLineMatch = firstLine.match(/^\s{2}[A-Za-z][A-Za-z -]*:\s*(.*)$/);
  const values = [firstLineMatch?.[1]?.trim() ?? ''];
  let endIndex = startIndex;

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.startsWith('  ') || DETAIL_HEADING_PATTERN.test(line)) {
      break;
    }

    values.push(line.trim());
    endIndex = index;
  }

  return {
    endIndex,
    value: values.filter(Boolean).join(' ').trim(),
  };
}

function parseTaskMetadata(rawLines: string[]) {
  const metadata: Pick<KanbanTask, 'aiAppetite' | 'why' | 'outcome' | 'source'> = {};

  for (let index = 1; index < rawLines.length; index += 1) {
    const line = rawLines[index];
    const aiAppetiteMatch = line.match(/^\s+AI Appetite:\s*(\d{1,3})%$/);

    if (aiAppetiteMatch) {
      const appetite = Number(aiAppetiteMatch[1]);
      metadata.aiAppetite = Math.max(0, Math.min(100, appetite));
      continue;
    }

    if (line.startsWith('  Why:')) {
      const block = parseWrappedValue(rawLines, index);
      metadata.why = block.value;
      index = block.endIndex;
      continue;
    }

    if (line.startsWith('  Outcome:')) {
      const block = parseWrappedValue(rawLines, index);
      metadata.outcome = block.value;
      index = block.endIndex;
      continue;
    }

    if (line.startsWith('  Source:')) {
      const block = parseWrappedValue(rawLines, index);
      metadata.source = block.value;
      index = block.endIndex;
    }
  }

  return metadata;
}

function hydrateTaskFields(task: KanbanTask) {
  Object.assign(task, parseTaskMetadata(task.rawLines ?? []));
}

export function parseKanban(markdown: string): KanbanSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections = new Map<KanbanSectionName, KanbanSection>();

  let activeSection: KanbanSectionName | null = null;
  let activeTask: KanbanTask | null = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1].trim();

      if (isSectionName(sectionName)) {
        activeSection = sectionName;
        if (!sections.has(sectionName)) {
          sections.set(sectionName, { name: sectionName, tasks: [] });
        }
      } else {
        activeSection = null;
      }

      activeTask = null;
      continue;
    }

    if (!activeSection) {
      continue;
    }

    const taskMatch = line.match(/^- (?:\[(?<checked> |x)\]\s+)?`(?<priority>P[0-3])` (?<title>.+)$/);
    if (taskMatch?.groups) {
      const priority = taskMatch.groups.priority as KanbanPriority;
      const title = taskMatch.groups.title.trim();

      activeTask = {
        id: `${activeSection.toLowerCase()}-${slugify(title)}`,
        title,
        priority,
        section: activeSection,
        checked: taskMatch.groups.checked === 'x',
        rawLines: [line],
      };

      sections.get(activeSection)!.tasks.push(activeTask);
      continue;
    }

    if (!activeTask) {
      continue;
    }

    activeTask.rawLines?.push(line);
  }

  for (const section of sections.values()) {
    for (const task of section.tasks) {
      hydrateTaskFields(task);
    }
  }

  return SECTION_NAMES.map((name) => sections.get(name) ?? { name, tasks: [] });
}

export function parseKanbanDocument(markdown: string) {
  const firstSectionMatch = markdown.match(CANONICAL_SECTION_PATTERN);
  const firstSectionIndex = firstSectionMatch?.index ?? -1;
  const preamble =
    firstSectionIndex === -1 ? markdown.trimEnd() : markdown.slice(0, firstSectionIndex).trimEnd();

  return {
    preamble,
    sections: parseKanban(markdown),
  };
}

function makeTaskHeader(task: KanbanTask) {
  const checkboxPrefix = task.checked ? '[x] ' : '';
  return `- ${checkboxPrefix}\`${task.priority}\` ${task.title}`;
}

function findSingleLineIndex(lines: string[], prefix: string) {
  return lines.findIndex((line, index) => index > 0 && line.startsWith(prefix));
}

function findWrappedBlock(lines: string[], label: string) {
  const startIndex = lines.findIndex((line, index) => index > 0 && line.startsWith(`  ${label}:`));

  if (startIndex === -1) {
    return null;
  }

  let endIndex = startIndex;

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.startsWith('  ') || DETAIL_HEADING_PATTERN.test(line)) {
      break;
    }

    endIndex = index;
  }

  return { startIndex, endIndex };
}

function replaceLines(lines: string[], startIndex: number, endIndex: number, nextLines: string[]) {
  lines.splice(startIndex, endIndex - startIndex + 1, ...nextLines);
}

function insertDetailLine(lines: string[], nextLine: string) {
  const sourceBlock = findWrappedBlock(lines, 'Source');

  if (sourceBlock) {
    lines.splice(sourceBlock.startIndex, 0, nextLine);
    return;
  }

  lines.push(nextLine);
}

function updateSingleLineField(
  lines: string[],
  prefix: string,
  nextLine: string | null,
) {
  const index = findSingleLineIndex(lines, prefix);

  if (index === -1) {
    if (nextLine) {
      insertDetailLine(lines, nextLine);
    }
    return;
  }

  if (!nextLine) {
    lines.splice(index, 1);
    return;
  }

  lines[index] = nextLine;
}

function updateWrappedField(
  lines: string[],
  label: 'Why' | 'Outcome' | 'Source',
  value: string | undefined,
) {
  const block = findWrappedBlock(lines, label);
  const nextLines = value?.trim() ? [`  ${label}: ${value.trim()}`] : [];

  if (!block) {
    if (nextLines.length > 0) {
      insertDetailLine(lines, nextLines[0]);
    }
    return;
  }

  replaceLines(lines, block.startIndex, block.endIndex, nextLines);
}

function serializeTask(task: KanbanTask) {
  if (task.rawLines && task.rawLines.length > 0 && !task.isCustom) {
    const lines = [...task.rawLines];
    const original = parseTaskMetadata(task.rawLines);
    lines[0] = makeTaskHeader(task);

    if (task.aiAppetite !== original.aiAppetite) {
      updateSingleLineField(
        lines,
        '  AI Appetite:',
        typeof task.aiAppetite === 'number' ? `  AI Appetite: ${task.aiAppetite}%` : null,
      );
    }
    if (task.why !== original.why) {
      updateWrappedField(lines, 'Why', task.why);
    }
    if (task.outcome !== original.outcome) {
      updateWrappedField(lines, 'Outcome', task.outcome);
    }
    if (task.source !== original.source) {
      updateWrappedField(lines, 'Source', task.source);
    }

    return lines.join('\n');
  }

  const lines = [makeTaskHeader(task)];

  if (typeof task.aiAppetite === 'number') {
    lines.push(`  AI Appetite: ${task.aiAppetite}%`);
  }

  if (task.why) {
    lines.push(`  Why: ${task.why}`);
  }

  if (task.outcome) {
    lines.push(`  Outcome: ${task.outcome}`);
  }

  if (task.source) {
    lines.push(`  Source: ${task.source}`);
  }

  return lines.join('\n');
}

export function serializeKanban(preamble: string, sections: KanbanSection[]) {
  const sectionBlocks = sections.map((section) => {
    const tasks = section.tasks.map(serializeTask).join('\n\n');
    return tasks ? `## ${section.name}\n\n${tasks}` : `## ${section.name}`;
  });

  return `${preamble.trimEnd()}\n\n${sectionBlocks.join('\n\n')}\n`;
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

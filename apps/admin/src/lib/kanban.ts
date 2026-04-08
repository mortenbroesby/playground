import type { KanbanPriority, KanbanSection, KanbanSectionName, KanbanTask } from '../types';

const SECTION_NAMES: KanbanSectionName[] = ['Backlog', 'Ready', 'In Progress', 'Done'];

function isSectionName(value: string): value is KanbanSectionName {
  return SECTION_NAMES.includes(value as KanbanSectionName);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[`'"“”‘’().,:/]/g, '')
    .replace(/\s+/g, '-');
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

    const taskMatch = line.match(/^- (?:\[( |x)\]\s+)?`(?<priority>P[0-3])` (?<title>.+)$/);
    if (taskMatch?.groups) {
      const priority = taskMatch.groups.priority as KanbanPriority;
      const title = taskMatch.groups.title.trim();

      activeTask = {
        id: `${activeSection.toLowerCase()}-${slugify(title)}`,
        title,
        priority,
        section: activeSection,
      };

      sections.get(activeSection)!.tasks.push(activeTask);
      continue;
    }

    if (!activeTask) {
      continue;
    }

    const aiAppetiteMatch = line.match(/^\s+AI Appetite:\s*(\d{1,3})%$/);
    if (aiAppetiteMatch) {
      const appetite = Number(aiAppetiteMatch[1]);
      activeTask.aiAppetite = Math.max(0, Math.min(100, appetite));
      continue;
    }

    const whyMatch = line.match(/^\s+Why:\s*(.+)$/);
    if (whyMatch) {
      activeTask.why = whyMatch[1].trim();
      continue;
    }

    const outcomeMatch = line.match(/^\s+Outcome:\s*(.+)$/);
    if (outcomeMatch) {
      activeTask.outcome = outcomeMatch[1].trim();
      continue;
    }

    const sourceMatch = line.match(/^\s+Source:\s*(.+)$/);
    if (sourceMatch) {
      activeTask.source = sourceMatch[1].trim();
    }
  }

  return SECTION_NAMES.map((name) => sections.get(name) ?? { name, tasks: [] });
}

export function parseKanbanDocument(markdown: string) {
  const firstSectionIndex = markdown.search(/^##\s+/m);
  const preamble =
    firstSectionIndex === -1 ? markdown.trimEnd() : markdown.slice(0, firstSectionIndex).trimEnd();

  return {
    preamble,
    sections: parseKanban(markdown),
  };
}

function serializeTask(task: KanbanTask) {
  const lines = [`- \`${task.priority}\` ${task.title}`];

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

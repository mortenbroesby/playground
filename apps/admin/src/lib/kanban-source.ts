import taskBoardMarkdown from '../../../../vault/00 Repositories/playground/04 Tasks/Task Board.md?raw';
import { parseKanbanDocument } from './kanban';

const taskNoteModules = import.meta.glob(
  '../../../../vault/00 Repositories/playground/04 Tasks/tasks/*.md',
  {
    eager: true,
    import: 'default',
    query: '?raw',
  },
) as Record<string, string>;

const taskNotes = Object.fromEntries(
  Object.entries(taskNoteModules).map(([filePath, markdown]) => {
    const taskFile = filePath.replace(/^.*\/04 Tasks\//, '');
    return [taskFile, markdown];
  }),
);

export const kanbanSourceDocument = parseKanbanDocument(taskBoardMarkdown, taskNotes);

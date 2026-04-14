export type KanbanPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type KanbanSectionName = 'Backlog' | 'Ready' | 'In Progress' | 'Done';

export type KanbanTask = {
  id: string;
  title: string;
  priority: KanbanPriority;
  section: KanbanSectionName;
  checked?: boolean;
  aiAppetite?: number;
  why?: string;
  outcome?: string;
  source?: string;
  isCustom?: boolean;
  rawLines?: string[];
};

export type KanbanSection = {
  name: KanbanSectionName;
  tasks: KanbanTask[];
};

export type TaskOverride = {
  priority?: KanbanPriority;
  section?: KanbanSectionName;
};

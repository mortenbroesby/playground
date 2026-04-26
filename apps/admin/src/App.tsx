import { Panel } from '@playground/ui';
import {
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Divider,
  Drawer,
  Group,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import {
  ClipboardList,
  Expand,
  Filter,
  Minimize2,
  PanelRightOpen,
  Plus,
  Search,
  Target,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { kanbanSourceDocument } from './lib/kanban-source';
import { countByPriority } from './lib/kanban';
import type { KanbanPriority, KanbanSection, KanbanSectionName, KanbanTask } from './types';

const priorityOrder: KanbanPriority[] = ['P0', 'P1', 'P2', 'P3'];
const sectionOrder: KanbanSectionName[] = ['Backlog', 'Ready', 'In Progress', 'Done'];
const taskBoardLabel = 'vault/00 Repositories/playground/04 Tasks/Task Board.md';

const prioritySelectData = priorityOrder.map((priority) => ({
  label: priority,
  value: priority,
}));

const sectionSelectData = sectionOrder.map((sectionName) => ({
  label: sectionName,
  value: sectionName,
}));

function createEmptySections(): KanbanSection[] {
  return sectionOrder.map((name) => ({
    name,
    tasks: [],
  }));
}

const sectionDescriptions: Record<KanbanSection['name'], string> = {
  Backlog: 'Visible, but not shaped for execution yet.',
  Ready: 'Clear enough to pick up next.',
  'In Progress': 'Active work in motion.',
  Done: 'Delivered and already landed.',
};

function stripCodeTicks(value: string) {
  return value.replace(/`([^`]+)`/g, '$1');
}

function priorityTone(priority: KanbanPriority): 'red' | 'yellow' | 'green' | 'teal' {
  switch (priority) {
    case 'P0':
      return 'red';
    case 'P1':
      return 'yellow';
    case 'P2':
      return 'green';
    case 'P3':
      return 'teal';
  }
}

function suggestAiAppetite(priority: KanbanPriority) {
  switch (priority) {
    case 'P0':
      return 30;
    case 'P1':
      return 50;
    case 'P2':
      return 70;
    case 'P3':
      return 85;
  }
}

function priorityRank(priority: KanbanPriority) {
  return priorityOrder.indexOf(priority);
}

function sortTasks(tasks: KanbanTask[]) {
  return [...tasks].sort((a, b) => {
    const byPriority = priorityRank(a.priority) - priorityRank(b.priority);

    if (byPriority !== 0) {
      return byPriority;
    }

    return a.title.localeCompare(b.title);
  });
}

function taskMatches(task: KanbanTask, query: string, priorities: Set<KanbanPriority>) {
  if (!priorities.has(task.priority)) {
    return false;
  }

  if (!query) {
    return true;
  }

  const haystack = [task.title, task.why, task.outcome, task.source, task.details]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function taskSummary(task: KanbanTask) {
  if (task.why) {
    return task.why;
  }

  if (task.outcome) {
    return task.outcome;
  }

  if (task.source) {
    return task.source;
  }

  return null;
}

type SectionColumnProps = {
  section: KanbanSection;
  isFocused: boolean;
  onToggleFocus: (section: KanbanSectionName) => void;
  onOpenTask: (task: KanbanTask) => void;
  onPriorityChange: (task: KanbanTask, priority: KanbanPriority) => void;
  onSectionChange: (task: KanbanTask, section: KanbanSectionName) => void;
  onRemoveTask: (task: KanbanTask) => void;
};

function SectionColumn({
  section,
  isFocused,
  onToggleFocus,
  onOpenTask,
  onPriorityChange,
  onSectionChange,
  onRemoveTask,
}: SectionColumnProps) {
  return (
    <Paper className="board-column" data-section={section.name} p="sm" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap" className="lane-header">
          <Box>
            <Title order={3} className="lane-title">{section.name}</Title>
          </Box>
          <Group gap="xs" wrap="nowrap" align="center">
            <Badge variant="light" color="gray">
              {section.tasks.length}
            </Badge>
            <Button
              variant={isFocused ? 'filled' : 'light'}
              color={isFocused ? 'green' : 'gray'}
              size="xs"
              leftSection={
                isFocused ? (
                  <Minimize2 className="icon-xs" aria-hidden="true" />
                ) : (
                  <Expand className="icon-xs" aria-hidden="true" />
                )
              }
              onClick={() => onToggleFocus(section.name)}
            >
              {isFocused ? 'Show all' : 'Focus'}
            </Button>
          </Group>
        </Group>

        <Text c="dimmed" size="xs" className="column-description">
          {sectionDescriptions[section.name]}
        </Text>

        <Stack gap="sm">
          {section.tasks.length === 0 ? (
            <Paper className="empty-state" p="sm" withBorder>
              <Text className="eyebrow">No tasks</Text>
              <Text c="dimmed" size="xs">
                Nothing matches the current filters in this lane.
              </Text>
            </Paper>
          ) : null}

          {section.tasks.map((task) => (
            <Card
              key={task.id}
              className="task-card"
              data-priority={task.priority}
              padding="xs"
              withBorder
            >
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <Group gap="xs" className="task-badges">
                    <Badge color={priorityTone(task.priority)} variant="light">
                      {task.priority}
                    </Badge>
                    {typeof task.aiAppetite === 'number' ? (
                      <Badge color="gray" variant="default">
                        AI {task.aiAppetite}%
                      </Badge>
                    ) : null}
                  </Group>
                </Group>

                <Box className="task-title-wrap">
                  <Title order={4} className="task-title">
                    {stripCodeTicks(task.title)}
                  </Title>
                </Box>

                {taskSummary(task) ? (
                  <Text size="xs" c="dimmed" className="task-summary-line">
                    {stripCodeTicks(taskSummary(task) ?? '')}
                  </Text>
                ) : null}

                <SimpleGrid cols={2} spacing="xs" className="task-select-grid">
                  <Select
                    aria-label={`Priority for ${task.title}`}
                    data={prioritySelectData}
                    value={task.priority}
                    onChange={(value) => value && onPriorityChange(task, value as KanbanPriority)}
                  />
                  <Select
                    aria-label={`Section for ${task.title}`}
                    data={sectionSelectData}
                    value={task.section}
                    onChange={(value) => value && onSectionChange(task, value as KanbanSectionName)}
                  />
                </SimpleGrid>

                <Group gap="xs" className="task-actions">
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    leftSection={<PanelRightOpen className="icon-xs" aria-hidden="true" />}
                    onClick={() => onOpenTask(task)}
                  >
                    Details
                  </Button>
                  {task.isCustom ? (
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      leftSection={<Trash2 className="icon-xs" aria-hidden="true" />}
                      onClick={() => onRemoveTask(task)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

export function App() {
  const [query, setQuery] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftWhy, setDraftWhy] = useState('');
  const [draftOutcome, setDraftOutcome] = useState('');
  const [draftPriority, setDraftPriority] = useState<KanbanPriority>('P2');
  const [draftSection, setDraftSection] = useState<KanbanSectionName>('Ready');
  const [sections, setSections] = useState<KanbanSection[]>(() => createEmptySections());
  const [isWritable, setIsWritable] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready'>('loading');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [focusedSection, setFocusedSection] = useState<KanbanSectionName | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showDraftDetails, setShowDraftDetails] = useState(false);
  const [activePriorities, setActivePriorities] = useState<Set<KanbanPriority>>(
    () => new Set(priorityOrder),
  );
  const lastPersistedSnapshotRef = useRef<string | null>(null);
  const saveStateResetRef = useRef<number | null>(null);
  const draftTitleInputRef = useRef<HTMLInputElement | null>(null);

  const loadDocument = useCallback(async () => {
    try {
      const response = await fetch('/api/kanban');

      if (!response.ok) {
        throw new Error(`Failed to load kanban: ${response.status}`);
      }

      const data = (await response.json()) as {
        document?: { sections?: KanbanSection[] };
      };

      if (!Array.isArray(data.document?.sections)) {
        throw new Error('Missing document payload');
      }

      lastPersistedSnapshotRef.current = JSON.stringify(data.document.sections);
      setSections(data.document.sections);
      setIsWritable(true);
      setLoadState('ready');
    } catch {
      lastPersistedSnapshotRef.current = JSON.stringify(kanbanSourceDocument.sections);
      setSections(kanbanSourceDocument.sections);
      setIsWritable(false);
      setLoadState('ready');
    }
  }, []);

  const persistDocument = useCallback(
    async (nextSections: KanbanSection[]) => {
      if (!isWritable) {
        return;
      }

      setSaveState('saving');

      try {
        const response = await fetch('/api/kanban', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document: {
              sections: nextSections,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save kanban: ${response.status}`);
        }

        lastPersistedSnapshotRef.current = JSON.stringify(nextSections);
        setSaveState('saved');

        if (saveStateResetRef.current) {
          window.clearTimeout(saveStateResetRef.current);
        }

        saveStateResetRef.current = window.setTimeout(() => setSaveState('idle'), 1800);
      } catch {
        setSaveState('error');
      }
    },
    [isWritable],
  );

  useEffect(() => {
    let cancelled = false;
    const hot = import.meta.hot;

    async function loadIfMounted() {
      try {
        await loadDocument();
      } finally {
        if (cancelled) {
          return;
        }
      }
    }

    const handleKanbanUpdated = () => {
      void loadDocument();
    };

    window.addEventListener('kanban:updated', handleKanbanUpdated);
    hot?.on('kanban:updated', handleKanbanUpdated);

    void loadIfMounted();

    return () => {
      cancelled = true;
      window.removeEventListener('kanban:updated', handleKanbanUpdated);

      if (hot && 'off' in hot && typeof hot.off === 'function') {
        hot.off('kanban:updated', handleKanbanUpdated);
      }
    };
  }, [loadDocument]);

  useEffect(() => {
    if (loadState !== 'ready' || !isWritable) {
      return;
    }

    const snapshot = JSON.stringify(sections);

    if (snapshot === lastPersistedSnapshotRef.current) {
      return;
    }

    void persistDocument(sections);
  }, [isWritable, loadState, persistDocument, sections]);

  useEffect(() => {
    return () => {
      if (saveStateResetRef.current) {
        window.clearTimeout(saveStateResetRef.current);
      }
    };
  }, []);

  const filteredSections = useMemo(
    () =>
      sections.map((section) => ({
        ...section,
        tasks: sortTasks(
          section.tasks.filter((task) => taskMatches(task, query, activePriorities)),
        ),
      })),
    [activePriorities, query, sections],
  );

  const visibleSections = useMemo(
    () =>
      focusedSection
        ? filteredSections.filter((section) => section.name === focusedSection)
        : filteredSections,
    [filteredSections, focusedSection],
  );

  const visibleTasks = filteredSections.flatMap((section) => section.tasks);
  const allTasks = sections.flatMap((section) => section.tasks);
  const selectedTask =
    selectedTaskId == null
      ? null
      : allTasks.find((task) => task.id === selectedTaskId) ?? null;
  const priorityCounts = countByPriority(allTasks);
  const completedCount = allTasks.filter((task) => task.section === 'Done').length;

  function togglePriority(priority: KanbanPriority) {
    setActivePriorities((current) => {
      const next = new Set(current);

      if (next.has(priority)) {
        next.delete(priority);
      } else {
        next.add(priority);
      }

      return next.size === 0 ? new Set(priorityOrder) : next;
    });
  }

  function updateTask(taskId: string, updater: (task: KanbanTask) => KanbanTask) {
    setSections((current) =>
      current.map((section) => ({
        ...section,
        tasks: section.tasks.map((task) => (task.id === taskId ? updater(task) : task)),
      })),
    );
  }

  function handlePriorityChange(task: KanbanTask, priority: KanbanPriority) {
    updateTask(task.id, (current) => ({
      ...current,
      priority,
      aiAppetite: suggestAiAppetite(priority),
    }));
  }

  function handleTitleChange(task: KanbanTask, title: string) {
    updateTask(task.id, (current) => ({ ...current, title }));
  }

  function handleWhyChange(task: KanbanTask, why: string) {
    updateTask(task.id, (current) => ({ ...current, why: why.trim() ? why : undefined }));
  }

  function handleOutcomeChange(task: KanbanTask, outcome: string) {
    updateTask(task.id, (current) => ({
      ...current,
      outcome: outcome.trim() ? outcome : undefined,
    }));
  }

  function handleSourceChange(task: KanbanTask, source: string) {
    updateTask(task.id, (current) => ({ ...current, source: source.trim() ? source : undefined }));
  }

  function handleDetailsChange(task: KanbanTask, details: string) {
    updateTask(task.id, (current) => ({
      ...current,
      details: details.trim() ? details : undefined,
    }));
  }

  function moveTask(taskId: string, nextSection: KanbanSectionName) {
    setSections((current) => {
      let movedTask: KanbanTask | null = null;

      const withoutTask = current.map((section) => ({
        ...section,
        tasks: section.tasks.filter((task) => {
          if (task.id !== taskId) {
            return true;
          }

          movedTask = { ...task, section: nextSection };
          return false;
        }),
      }));

      if (!movedTask) {
        return current;
      }

      return withoutTask.map((section) =>
        section.name === nextSection
          ? { ...section, tasks: [...section.tasks, movedTask!] }
          : section,
      );
    });
  }

  function handleSectionChange(task: KanbanTask, section: KanbanSectionName) {
    moveTask(task.id, section);
  }

  function handleRemoveTask(task: KanbanTask) {
    setSections((current) =>
      current.map((section) => ({
        ...section,
        tasks: section.tasks.filter((candidate) => candidate.id !== task.id),
      })),
    );

    setSelectedTaskId((current) => (current === task.id ? null : current));
  }

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = draftTitle.trim();

    if (!title) {
      return;
    }

    const task: KanbanTask = {
      id: `custom-${crypto.randomUUID()}`,
      title,
      priority: draftPriority,
      section: draftSection,
      aiAppetite: suggestAiAppetite(draftPriority),
      why: draftWhy.trim() || undefined,
      outcome: draftOutcome.trim() || undefined,
      source: 'Admin app',
      taskFile: undefined,
      isCustom: true,
    };

    setSections((current) =>
      current.map((section) =>
        section.name === draftSection
          ? { ...section, tasks: [task, ...section.tasks] }
          : section,
      ),
    );
    setDraftTitle('');
    setDraftWhy('');
    setDraftOutcome('');
    setDraftPriority('P2');
    setDraftSection('Ready');
    setShowDraftDetails(false);
    draftTitleInputRef.current?.focus();
  }

  function handleToggleFocus(section: KanbanSectionName) {
    setFocusedSection((current) => (current === section ? null : section));
  }

  function handleOpenTask(task: KanbanTask) {
    setSelectedTaskId(task.id);
  }

  return (
    <Box className="admin-shell terminal-app">
      <Stack className="admin-page" gap="sm">
        <Panel glow className="page-header chrome-panel">
          <Group justify="space-between" align="flex-start" gap="sm">
            <Box>
              <Text className="chrome-label eyebrow">ADMIN-01</Text>
              <Title order={1} className="terminal-heading page-title">Kanban</Title>
              <Text c="dimmed" size="xs">
                Live editor for <code>{taskBoardLabel}</code>.
              </Text>
            </Box>

            <Stack gap={4} align="flex-end">
              <Group gap="xs" className="summary-chips">
                <Badge variant="light" color="gray" leftSection={<ClipboardList className="icon-xs" aria-hidden="true" />}>
                  {visibleTasks.length} visible
                </Badge>
                <Badge variant="light" color="green" leftSection={<Target className="icon-xs" aria-hidden="true" />}>
                  {allTasks.length - completedCount} open
                </Badge>
                <Badge variant="light" color="teal">
                  {completedCount} done
                </Badge>
              </Group>
              <Group gap="xs">
                <Badge variant="light" color={isWritable ? 'green' : 'gray'}>
                  {loadState === 'loading' ? 'syncing board' : isWritable ? 'kanban live' : 'read only'}
                </Badge>
                <Badge
                  variant="light"
                  color={saveState === 'error' ? 'red' : saveState === 'saved' ? 'teal' : 'gray'}
                >
                  {saveState === 'saving'
                    ? 'saving'
                    : saveState === 'saved'
                      ? 'saved'
                      : saveState === 'error'
                        ? 'save failed'
                        : 'ready'}
                </Badge>
              </Group>
            </Stack>
          </Group>
        </Panel>

        <Panel tone="quiet" className="quick-add-shell chrome-panel">
          <form onSubmit={handleAddTask}>
            <Stack gap="sm" className="quick-add-surface">
              <Box>
                <Text className="chrome-label eyebrow">Add idea</Text>
                <Title order={2} className="terminal-heading board-title">
                  Capture first, shape later
                </Title>
                <Text c="dimmed" size="xs">
                  Add the task title, pick where it belongs, and keep moving. Open details only when the task needs more framing.
                </Text>
              </Box>

              <SimpleGrid cols={{ base: 1, md: 5 }} spacing="xs" verticalSpacing="xs">
                <TextInput
                  ref={draftTitleInputRef}
                  label="Task"
                  placeholder="Add a new idea or follow-up task"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  className="idea-field-wide"
                />
                <Select
                  label="Priority"
                  data={prioritySelectData}
                  value={draftPriority}
                  onChange={(value) => value && setDraftPriority(value as KanbanPriority)}
                />
                <Select
                  label="Section"
                  data={sectionSelectData}
                  value={draftSection}
                  onChange={(value) => value && setDraftSection(value as KanbanSectionName)}
                />
                <Stack gap={6} justify="flex-end" className="quick-add-actions">
                  <Button
                    type="submit"
                    color="green"
                    size="xs"
                    leftSection={<Plus className="icon-xs" aria-hidden="true" />}
                    disabled={draftTitle.trim().length === 0}
                    fullWidth
                  >
                    Add task
                  </Button>
                  <Button
                    type="button"
                    variant="subtle"
                    color="gray"
                    size="xs"
                    onClick={() => setShowDraftDetails((current) => !current)}
                    fullWidth
                  >
                    {showDraftDetails ? 'Hide details' : 'Add details'}
                  </Button>
                </Stack>
              </SimpleGrid>

              <Box className="draft-details" data-expanded={showDraftDetails ? 'true' : 'false'}>
                <Collapse in={showDraftDetails}>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs" verticalSpacing="xs">
                    <TextInput
                      label="Why"
                      placeholder="Why this matters"
                      value={draftWhy}
                      onChange={(event) => setDraftWhy(event.target.value)}
                    />
                    <TextInput
                      label="Outcome"
                      placeholder="What done should look like"
                      value={draftOutcome}
                      onChange={(event) => setDraftOutcome(event.target.value)}
                    />
                  </SimpleGrid>
                </Collapse>
              </Box>
            </Stack>
          </form>
        </Panel>

        <Panel tone="quiet" className="board-toolbar chrome-panel">
          <Stack gap="xs">
            <Group justify="space-between" align="flex-start" gap="sm">
              <Box>
                <Text className="chrome-label eyebrow">Board controls</Text>
                <Text c="dimmed" size="xs">
                  {isWritable
                    ? 'Auto-saves the board index and linked task notes while you work.'
                    : 'Read-only fallback mode. Run the app in dev to write back to the vault task board.'}
                </Text>
              </Box>
              <Group gap="xs">
                <Badge variant="light" color={isWritable ? 'green' : 'gray'}>
                  {loadState === 'loading' ? 'syncing board' : isWritable ? 'kanban live' : 'read only'}
                </Badge>
                <Badge
                  variant="light"
                  color={saveState === 'error' ? 'red' : saveState === 'saved' ? 'teal' : 'gray'}
                >
                  {saveState === 'saving'
                    ? 'saving'
                    : saveState === 'saved'
                      ? 'saved'
                      : saveState === 'error'
                        ? 'save failed'
                        : 'ready'}
                </Badge>
              </Group>
            </Group>

            <Group align="flex-end" gap="xs" wrap="wrap">
              <TextInput
                leftSection={<Search className="icon-sm" aria-hidden="true" />}
                placeholder="Search tasks, outcomes, or sources"
                aria-label="Search kanban tasks"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="toolbar-search"
              />
              <Group gap="xs" className="toolbar-priority-row">
                <Badge variant="light" color="gray" leftSection={<Filter className="icon-xs" aria-hidden="true" />}>
                  Priority
                </Badge>
                {priorityOrder.map((priority) => (
                  <Button
                    key={priority}
                    variant={activePriorities.has(priority) ? 'light' : 'subtle'}
                    color={activePriorities.has(priority) ? priorityTone(priority) : 'gray'}
                    size="xs"
                    onClick={() => togglePriority(priority)}
                  >
                    {priority} {priorityCounts[priority]}
                  </Button>
                ))}
              </Group>
            </Group>
          </Stack>
        </Panel>

        <Panel glow className="board-shell chrome-panel">
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Box>
                <Text className="chrome-label eyebrow">Board lanes</Text>
                <Title order={2} className="terminal-heading board-title">
                  {focusedSection ? `${focusedSection} focus mode` : 'Current work'}
                </Title>
              </Box>
              <Group gap="xs">
                <Badge variant="light" color="green">
                  {visibleTasks.length} visible
                </Badge>
                {focusedSection ? (
                  <Badge variant="light" color="gray">
                    focus mode
                  </Badge>
                ) : null}
              </Group>
            </Group>

            <ScrollArea type="auto" scrollbarSize={10} offsetScrollbars>
              <Box className={`board-grid ${focusedSection ? 'board-grid--focused' : ''}`}>
                {visibleSections.map((section) => (
                  <SectionColumn
                    key={section.name}
                    section={section}
                    isFocused={focusedSection === section.name}
                    onToggleFocus={handleToggleFocus}
                    onOpenTask={handleOpenTask}
                    onPriorityChange={handlePriorityChange}
                    onSectionChange={handleSectionChange}
                    onRemoveTask={handleRemoveTask}
                  />
                ))}
              </Box>
            </ScrollArea>
          </Stack>
        </Panel>

        <Drawer
          opened={selectedTask != null}
          onClose={() => setSelectedTaskId(null)}
          position="right"
          title={selectedTask ? stripCodeTicks(selectedTask.title) : 'Task details'}
          size="lg"
          overlayProps={{ backgroundOpacity: 0.35, blur: 2 }}
        >
          {selectedTask ? (
            <Stack gap="md">
              <Group gap="xs">
                <Badge color={priorityTone(selectedTask.priority)} variant="light">
                  {selectedTask.priority}
                </Badge>
                <Badge color="gray" variant="light">
                  {selectedTask.section}
                </Badge>
                {typeof selectedTask.aiAppetite === 'number' ? (
                  <Badge color="gray" variant="default">
                    AI appetite {selectedTask.aiAppetite}%
                  </Badge>
                ) : null}
              </Group>

              <TextInput
                label="Title"
                value={selectedTask.title}
                onChange={(event) => handleTitleChange(selectedTask, event.target.value)}
              />

              <SimpleGrid cols={2} spacing="sm">
                <Select
                  label="Priority"
                  data={prioritySelectData}
                  value={selectedTask.priority}
                  onChange={(value) =>
                    value && handlePriorityChange(selectedTask, value as KanbanPriority)
                  }
                />
                <Select
                  label="Section"
                  data={sectionSelectData}
                  value={selectedTask.section}
                  onChange={(value) =>
                    value && handleSectionChange(selectedTask, value as KanbanSectionName)
                  }
                />
              </SimpleGrid>

              <Divider />

              <Textarea
                label="Why"
                autosize
                minRows={3}
                value={selectedTask.why ?? ''}
                onChange={(event) => handleWhyChange(selectedTask, event.target.value)}
              />

              <Textarea
                label="Outcome"
                autosize
                minRows={3}
                value={selectedTask.outcome ?? ''}
                onChange={(event) => handleOutcomeChange(selectedTask, event.target.value)}
              />

              <TextInput
                label="Source"
                value={selectedTask.source ?? ''}
                onChange={(event) => handleSourceChange(selectedTask, event.target.value)}
              />

              <Textarea
                label="Details"
                description={
                  selectedTask.taskFile
                    ? `Stored in ${selectedTask.taskFile}`
                    : 'A task note file will be created on save.'
                }
                autosize
                minRows={6}
                value={selectedTask.details ?? ''}
                onChange={(event) => handleDetailsChange(selectedTask, event.target.value)}
              />
              {selectedTask.isCustom ? (
                <Group gap="xs">
                  <Button
                    variant="subtle"
                    color="red"
                    leftSection={<Trash2 className="icon-xs" aria-hidden="true" />}
                    onClick={() => handleRemoveTask(selectedTask)}
                  >
                    Remove
                  </Button>
                </Group>
              ) : null}
            </Stack>
          ) : null}
        </Drawer>
      </Stack>
    </Box>
  );
}

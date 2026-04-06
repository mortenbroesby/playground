import '@mantine/core/styles.css';
import { Badge, Group, MantineProvider, Stack, Text, createTheme } from '@mantine/core';
import type { TodoBridge, TodoBridgeSnapshot } from '@playground/types';
import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { getTodoStats, type TodoStats } from './selectors';

type TodoStatsProps = {
  bridge: TodoBridge;
};

const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
});

const TodoStatsApp = ({ bridge }: TodoStatsProps) => {
  const [stats, setStats] = useState<TodoStats>(() => getTodoStats(bridge.getSnapshot().todos));
  const [version, setVersion] = useState(() => bridge.getSnapshot().version);

  useEffect(() => {
    const unsubscribe = bridge.subscribe((snapshot: TodoBridgeSnapshot) => {
      setStats(getTodoStats(snapshot.todos));
      setVersion(snapshot.version);
    });

    return unsubscribe;
  }, [bridge]);

  const completionRate = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Owned by Todo Stats micro frontend.
      </Text>
      <Group>
        <Badge color="blue" variant="light">
          Total: {stats.total}
        </Badge>
        <Badge color="teal" variant="light">
          Completed: {stats.completed}
        </Badge>
        <Badge color="orange" variant="light">
          Remaining: {stats.remaining}
        </Badge>
        <Badge color="grape" variant="light">
          Completion: {completionRate}%
        </Badge>
        <Badge color="gray" variant="outline">
          Version: {version}
        </Badge>
      </Group>
    </Stack>
  );
};

export const mount = (target: HTMLElement, options: { bridge: TodoBridge }) => {
  let root: Root | null = createRoot(target);
  root.render(
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <TodoStatsApp bridge={options.bridge} />
    </MantineProvider>
  );

  return () => {
    root?.unmount();
    root = null;
  };
};

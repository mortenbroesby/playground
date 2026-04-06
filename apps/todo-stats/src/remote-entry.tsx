import '@mantine/core/styles.css';
import { Badge, Group, Stack, Text } from '@mantine/core';
import type { TodoBridge, TodoBridgeSnapshot } from '@playground/types';
import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { getTodoStats, type TodoStats } from './selectors';

type TodoStatsProps = {
  bridge: TodoBridge;
};

const TodoStatsApp = ({ bridge }: TodoStatsProps) => {
  const [stats, setStats] = useState<TodoStats>(() => getTodoStats(bridge.getSnapshot().todos));

  useEffect(() => {
    const unsubscribe = bridge.subscribe((snapshot: TodoBridgeSnapshot) => {
      setStats(getTodoStats(snapshot.todos));
    });

    return unsubscribe;
  }, [bridge]);

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
      </Group>
    </Stack>
  );
};

export const mount = (target: HTMLElement, options: { bridge: TodoBridge }) => {
  let root: Root | null = createRoot(target);
  root.render(<TodoStatsApp bridge={options.bridge} />);

  return () => {
    root?.unmount();
    root = null;
  };
};

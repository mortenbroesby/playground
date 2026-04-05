import { useEffect, useMemo, useState } from 'react';
import { Card, Group, Stack, Text, Title } from '@mantine/core';
import type { Todo, TodoBridge } from '@playground/types';

type Props = {
  bridge: TodoBridge;
};

export function TodoStatsApp({ bridge }: Props) {
  const [todos, setTodos] = useState<Todo[]>(bridge.getSnapshot().todos);

  useEffect(() => bridge.subscribe((snapshot) => setTodos(snapshot.todos)), [bridge]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((todo) => todo.completed).length;

    return {
      total,
      completed,
      remaining: total - completed,
    };
  }, [todos]);

  return (
    <Stack>
      <Title order={3}>Stats</Title>
      <Group>
        <Card withBorder>
          <Text size="sm" c="dimmed">
            Total
          </Text>
          <Text fw={700}>{stats.total}</Text>
        </Card>
        <Card withBorder>
          <Text size="sm" c="dimmed">
            Completed
          </Text>
          <Text fw={700}>{stats.completed}</Text>
        </Card>
        <Card withBorder>
          <Text size="sm" c="dimmed">
            Remaining
          </Text>
          <Text fw={700}>{stats.remaining}</Text>
        </Card>
      </Group>
    </Stack>
  );
}

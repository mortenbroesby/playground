'use client';

import { Alert, Button, Card, Code, Group, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import type { TodoBridge, TodoBridgeSnapshot } from '@playground/types';

type TodoDebugPanelProps = {
  bridge: TodoBridge;
  onReloadChildApps: () => void;
};

export function TodoDebugPanel({ bridge, onReloadChildApps }: TodoDebugPanelProps) {
  const [snapshot, setSnapshot] = useState<TodoBridgeSnapshot>(() => bridge.getSnapshot());

  useEffect(() => bridge.subscribe(setSnapshot), [bridge]);

  const clearTodos = () => {
    const todos = bridge.getSnapshot().todos;

    todos.forEach((todo) => {
      const event = {
        type: 'todo:deleted' as const,
        payload: {
          id: todo.id
        }
      };

      console.log('[host-debug] publish', event);
      bridge.publish(event);
    });
  };

  const reloadChildApps = () => {
    console.log('[host-debug] reload-child-apps');
    onReloadChildApps();
  };

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Alert color="yellow" variant="light" title="Diagnostics only">
          <Text size="sm">Barebones host controls for bridge cleanup and remote remounts.</Text>
        </Alert>

        <Group>
          <Button variant="light" color="red" onClick={clearTodos} disabled={snapshot.todos.length === 0}>
            Remove all todos
          </Button>
          <Button variant="light" onClick={reloadChildApps}>
            Reload child apps
          </Button>
        </Group>

        <Text size="sm" c="dimmed">
          version <Code>{snapshot.version}</Code> · todos <Code>{snapshot.todos.length}</Code>
        </Text>
      </Stack>
    </Card>
  );
}

'use client';

import { Alert, Badge, Button, Card, Code, Group, Stack, Text, TextInput } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';

import type { TodoBridge, TodoBridgeSnapshot } from '@playground/types';

type TodoDebugPanelProps = {
  bridge: TodoBridge;
};

export function TodoDebugPanel({ bridge }: TodoDebugPanelProps) {
  const [title, setTitle] = useState('');
  const [snapshot, setSnapshot] = useState<TodoBridgeSnapshot>(() => bridge.getSnapshot());

  useEffect(() => bridge.subscribe(setSnapshot), [bridge]);

  const firstTodo = snapshot.todos[0];
  const topTitles = useMemo(() => snapshot.todos.slice(0, 3).map((todo) => todo.title), [snapshot.todos]);

  const createTodo = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const event = {
      type: 'todo:created' as const,
      payload: {
        id: crypto.randomUUID(),
        title: trimmedTitle
      }
    };

    console.log('[host-debug] publish', event);
    bridge.publish(event);
    setTitle('');
  };

  const toggleFirstTodo = () => {
    if (!firstTodo) {
      return;
    }

    const event = {
      type: 'todo:toggled' as const,
      payload: {
        id: firstTodo.id
      }
    };

    console.log('[host-debug] publish', event);
    bridge.publish(event);
  };

  const deleteFirstTodo = () => {
    if (!firstTodo) {
      return;
    }

    const event = {
      type: 'todo:deleted' as const,
      payload: {
        id: firstTodo.id
      }
    };

    console.log('[host-debug] publish', event);
    bridge.publish(event);
  };

  return (
    <Card withBorder radius="md" p="md" bg="gray.0">
      <Stack gap="md">
        <Alert color="yellow" variant="light" title="Diagnostics only">
          <Text size="sm">Host debug controls for bridge events and live snapshot inspection.</Text>
        </Alert>

        <Group justify="space-between" align="center">
          <Text fw={600}>Todo bridge debug panel</Text>
          <Badge variant="light" color="gray">
            host tool
          </Badge>
        </Group>

        <Group align="end" wrap="nowrap">
          <TextInput
            label="Emit todo:created"
            placeholder="Add a debug todo title"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={createTodo}>Publish created</Button>
        </Group>

        <Group>
          <Button onClick={toggleFirstTodo} variant="light" disabled={!firstTodo}>
            Toggle first todo
          </Button>
          <Button onClick={deleteFirstTodo} color="red" variant="light" disabled={!firstTodo}>
            Delete first todo
          </Button>
        </Group>

        <Stack gap={4}>
          <Text size="sm">
            version: <Code>{snapshot.version}</Code>
          </Text>
          <Text size="sm">
            total todos: <Code>{snapshot.todos.length}</Code>
          </Text>
          <Text size="sm">
            titles: <Code>{topTitles.length > 0 ? topTitles.join(' | ') : 'none'}</Code>
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}

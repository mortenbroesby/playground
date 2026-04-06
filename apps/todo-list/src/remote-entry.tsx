import '@mantine/core/styles.css';
import { ActionIcon, Checkbox, Group, List, Stack, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { Todo, TodoBridge, TodoBridgeSnapshot } from '@playground/types';
import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { sortTodos } from './selectors';

type TodoListProps = {
  bridge: TodoBridge;
};

const TodoListApp = ({ bridge }: TodoListProps) => {
  const [todos, setTodos] = useState<Todo[]>(bridge.getSnapshot().todos);

  useEffect(() => {
    const unsubscribe = bridge.subscribe((snapshot: TodoBridgeSnapshot) => {
      setTodos(sortTodos(snapshot.todos));
    });

    return unsubscribe;
  }, [bridge]);

  if (todos.length === 0) {
    return (
      <Stack gap={4}>
        <Text size="sm" c="dimmed">
          Owned by Todo List micro frontend.
        </Text>
        <Text c="dimmed">No todos yet. Add one from the input panel.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Owned by Todo List micro frontend.
      </Text>
      <List spacing="sm" listStyleType="none">
        {todos.map((todo) => (
          <List.Item key={todo.id}>
            <Group justify="space-between" wrap="nowrap">
              <Checkbox
                label={todo.title}
                checked={todo.completed}
                onChange={() => bridge.publish({ type: 'todo:toggled', payload: { id: todo.id } })}
              />
              <ActionIcon
                aria-label={`Delete ${todo.title}`}
                variant="light"
                color="red"
                onClick={() => bridge.publish({ type: 'todo:deleted', payload: { id: todo.id } })}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </List.Item>
        ))}
      </List>
    </Stack>
  );
};

export const mount = (target: HTMLElement, options: { bridge: TodoBridge }) => {
  let root: Root | null = createRoot(target);
  root.render(<TodoListApp bridge={options.bridge} />);

  return () => {
    root?.unmount();
    root = null;
  };
};

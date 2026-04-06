import '@mantine/core/styles.css';
import { ActionIcon, Button, Checkbox, Group, List, MantineProvider, Stack, Text, createTheme } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { Todo, TodoBridge, TodoBridgeSnapshot } from '@playground/types';
import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { sortTodos } from './selectors';

type TodoListProps = {
  bridge: TodoBridge;
};

const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
});

const TodoListApp = ({ bridge }: TodoListProps) => {
  const [todos, setTodos] = useState<Todo[]>(bridge.getSnapshot().todos);

  useEffect(() => {
    const unsubscribe = bridge.subscribe((snapshot: TodoBridgeSnapshot) => {
      setTodos(sortTodos(snapshot.todos));
    });

    return unsubscribe;
  }, [bridge]);

  const toggleAll = () => {
    todos.forEach((todo) => {
      if (!todo.completed) {
        bridge.publish({ type: 'todo:toggled', payload: { id: todo.id } });
      }
    });
  };

  const clearCompleted = () => {
    todos.forEach((todo) => {
      if (todo.completed) {
        bridge.publish({ type: 'todo:deleted', payload: { id: todo.id } });
      }
    });
  };

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
      <Group>
        <Button variant="light" size="xs" onClick={toggleAll}>
          Complete all
        </Button>
        <Button variant="light" color="red" size="xs" onClick={clearCompleted}>
          Clear completed
        </Button>
      </Group>
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
  root.render(
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <TodoListApp bridge={options.bridge} />
    </MantineProvider>
  );

  return () => {
    root?.unmount();
    root = null;
  };
};

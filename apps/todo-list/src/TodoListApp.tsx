import { useEffect, useState } from 'react';
import { ActionIcon, Card, Checkbox, Group, Stack, Text, Title } from '@mantine/core';
import type { Todo, TodoBridge } from '@playground/types';

type Props = {
  bridge: TodoBridge;
};

export function TodoListApp({ bridge }: Props) {
  const [todos, setTodos] = useState<Todo[]>(bridge.getSnapshot().todos);

  useEffect(() => bridge.subscribe((snapshot) => setTodos(snapshot.todos)), [bridge]);

  return (
    <Stack>
      <Title order={3}>Todo list</Title>
      <Stack>
        {todos.length === 0 ? (
          <Card withBorder>
            <Text c="dimmed">No todos yet. Add one from the input micro frontend.</Text>
          </Card>
        ) : (
          todos.map((todo) => (
            <Card withBorder key={todo.id}>
              <Group justify="space-between">
                <Checkbox
                  checked={todo.completed}
                  label={todo.title}
                  onChange={() => bridge.publish({ type: 'todo:toggled', payload: { id: todo.id } })}
                />
                <ActionIcon
                  color="red"
                  variant="light"
                  aria-label={`Delete ${todo.title}`}
                  onClick={() => bridge.publish({ type: 'todo:deleted', payload: { id: todo.id } })}
                >
                  ✕
                </ActionIcon>
              </Group>
            </Card>
          ))
        )}
      </Stack>
    </Stack>
  );
}

import { useState } from 'react';
import { Button, Group, Stack, TextInput, Title } from '@mantine/core';
import type { TodoBridge } from '@playground/types';

type Props = {
  bridge: TodoBridge;
};

export function TodoInputApp({ bridge }: Props) {
  const [title, setTitle] = useState('');

  const createTodo = () => {
    const value = title.trim();
    if (!value) {
      return;
    }

    bridge.publish({ type: 'todo:created', payload: { title: value } });
    setTitle('');
  };

  return (
    <Stack>
      <Title order={3}>Create todo</Title>
      <Group align="end">
        <TextInput
          placeholder="Describe a task"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          flex={1}
          aria-label="Todo title"
        />
        <Button onClick={createTodo}>Add</Button>
      </Group>
    </Stack>
  );
}

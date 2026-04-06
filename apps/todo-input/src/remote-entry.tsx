import '@mantine/core/styles.css';
import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { createRoot, type Root } from 'react-dom/client';
import { useState, type FormEvent } from 'react';
import type { TodoBridge } from '@playground/types';

import { createTodoId, normalizeTitle } from './utils';

type InputAppProps = {
  bridge: TodoBridge;
};

const InputApp = ({ bridge }: InputAppProps) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = normalizeTitle(value);

    if (!title) {
      setError('Please provide a todo title.');
      return;
    }

    bridge.publish({
      type: 'todo:created',
      payload: {
        id: createTodoId(),
        title
      }
    });

    setValue('');
    setError(null);
  };

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Owned by Todo Input micro frontend.
        </Text>

        <Group align="start">
          <TextInput
            flex={1}
            placeholder="Write a task"
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            error={error}
            aria-label="todo title"
          />
          <Button type="submit">Add</Button>
        </Group>
      </Stack>
    </form>
  );
};

export const mount = (target: HTMLElement, options: { bridge: TodoBridge }) => {
  let root: Root | null = createRoot(target);
  root.render(<InputApp bridge={options.bridge} />);

  return () => {
    root?.unmount();
    root = null;
  };
};

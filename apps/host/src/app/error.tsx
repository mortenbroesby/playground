'use client';

import { Alert, Button, Stack, Text, Title } from '@mantine/core';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <Stack p="lg">
      <Title order={2}>Shell error boundary</Title>
      <Alert color="red" title="The orchestrator encountered an unexpected error.">
        <Text size="sm">{error.message}</Text>
      </Alert>
      <Button onClick={reset} w="fit-content">
        Retry route
      </Button>
    </Stack>
  );
}

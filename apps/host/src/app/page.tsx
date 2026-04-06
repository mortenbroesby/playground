'use client';

import { AppShell, Badge, Container, Group, Stack, Text, Title } from '@mantine/core';

import { TodoOrchestrator } from '@/components/todo-orchestrator';

export default function HomePage() {
  return (
    <AppShell
      header={{ height: 72 }}
      padding="md"
      styles={{
        main: {
          background: 'linear-gradient(180deg, rgba(17,24,39,1) 0%, rgba(10,10,18,1) 100%)',
          minHeight: '100vh'
        }
      }}
    >
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between">
          <Stack gap={0}>
            <Title order={3}>Todo Platform Shell</Title>
            <Text size="xs" c="dimmed">
              Next.js host orchestrating independent micro frontends
            </Text>
          </Stack>
          <Badge variant="light" color="teal">
            Runtime integration
          </Badge>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" py="lg">
          <Stack gap="lg">
            <Stack gap="xs" maw={700}>
              <Title order={1}>Micro frontend architecture demo</Title>
              <Text c="dimmed">
                Shell owns routing, layout, and resilience boundaries while feature teams ship independently deployable
                modules.
              </Text>
            </Stack>

            <TodoOrchestrator />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

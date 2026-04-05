'use client';

import { useMemo } from 'react';
import { AppShell, Badge, Container, Group, Stack, Text, Title } from '@mantine/core';

import { MicroFrontendSlot } from '@/components/MicroFrontendSlot';
import { createTodoBridge } from '@/lib/createTodoBridge';
import { remotes } from '@/lib/remotes';

export function TodoOrchestratorPage() {
  const bridge = useMemo(() => createTodoBridge(), []);

  return (
    <AppShell header={{ height: 70 }} padding="md">
      <AppShell.Header>
        <Group px="md" h="100%" justify="space-between">
          <Title order={3}>Next.js Orchestrator Shell</Title>
          <Badge color="teal" variant="light">
            Runtime composition
          </Badge>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg">
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={1}>Micro frontend todo dashboard</Title>
              <Text c="dimmed">
                Host-managed typed bridge, independent feature ownership, and resilient runtime integration.
              </Text>
            </Stack>

            <MicroFrontendSlot
              title={remotes['todo-input'].name}
              owner={remotes['todo-input'].owner}
              remoteUrl={remotes['todo-input'].url}
              bridge={bridge}
            />

            <MicroFrontendSlot
              title={remotes['todo-list'].name}
              owner={remotes['todo-list'].owner}
              remoteUrl={remotes['todo-list'].url}
              bridge={bridge}
            />

            <MicroFrontendSlot
              title={remotes['todo-stats'].name}
              owner={remotes['todo-stats'].owner}
              remoteUrl={remotes['todo-stats'].url}
              bridge={bridge}
            />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

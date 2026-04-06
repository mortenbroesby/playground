'use client';

import { Badge, Divider, Grid, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useMemo, useState } from 'react';

import { RemoteSlot } from '@/components/remote-slot';
import { TodoDebugPanel } from '@/components/todo-debug-panel';
import { compositionMode, todoRemotes } from '@/lib/remotes';
import { createTodoBridge } from '@/lib/todo-bridge';

export function TodoOrchestrator() {
  const bridge = useMemo(() => createTodoBridge(), []);
  const [remoteRenderVersion, setRemoteRenderVersion] = useState(0);

  const reloadChildApps = () => {
    setRemoteRenderVersion((value) => value + 1);
  };

  return (
    <Paper radius="lg" p="lg" withBorder>
      <Stack gap="lg">
        <Group justify="space-between" align="start">
          <Stack gap={0}>
            <Title order={2}>Runtime composition</Title>
            <Text c="dimmed" size="sm">
              Each card below is owned by a separate micro frontend loaded at runtime.
            </Text>
          </Stack>
          <Badge variant="light" color="violet">
            Host-managed state bridge
          </Badge>
        </Group>

        <Divider />

        <TodoDebugPanel bridge={bridge} onReloadChildApps={reloadChildApps} />

        <Grid>
          {todoRemotes.map((remote) => (
            <Grid.Col
              key={`${remote.id}:${remoteRenderVersion}`}
              span={{ base: 12, md: remote.id === 'todo-list' ? 12 : 6 }}
            >
              <RemoteSlot
                bridge={bridge}
                id={remote.id}
                compositionMode={compositionMode}
                runtimeUrl={remote.runtimeUrl}
                name={remote.name}
                description={remote.description}
              />
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    </Paper>
  );
}

'use client';

import { Alert, Card, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import type { TodoBridge } from '@playground/types';

type RemoteModule = {
  mount: (target: HTMLElement, options: { bridge: TodoBridge }) => (() => void) | void;
};

type RemoteSlotProps = {
  remoteEntryUrl: string;
  name: string;
  description: string;
  bridge: TodoBridge;
};

const loadRemoteModule = async (remoteEntryUrl: string): Promise<RemoteModule> => {
  const remote = (await import(/* webpackIgnore: true */ remoteEntryUrl)) as Partial<RemoteModule>;

  if (!remote.mount) {
    throw new Error(`Remote ${remoteEntryUrl} does not expose a mount() function.`);
  }

  return remote as RemoteModule;
};

export function RemoteSlot({ remoteEntryUrl, name, description, bridge }: RemoteSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const teardownRef = useRef<(() => void) | void>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const mountRemote = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const remoteModule = await loadRemoteModule(remoteEntryUrl);

        if (!isMounted || !containerRef.current) {
          return;
        }

        teardownRef.current = remoteModule.mount(containerRef.current, { bridge });
      } catch (mountError) {
        setError(mountError instanceof Error ? mountError.message : 'Unknown remote load failure.');
      } finally {
        setIsLoading(false);
      }
    };

    mountRemote();

    return () => {
      isMounted = false;
      if (typeof teardownRef.current === 'function') {
        teardownRef.current();
      }
    };
  }, [bridge, remoteEntryUrl]);

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="sm">
        <Stack gap={2}>
          <Title order={4}>{name}</Title>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
          <Text size="xs" ff="monospace" c="dimmed">
            {remoteEntryUrl}
          </Text>
        </Stack>

        {isLoading ? (
          <Alert color="blue" variant="light" title="Loading micro frontend">
            <Loader size="sm" mr="xs" />
            Waiting for runtime module to mount.
          </Alert>
        ) : null}

        {error ? (
          <Alert color="red" variant="light" title="Micro frontend unavailable">
            {error}
          </Alert>
        ) : null}

        <div ref={containerRef} data-remote-slot={name} />
      </Stack>
    </Card>
  );
}

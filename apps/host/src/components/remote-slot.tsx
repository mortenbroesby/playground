'use client';

import { Alert, Card, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import type { TodoBridge } from '@playground/types';

import { loadInjectedRemote, type InjectedRemoteId } from '@/lib/injected-remotes';
import type { CompositionMode } from '@/lib/remotes';

type RemoteModule = {
  mount: (target: HTMLElement, options: { bridge: TodoBridge }) => (() => void) | void;
};

type RemoteSlotProps = {
  id: InjectedRemoteId;
  compositionMode: CompositionMode;
  runtimeUrl: string;
  name: string;
  description: string;
  bridge: TodoBridge;
};

const loadRuntimeRemote = async (runtimeUrl: string): Promise<RemoteModule> => {
  const remote = (await import(/* webpackIgnore: true */ runtimeUrl)) as Partial<RemoteModule>;

  if (!remote.mount) {
    throw new Error(`Remote ${runtimeUrl} does not expose a mount() function.`);
  }

  return remote as RemoteModule;
};

export function RemoteSlot({ id, compositionMode, runtimeUrl, name, description, bridge }: RemoteSlotProps) {
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

        const remoteModule =
          compositionMode === 'injected' ? await loadInjectedRemote(id) : await loadRuntimeRemote(runtimeUrl);

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
  }, [bridge, compositionMode, id, runtimeUrl]);

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="sm">
        <Stack gap={2}>
          <Title order={4}>{name}</Title>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
          <Text size="xs" ff="monospace" c="dimmed">
            {compositionMode === 'injected' ? `injected:${id}` : runtimeUrl}
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

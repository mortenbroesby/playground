'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Card, Loader, Stack, Text, Title } from '@mantine/core';
import type { MicroFrontendModule, TodoBridge } from '@playground/types';

type Props = {
  title: string;
  owner: string;
  remoteUrl: string;
  bridge: TodoBridge;
};

export function MicroFrontendSlot({ title, owner, remoteUrl, bridge }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const load = async () => {
      if (!hostRef.current) {
        return;
      }

      try {
        setStatus('loading');
        setErrorMessage(undefined);

        const module = (await import(/* webpackIgnore: true */ remoteUrl)) as MicroFrontendModule;
        const mounted = module.mount(hostRef.current, { bridge });

        if (cancelled) {
          mounted.unmount();
          return;
        }

        cleanup = () => mounted.unmount();
        setStatus('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown runtime error');
      }
    };

    load();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [bridge, remoteUrl]);

  return (
    <Card withBorder radius="md" p="lg">
      <Stack>
        <Stack gap={2}>
          <Title order={4}>{title}</Title>
          <Text size="xs" c="dimmed">
            Owned by {owner}
          </Text>
        </Stack>

        {status === 'loading' ? <Loader size="sm" aria-label={`${title} loading`} /> : null}

        {status === 'error' ? (
          <Alert color="red" title="Micro frontend unavailable">
            {errorMessage}
          </Alert>
        ) : null}

        <div ref={hostRef} />
      </Stack>
    </Card>
  );
}

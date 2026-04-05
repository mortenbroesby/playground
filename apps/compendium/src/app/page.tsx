import { Badge, Button, Card, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconRocket } from '@tabler/icons-react';

import { remoteApps } from '@/data/remotes';

export default function HomePage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack gap="xs" maw={700}>
          <Badge variant="light" color="cyan" w="fit-content">
            Compendium
          </Badge>
          <Title order={1}>Micro frontend orchestrator</Title>
          <Text c="dimmed" size="lg">
            Central shell for routing, discovery, and governance of React-based workspace apps.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" aria-label="Registered workspace applications">
          {remoteApps.map((remote) => {
            const ready = remote.status === 'ready';

            return (
              <Card key={remote.id} withBorder radius="lg" p="lg" shadow="sm">
                <Stack gap="md">
                  <Group justify="space-between" align="start" wrap="nowrap">
                    <Stack gap={4}>
                      <Title order={3}>{remote.name}</Title>
                      <Text c="dimmed" size="sm">
                        {remote.description}
                      </Text>
                    </Stack>
                    <Badge color={ready ? 'teal' : 'orange'} variant="light">
                      {remote.status}
                    </Badge>
                  </Group>

                  <Group gap="xl">
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        Route
                      </Text>
                      <Text ff="monospace" size="sm">
                        {remote.route}
                      </Text>
                    </Stack>

                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        Owner
                      </Text>
                      <Text size="sm">{remote.owner}</Text>
                    </Stack>
                  </Group>

                  <Button
                    leftSection={<IconRocket size={16} />}
                    variant={ready ? 'filled' : 'light'}
                    disabled={!ready}
                    w="fit-content"
                  >
                    {ready ? 'Launch app' : 'Awaiting integration'}
                  </Button>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { click, renderApp, typeInto, waitForText } from './test-utils';

const initialMarkdown = `# Kanban

Intro.

## Backlog

- [ ] \`P1\` First task
  AI Appetite: 70%
  Why: stay sharp

## Ready

- [ ] \`P2\` Second task
  AI Appetite: 55%
  Outcome: keep moving

## In Progress

## Done
`;

const updatedMarkdown = `# Kanban

Intro.

## In Progress

- [ ] \`P0\` Incoming task
  AI Appetite: 90%
  Why: live reload

## Ready

## Backlog

## Done
`;

describe('admin app integration', () => {
  beforeEach(() => {
    let currentMarkdown = initialMarkdown;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === '/api/kanban' && (!init?.method || init.method === 'GET')) {
          return {
            ok: true,
            json: async () => ({ markdown: currentMarkdown }),
          } as Response;
        }

        if (url === '/api/kanban' && init?.method === 'POST') {
          const body = JSON.parse(String(init.body)) as { markdown: string };
          currentMarkdown = body.markdown;
          return {
            ok: true,
            json: async () => ({ ok: true }),
          } as Response;
        }

        throw new Error(`Unexpected fetch ${url}`);
      }),
    );

    Object.assign(globalThis, {
      __setAdminMarkdown(next: string) {
        currentMarkdown = next;
      },
    });
  });

  it('reloads the board when the kanban update event fires', async () => {
    await renderApp();

    await waitForText('First task');
    await waitForText('Auto-saves to KANBAN.md while you work.');

    (globalThis as typeof globalThis & { __setAdminMarkdown: (value: string) => void }).__setAdminMarkdown(
      updatedMarkdown,
    );

    await act(async () => {
      window.dispatchEvent(new Event('kanban:updated'));
      await Promise.resolve();
    });

    await waitForText('Incoming task');
  });

  it('adds an idea and auto-saves it back to the kanban api', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;

    await renderApp();
    await waitForText('First task');

    await typeInto(
      document.querySelector<HTMLInputElement>('input[placeholder="Add a new idea or follow-up task"]')!,
      'Fresh board idea',
    );
    const addTaskButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Add task'),
    );

    if (!addTaskButton) {
      throw new Error('Missing Add task button');
    }

    await click(addTaskButton);
    await waitForText('Fresh board idea');

    const postCall = await vi.waitFor(() =>
      fetchMock.mock.calls
        .filter(([url, init]) => String(url) === '/api/kanban' && init?.method === 'POST')
        .find(([, init]) => String(init?.body).includes('Fresh board idea')),
    );

    expect(postCall).toBeTruthy();
    expect(String(postCall?.[1]?.body)).toContain('Fresh board idea');
    expect(String(postCall?.[1]?.body)).toContain('`P2` Fresh board idea');
    expect(String(postCall?.[1]?.body)).toContain('AI Appetite: 70%');
    expect(String(postCall?.[1]?.body)).toContain('## Ready');
    expect(String(postCall?.[1]?.body)).not.toContain('[ ] `P2` Fresh board idea');
  });

  it('keeps add-task details collapsed until explicitly expanded', async () => {
    await renderApp();
    await waitForText('First task');

    const detailsRegion = document.querySelector<HTMLElement>('.draft-details');

    if (!detailsRegion) {
      throw new Error('Missing draft details region');
    }

    expect(detailsRegion.getAttribute('data-expanded')).toBe('false');

    const toggleButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Add details'),
    );

    if (!toggleButton) {
      throw new Error('Missing Add details button');
    }

    await click(toggleButton);

    expect(detailsRegion.getAttribute('data-expanded')).toBe('true');
    expect(document.body.textContent).toContain('Hide details');
  });

  it('edits task details through the drawer', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;

    await renderApp();
    await waitForText('First task');

    const detailsButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Details'),
    );

    if (!detailsButton) {
      throw new Error('Missing Details button');
    }

    await click(detailsButton);

    const titleInput = document.querySelector<HTMLInputElement>('input[value="First task"]');
    const whyTextarea = Array.from(document.querySelectorAll<HTMLTextAreaElement>('textarea')).find(
      (textarea) => textarea.value === 'stay sharp',
    );

    if (!titleInput || !whyTextarea) {
      throw new Error('Missing drawer fields');
    }

    await typeInto(titleInput, 'First task updated');
    await typeInto(whyTextarea, 'clarified in drawer');

    const postCall = await vi.waitFor(() =>
      fetchMock.mock.calls
        .filter(([url, init]) => String(url) === '/api/kanban' && init?.method === 'POST')
        .find(
          ([, init]) =>
            String(init?.body).includes('First task updated') &&
            String(init?.body).includes('Why: clarified in drawer'),
        ),
    );

    expect(postCall).toBeTruthy();
    expect(String(postCall?.[1]?.body)).toContain('First task updated');
    expect(String(postCall?.[1]?.body)).toContain('Why: clarified in drawer');
  });
});

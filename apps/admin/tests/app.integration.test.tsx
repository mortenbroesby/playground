import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { click, renderApp, typeInto, waitForText } from './test-utils';

function createDocument(title = 'First task') {
  return {
    sections: [
      {
        name: 'Backlog',
        tasks: [
          {
            id: 'first-task',
            title,
            priority: 'P1',
            section: 'Backlog',
            aiAppetite: 70,
            why: 'stay sharp',
            taskFile: 'tasks/first-task.md',
          },
        ],
      },
      {
        name: 'Ready',
        tasks: [
          {
            id: 'second-task',
            title: 'Second task',
            priority: 'P2',
            section: 'Ready',
            aiAppetite: 55,
            outcome: 'keep moving',
            taskFile: 'tasks/second-task.md',
          },
        ],
      },
      { name: 'In Progress', tasks: [] },
      { name: 'Done', tasks: [] },
    ],
  };
}

describe('admin app integration', () => {
  beforeEach(() => {
    let currentDocument = createDocument();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === '/api/kanban' && (!init?.method || init.method === 'GET')) {
          return {
            ok: true,
            json: async () => ({ document: currentDocument }),
          } as Response;
        }

        if (url === '/api/kanban' && init?.method === 'POST') {
          const body = JSON.parse(String(init.body)) as { document: typeof currentDocument };
          currentDocument = body.document;
          return {
            ok: true,
            json: async () => ({ ok: true }),
          } as Response;
        }

        throw new Error(`Unexpected fetch ${url}`);
      }),
    );

    Object.assign(globalThis, {
      __setAdminDocument(next: typeof currentDocument) {
        currentDocument = next;
      },
    });
  });

  it('reloads the board when the kanban update event fires', async () => {
    await renderApp();

    await waitForText('First task');
    await waitForText('Auto-saves the board index and linked task notes while you work.');

    (
      globalThis as typeof globalThis & {
        __setAdminDocument: (value: ReturnType<typeof createDocument>) => void;
      }
    ).__setAdminDocument({
      sections: [
        { name: 'Backlog', tasks: [] },
        { name: 'Ready', tasks: [] },
        {
          name: 'In Progress',
          tasks: [
            {
              id: 'incoming-task',
              title: 'Incoming task',
              priority: 'P0',
              section: 'In Progress',
              aiAppetite: 90,
              why: 'live reload',
              taskFile: 'tasks/incoming-task.md',
            },
          ],
        },
        { name: 'Done', tasks: [] },
      ],
    });

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
    expect(String(postCall?.[1]?.body)).toContain('"isCustom":true');
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
            String(init?.body).includes('clarified in drawer'),
        ),
    );

    expect(postCall).toBeTruthy();
  });
});

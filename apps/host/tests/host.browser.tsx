import type {} from '@vitest/browser/matchers';
import { page, userEvent } from '@vitest/browser/context';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HostApp } from '../src/host-app';
import { createAppRouter } from '../src/routes';

let root: Root | null = null;

async function renderPath(path: string) {
  document.body.innerHTML = '<div id="root"></div>';
  const container = document.getElementById('root');

  if (!container) {
    throw new Error('Missing root container');
  }

  const router = createAppRouter({ initialEntries: [path] });
  root = createRoot(container);

  await act(async () => {
    root!.render(<HostApp router={router} />);
    await Promise.resolve();
  });

  return { router };
}

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
    true;
  localStorage.clear();
});

afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
    root?.unmount();
    await Promise.resolve();
  });

  root = null;
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('host browser routes', () => {
  it('renders the todo workspace and syncs host and microfrontend state', async () => {
    await renderPath('/todo');

    await expect.element(page.getByTestId('host-controls')).toBeVisible();
    await expect.element(page.getByTestId('todo-app-container')).toBeVisible();
    await expect.element(page.getByTestId('last-event')).toHaveTextContent(
      'Todo app mounted and reported ready',
    );

    await act(async () => {
      await userEvent.click(page.getByTestId('seed-todos'));
    });

    await expect.element(page.getByTestId('host-total-count')).toHaveTextContent('3');
    await expect.element(page.getByTestId('host-done-count')).toHaveTextContent('1');
    await expect.element(page.getByTestId('host-open-count')).toHaveTextContent('2');

    await expect.element(page.getByTestId('todo-total-count')).toHaveTextContent('3');
    await expect.element(page.getByTestId('todo-done-count')).toHaveTextContent('1');
    await expect.element(page.getByTestId('todo-remaining-count')).toHaveTextContent('2');
    await expect.element(page.getByText('Refactor microfrontend contract')).toBeVisible();

    await act(async () => {
      await userEvent.click(page.getByLabelText('Toggle Verify injected composition path'));
    });

    await expect.element(page.getByTestId('last-event')).toHaveTextContent(
      'Todo app toggled "Verify injected composition path"',
    );
    await expect.element(page.getByTestId('host-done-count')).toHaveTextContent('2');
    await expect.element(page.getByTestId('host-open-count')).toHaveTextContent('1');
    await expect.element(page.getByTestId('todo-done-count')).toHaveTextContent('2');
    await expect.element(page.getByTestId('todo-remaining-count')).toHaveTextContent('1');

    await act(async () => {
      await userEvent.click(page.getByTestId('clear-todos'));
    });

    await expect.element(page.getByTestId('host-total-count')).toHaveTextContent('0');
    await expect.element(page.getByTestId('host-done-count')).toHaveTextContent('0');
    await expect.element(page.getByTestId('host-open-count')).toHaveTextContent('0');
    await expect.element(page.getByTestId('todo-empty-state')).toBeVisible();
    await expect.element(page.getByTestId('last-event')).toHaveTextContent('Host cleared all todos');
  });

  it('renders the uses page and redirects /readme to /uses', async () => {
    const { router } = await renderPath('/readme');

    await expect.element(page.getByTestId('uses-page')).toBeVisible();
    await expect.element(page.getByRole('heading', { name: 'Uses' })).toBeVisible();
    await expect.element(page.getByTestId('uses-updated')).toHaveTextContent('May 30, 2023');
    await expect.element(page.getByRole('heading', { name: 'Cloud services' })).toBeVisible();
    await expect.element(page.getByRole('link', { name: 'Git Lens external' })).toHaveAttribute(
      'href',
      'https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens',
    );
    await expect.element(page.getByTestId('uses-profile-link')).toHaveAttribute(
      'href',
      'https://github.com/mortenbroesby',
    );
    expect(router.state.location.pathname).toBe('/uses');
  });
});

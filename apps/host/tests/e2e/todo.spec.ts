import { expect, test } from '@playwright/test';

test('todo workspace renders and syncs host and microfrontend state', async ({ page }) => {
  await page.goto('/todo');

  await expect(page.getByTestId('host-controls')).toBeVisible();
  await expect(page.getByTestId('todo-app-container')).toBeVisible();
  await expect(page.getByTestId('last-event')).toContainText('reported ready');

  await page.getByTestId('seed-todos').click();

  await expect(page.getByTestId('host-total-count')).toHaveText('3');
  await expect(page.getByTestId('host-done-count')).toHaveText('1');
  await expect(page.getByTestId('host-open-count')).toHaveText('2');

  await expect(page.getByTestId('todo-total-count')).toHaveText('3');
  await expect(page.getByTestId('todo-done-count')).toHaveText('1');
  await expect(page.getByTestId('todo-remaining-count')).toHaveText('2');
  await expect(page.getByText('Refactor microfrontend contract')).toBeVisible();

  await page.getByLabel('Toggle Verify injected composition path').check();

  await expect(page.getByTestId('last-event')).toContainText('toggled "Verify injected composition path"');
  await expect(page.getByTestId('host-done-count')).toHaveText('2');
  await expect(page.getByTestId('host-open-count')).toHaveText('1');
  await expect(page.getByTestId('todo-done-count')).toHaveText('2');
  await expect(page.getByTestId('todo-remaining-count')).toHaveText('1');

  await page.getByTestId('clear-todos').click();

  await expect(page.getByTestId('host-total-count')).toHaveText('0');
  await expect(page.getByTestId('host-done-count')).toHaveText('0');
  await expect(page.getByTestId('host-open-count')).toHaveText('0');
  await expect(page.getByTestId('todo-empty-state')).toBeVisible();
  await expect(page.getByTestId('last-event')).toContainText('cleared all todos');
});

test('readme route renders the repository documentation', async ({ page }) => {
  await page.goto('/readme');

  await expect(page.getByTestId('readme-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'README' })).toBeVisible();
  await expect(page.getByTestId('readme-article')).toContainText(
    'A monorepo playground for experimenting with'
  );
  await expect(page.getByTestId('readme-article')).toContainText('Microfrontends');
});

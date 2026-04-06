import { describe, expect, it, vi } from 'vitest';
import {
  click,
  getByTestId,
  getByText,
  renderRoute,
  typeInto,
  waitForText,
} from './test-utils';

const { mountGameMock } = vi.hoisted(() => ({
  mountGameMock: vi.fn((target: HTMLElement) => {
    target.innerHTML = '<div data-testid="mock-game">Mock game mounted</div>';
    return () => {
      target.innerHTML = '';
    };
  }),
}));

vi.mock('@playground/uplink-game', () => ({
  mount: mountGameMock,
}));

describe('host routes', () => {
  it('renders the todo workspace and syncs host and microfrontend state', async () => {
    await renderRoute('/todo');

    expect(getByTestId('host-controls')).toBeTruthy();
    expect(getByTestId('todo-app-container')).toBeTruthy();
    await waitForText('last-event', 'Todo app mounted and reported ready');

    await click(getByTestId('seed-todos'));

    await vi.waitFor(() => {
      expect(getByTestId('host-total-count').textContent).toContain('3');
      expect(getByTestId('host-done-count').textContent).toContain('1');
      expect(getByTestId('host-open-count').textContent).toContain('2');
      expect(getByTestId('todo-total-count').textContent).toContain('3');
      expect(getByTestId('todo-done-count').textContent).toContain('1');
      expect(getByTestId('todo-remaining-count').textContent).toContain('2');
    });

    expect(getByText('Refactor microfrontend contract')).toBeTruthy();

    await click(document.querySelector<HTMLElement>('[aria-label="Toggle Verify injected composition path"]')!);

    await vi.waitFor(() => {
      expect(getByTestId('last-event').textContent).toContain(
        'Todo app toggled "Verify injected composition path"',
      );
      expect(getByTestId('host-done-count').textContent).toContain('2');
      expect(getByTestId('host-open-count').textContent).toContain('1');
      expect(getByTestId('todo-done-count').textContent).toContain('2');
      expect(getByTestId('todo-remaining-count').textContent).toContain('1');
    });

    await click(getByTestId('clear-todos'));

    await vi.waitFor(() => {
      expect(getByTestId('host-total-count').textContent).toContain('0');
      expect(getByTestId('host-done-count').textContent).toContain('0');
      expect(getByTestId('host-open-count').textContent).toContain('0');
      expect(getByTestId('todo-empty-state')).toBeTruthy();
      expect(getByTestId('last-event').textContent).toContain('Host cleared all todos');
    });
  });

  it('redirects /readme to /about and renders the about page', async () => {
    const { router } = await renderRoute('/readme');

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/about');
      expect(getByTestId('about-page')).toBeTruthy();
      expect(getByTestId('about-bio').textContent).toContain('I build reliable frontend platforms');
    });

    expect(getByText('Morten Broesby-Olsen')).toBeTruthy();
    expect(getByTestId('about-socials')).toBeTruthy();
    expect(getByTestId('about-social-github')).toBeTruthy();
    expect(getByTestId('about-social-linkedin')).toBeTruthy();
    expect(getByTestId('about-social-instagram')).toBeTruthy();
    expect(getByTestId('about-hobbies')).toBeTruthy();
    expect(getByTestId('about-values')).toBeTruthy();
    expect(getByTestId('about-inspirations')).toBeTruthy();
    expect(getByText('Hobbies')).toBeTruthy();

    const githubLink = document.querySelector<HTMLAnchorElement>(
      '[data-testid="about-social-github"]',
    );
    const linkedInLink = document.querySelector<HTMLAnchorElement>(
      '[data-testid="about-social-linkedin"]',
    );
    const instagramLink = document.querySelector<HTMLAnchorElement>(
      '[data-testid="about-social-instagram"]',
    );

    expect(githubLink?.href).toBe('https://github.com/mortenbroesby');
    expect(linkedInLink?.href).toBe('https://www.linkedin.com/in/morten-broesby-olsen/');
    expect(instagramLink?.href).toBe('https://www.instagram.com/mortenbroesby/');
  });

  it('renders the playground route with the signal mesh app', async () => {
    await renderRoute('/playground');

    expect(getByTestId('playground-page')).toBeTruthy();
    expect(getByText('Signal mesh')).toBeTruthy();
    expect(getByText('Visual playground')).toBeTruthy();
    expect(getByText('experiment live')).toBeTruthy();
  });

  it('redirects /uses to /uses/gear and renders the gear page', async () => {
    const { router } = await renderRoute('/uses');

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/uses/gear');
      expect(getByTestId('uses-gear-page')).toBeTruthy();
    });

    expect(getByText('Uses')).toBeTruthy();
    expect(getByText('April 6, 2026')).toBeTruthy();
    expect(getByText('Cloud')).toBeTruthy();

    const profileLink = document.querySelector<HTMLAnchorElement>('a[href="https://github.com/mortenbroesby"]');
    expect(profileLink).not.toBeNull();
  });

  it('renders the system route and lets us search design-system tokens', async () => {
    await renderRoute('/system');

    expect(getByTestId('system-page')).toBeTruthy();
    expect(getByText('Searchable token explorer')).toBeTruthy();
    expect(getByTestId('token-search')).toBeTruthy();
    expect(getByTestId('view-all')).toBeTruthy();
    expect(getByTestId('view-components')).toBeTruthy();
    expect(getByTestId('view-tokens')).toBeTruthy();
    expect(getByTestId('view-utilities')).toBeTruthy();
    expect(getByTestId('components-section')).toBeTruthy();
    expect(getByTestId('tokens-section')).toBeTruthy();
    expect(getByTestId('utilities-section')).toBeTruthy();
    expect(getByTestId('component-button')).toBeTruthy();
    expect(getByTestId('component-panel')).toBeTruthy();
    expect(getByTestId('token-primary')).toBeTruthy();
    expect(getByTestId('token-font-sans')).toBeTruthy();

    await typeInto(getByTestId('token-search') as HTMLInputElement, 'surface');

    await vi.waitFor(() => {
      expect(getByTestId('component-panel')).toBeTruthy();
      expect(document.querySelector('[data-testid="component-button"]')).toBeNull();
      expect(getByTestId('token-surface-0')).toBeTruthy();
      expect(getByTestId('token-surface-3')).toBeTruthy();
      expect(document.querySelector('[data-testid="token-primary"]')).toBeNull();
    });

    await click(getByTestId('view-utilities'));

    await vi.waitFor(() => {
      expect(getByTestId('utilities-section')).toBeTruthy();
      expect(document.querySelector('[data-testid="components-section"]')).toBeNull();
      expect(document.querySelector('[data-testid="tokens-section"]')).toBeNull();
      expect(document.querySelector('[data-testid="component-panel"]')).toBeNull();
      expect(document.querySelector('[data-testid="token-surface-0"]')).toBeNull();
      expect(getByText('.terminal-panel')).toBeTruthy();
    });
  });

  it('renders the game route and mounts the game workspace', async () => {
    await renderRoute('/game');

    expect(getByText('Uplink terminal')).toBeTruthy();
    expect(getByTestId('game-container')).toBeTruthy();

    await vi.waitFor(() => {
      expect(mountGameMock).toHaveBeenCalledTimes(1);
      expect(getByTestId('mock-game')).toBeTruthy();
    });
  });
});

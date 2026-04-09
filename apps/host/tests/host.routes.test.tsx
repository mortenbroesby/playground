import { describe, expect, it, vi } from 'vitest';
import {
  click,
  getByTestId,
  getByText,
  keydown,
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

function getMetaContent(selector: string) {
  return document.head.querySelector<HTMLMetaElement>(selector)?.content ?? null;
}

vi.mock('@playground/uplink-game', () => ({
  mount: mountGameMock,
}));

describe('host routes', () => {
  it('renders the home route as the personal site entry point', async () => {
    await renderRoute('/');

    expect(getByTestId('home-page')).toBeTruthy();
    expect(getByText('Morten Broesby-Olsen')).toBeTruthy();
    expect(getByText('personal site')).toBeTruthy();
    expect(getByText('Read the about page')).toBeTruthy();
    expect(getByText('Open writing')).toBeTruthy();
    expect(document.title).toBe('Morten Broesby-Olsen');
    expect(getMetaContent('meta[name="description"]')).toContain('Frontend architect');
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe(
      'http://localhost:3000/',
    );
  });

  it('renders the writing index with published posts', async () => {
    await renderRoute('/writing');

    expect(getByTestId('writing-page')).toBeTruthy();
    expect(getByText('Writing')).toBeTruthy();
    expect(getByTestId('writing-post-card-steady-interfaces')).toBeTruthy();
    expect(getByTestId('writing-post-card-why-keep-a-playground')).toBeTruthy();
  });

  it('renders a published writing post by slug', async () => {
    await renderRoute('/writing/steady-interfaces');

    expect(getByTestId('writing-post-page')).toBeTruthy();
    expect(getByText('Steady Interfaces for Growing Frontend Systems')).toBeTruthy();
    expect(getByTestId('writing-post-summary').textContent).toContain('understandable');
    expect(getByTestId('writing-post-body').textContent).toContain('calm structures scale better');
  });

  it('renders a not found state for unknown writing slugs', async () => {
    await renderRoute('/writing/missing-post');

    expect(getByTestId('writing-post-not-found')).toBeTruthy();
    expect(getByText('Post not found')).toBeTruthy();
  });

  it('renders the todo workspace and syncs host and microfrontend state', async () => {
    const { router } = await renderRoute('/todo');

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/playground/todo');
    });

    expect(getByTestId('host-controls')).toBeTruthy();
    expect(getByTestId('todo-app-container')).toBeTruthy();
    await waitForText('last-event', 'Todo app mounted and reported ready');

    await click(getByTestId('seed-todos'));

    await vi.waitFor(() => {
      expect(getByTestId('host-total-count').textContent).toContain('3');
      expect(getByTestId('host-done-count').textContent).toContain('0');
      expect(getByTestId('host-open-count').textContent).toContain('3');
      expect(getByTestId('todo-total-count').textContent).toContain('3');
      expect(getByTestId('todo-done-count').textContent).toContain('0');
      expect(getByTestId('todo-remaining-count').textContent).toContain('3');
    });

    expect(getByText('Split host architecture into clearer route modules')).toBeTruthy();
    expect(getByText('Pull remaining ideas from morten.broesby.dk into the site backlog')).toBeTruthy();

    await click(document.querySelector<HTMLElement>('[aria-label="Toggle Verify injected composition path"]')!);

    await vi.waitFor(() => {
      expect(getByTestId('last-event').textContent).toContain(
        'Todo app toggled "Verify injected composition path"',
      );
      expect(getByTestId('host-done-count').textContent).toContain('1');
      expect(getByTestId('host-open-count').textContent).toContain('2');
      expect(getByTestId('todo-done-count').textContent).toContain('1');
      expect(getByTestId('todo-remaining-count').textContent).toContain('2');
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
      expect(getByTestId('about-bio').textContent).toContain('I have spent more than ten years');
    });

    expect(getByText('Morten Broesby-Olsen')).toBeTruthy();
    expect(getByTestId('about-socials')).toBeTruthy();
    expect(getByTestId('about-social-github')).toBeTruthy();
    expect(getByTestId('about-social-linkedin')).toBeTruthy();
    expect(getByTestId('about-social-instagram')).toBeTruthy();
    expect(getByTestId('about-hobbies')).toBeTruthy();
    expect(getByTestId('about-values')).toBeTruthy();
    expect(getByTestId('about-inspirations')).toBeTruthy();
    expect(getByText('Beyond the work')).toBeTruthy();

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

  it('uses the shared public page width on the home route', async () => {
    await renderRoute('/');
    expect(getByTestId('home-page').className).toContain('max-w-4xl');
  });

  it('uses the shared public page width on the about route', async () => {
    await renderRoute('/about');
    expect(getByTestId('about-page').className).toContain('max-w-4xl');
  });

  it('uses the shared public page width on the writing route', async () => {
    await renderRoute('/writing');
    expect(getByTestId('writing-page').className).toContain('max-w-4xl');
  });

  it('uses the shared public page width on the uses route', async () => {
    await renderRoute('/uses');
    expect(getByTestId('uses-page').className).toContain('max-w-4xl');
  });

  it('renders the playground route with the signal mesh app', async () => {
    await renderRoute('/playground');

    expect(getByTestId('playground-page')).toBeTruthy();
    expect(getByText('Signal mesh')).toBeTruthy();
    expect(getByText('Apps, experiments, and odd ideas')).toBeTruthy();
    expect(getByText('directory live')).toBeTruthy();
    expect(getByTestId('playground-card-system')).toBeTruthy();
    expect(getByTestId('playground-card-todo')).toBeTruthy();
    expect(getByTestId('playground-card-uplink')).toBeTruthy();
  });

  it('renders /uses as the canonical uses route', async () => {
    const { router } = await renderRoute('/uses');

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/uses');
      expect(getByTestId('uses-page')).toBeTruthy();
    });

    expect(getByText('Uses')).toBeTruthy();
    expect(getByText('April 6, 2026')).toBeTruthy();
    expect(getByText('Cloud')).toBeTruthy();
    expect(document.title).toBe('Uses | Morten Broesby-Olsen');
    expect(getMetaContent('meta[property="og:url"]')).toBe('http://localhost:3000/uses');

    const profileLink = document.querySelector<HTMLAnchorElement>('a[href="https://github.com/mortenbroesby"]');
    expect(profileLink).not.toBeNull();
  });

  it('redirects /uses/gear to the canonical /uses route', async () => {
    const { router } = await renderRoute('/uses/gear');

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/uses');
      expect(getByTestId('uses-page')).toBeTruthy();
    });
  });

  it('applies article metadata to published writing posts', async () => {
    await renderRoute('/writing/steady-interfaces');

    expect(document.title).toBe('Steady Interfaces for Growing Frontend Systems | Morten Broesby-Olsen');
    expect(getMetaContent('meta[name="description"]')).toContain('understandable');
    expect(getMetaContent('meta[property="og:type"]')).toBe('article');
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe(
      'http://localhost:3000/writing/steady-interfaces',
    );
  });

  it('renders the system route and lets us search design-system tokens', async () => {
    const { router } = await renderRoute('/system');

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/playground/system');
    });

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
    const { router } = await renderRoute('/game');

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/playground/uplink');
    });

    expect(getByText('Uplink terminal')).toBeTruthy();
    expect(getByTestId('game-container')).toBeTruthy();

    await vi.waitFor(() => {
      expect(mountGameMock).toHaveBeenCalledTimes(1);
      expect(getByTestId('mock-game')).toBeTruthy();
    });
  });

  it('renders the command search trigger in the public header', async () => {
    await renderRoute('/about');
    expect(getByTestId('command-menu-trigger')).toBeTruthy();
  });

  it('opens the global command menu with cmd+k on public routes', async () => {
    await renderRoute('/about');

    expect(document.querySelector('[data-testid="command-menu-input"]')).toBeNull();

    await keydown('k', { metaKey: true });

    await vi.waitFor(() => {
      expect(getByTestId('command-menu-input')).toBeTruthy();
      expect(getByText('Go to Writing')).toBeTruthy();
      expect(getByText('Open Playground')).toBeTruthy();
    });
  });

  it('navigates through the command menu', async () => {
    const { router } = await renderRoute('/about');

    await keydown('k', { metaKey: true });

    await vi.waitFor(() => {
      expect(getByTestId('command-item-page-writing')).toBeTruthy();
    });

    await click(getByTestId('command-item-page-writing'));

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/writing');
      expect(getByTestId('writing-page')).toBeTruthy();
    });
  });

  it('opens the command menu from the public header trigger', async () => {
    await renderRoute('/about');

    expect(document.querySelector('[data-testid="command-menu-input"]')).toBeNull();

    await click(getByTestId('command-menu-trigger'));

    expect(getByTestId('command-menu-input')).toBeTruthy();
  });

  it('navigates from the public header search trigger', async () => {
    const { router } = await renderRoute('/about');

    await click(getByTestId('command-menu-trigger'));
    expect(getByTestId('command-menu-input')).toBeTruthy();

    await click(getByTestId('command-item-page-playground'));

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/playground');
      expect(document.querySelector('[data-testid="command-menu-input"]')).toBeNull();
    });
  });

  it('uses the playground shell navigation on playground routes', async () => {
    const { router } = await renderRoute('/playground');

    await click(getByTestId('mobile-menu-button'));
    expect(getByTestId('mobile-drawer')).toBeTruthy();
    expect(getByText('Lab map')).toBeTruthy();
    expect(document.querySelector('[data-testid="mobile-drawer"] a[href="/about"]')).toBeNull();
    expect(document.querySelector('[data-testid="mobile-drawer"] a[href="/writing"]')).toBeNull();

    const systemLink = document.querySelector<HTMLElement>(
      '[data-testid="mobile-drawer"] a[href="/playground/system"]',
    );
    expect(systemLink).not.toBeNull();
    await click(systemLink!);

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/playground/system');
      expect(document.querySelector('[data-testid="mobile-drawer"]')).toBeNull();
    });
  });

  it('offers a dedicated way back to the main site from playground routes', async () => {
    const { router } = await renderRoute('/playground');

    await click(getByTestId('mobile-menu-button'));
    expect(getByTestId('mobile-drawer')).toBeTruthy();

    const backToSiteLink = document.querySelector<HTMLElement>(
      '[data-testid="mobile-drawer"] a[href="/"]',
    );
    expect(backToSiteLink).not.toBeNull();
    expect(getByText('Back to main site')).toBeTruthy();
    await click(backToSiteLink!);

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
      expect(document.querySelector('[data-testid="mobile-drawer"]')).toBeNull();
    });
  });
});

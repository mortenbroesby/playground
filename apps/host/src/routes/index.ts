import {
  createBrowserRouter,
  createMemoryRouter,
  type RouteObject,
} from 'react-router-dom';
import { PLAYGROUND_ROUTES } from './playground';
import { PUBLIC_ROUTES } from './public';
import { REDIRECT_ROUTES } from './redirects';

export const APP_ROUTES: RouteObject[] = [
  PUBLIC_ROUTES,
  PLAYGROUND_ROUTES,
  ...REDIRECT_ROUTES,
];

type CreateAppRouterOptions = {
  initialEntries?: string[];
};

export function createAppRouter(
  options: CreateAppRouterOptions = {},
): ReturnType<typeof createBrowserRouter> {
  if (options.initialEntries) {
    return createMemoryRouter(APP_ROUTES, {
      initialEntries: options.initialEntries,
    });
  }

  return createBrowserRouter(APP_ROUTES);
}

export const router: ReturnType<typeof createBrowserRouter> = createAppRouter();

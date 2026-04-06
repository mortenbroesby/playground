import {
  createBrowserRouter,
  createMemoryRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom';
import { App } from './App';
import { AboutPage } from './pages/about-page';
import { GamePage } from './pages/game-page';
import { SystemPage } from './pages/system-page';
import { TodoPage } from './pages/todo-page';
import { UsesGearPage } from './pages/uses-gear-page';

export const APP_ROUTES: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/about" replace /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'system', element: <SystemPage /> },
      { path: 'game', element: <GamePage /> },
      { path: 'todo', element: <TodoPage /> },
      { path: 'uses', element: <Navigate to="/uses/gear" replace /> },
      { path: 'uses/gear', element: <UsesGearPage /> },
      { path: 'readme', element: <Navigate to="/about" replace /> },
    ],
  },
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

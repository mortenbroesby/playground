import {
  createBrowserRouter,
  createMemoryRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom';
import { PlaygroundLayout } from './layouts/playground-layout';
import { PublicLayout } from './layouts/public-layout';
import { AboutPage } from './pages/about-page';
import { GamePage } from './pages/game-page';
import { HomePage } from './pages/home-page';
import { PlaygroundPage } from './pages/playground-page';
import { SystemPage } from './pages/system-page';
import { TodoPage } from './pages/todo-page';
import { UsesGearPage } from './pages/uses-gear-page';
import { WritingPage } from './pages/writing-page';
import { WritingPostPage } from './pages/writing-post-page';

export const APP_ROUTES: RouteObject[] = [
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'writing', element: <WritingPage /> },
      { path: 'writing/:slug', element: <WritingPostPage /> },
      { path: 'uses', element: <Navigate to="/uses/gear" replace /> },
      { path: 'uses/gear', element: <UsesGearPage /> },
      { path: 'readme', element: <Navigate to="/about" replace /> },
    ],
  },
  {
    path: 'playground',
    element: <PlaygroundLayout />,
    children: [
      { index: true, element: <PlaygroundPage /> },
      { path: 'system', element: <SystemPage /> },
      { path: 'uplink', element: <GamePage /> },
      { path: 'todo', element: <TodoPage /> },
    ],
  },
  { path: 'system', element: <Navigate to="/playground/system" replace /> },
  { path: 'game', element: <Navigate to="/playground/uplink" replace /> },
  { path: 'todo', element: <Navigate to="/playground/todo" replace /> },
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

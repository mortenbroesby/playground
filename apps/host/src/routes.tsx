import {
  createBrowserRouter,
  createMemoryRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom';
import { App } from './App';
import { TodoPage } from './pages/todo-page';
import { UsesPage } from './pages/uses-page';

export const APP_ROUTES: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/todo" replace /> },
      { path: 'todo', element: <TodoPage /> },
      { path: 'uses', element: <UsesPage /> },
      { path: 'readme', element: <Navigate to="/uses" replace /> },
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

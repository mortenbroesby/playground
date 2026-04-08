import { type RouteObject } from 'react-router-dom';
import { PlaygroundLayout } from '../layouts/playground-layout';
import { GamePage } from '../pages/game-page';
import { PlaygroundPage } from '../pages/playground-page';
import { SystemPage } from '../pages/system-page';
import { TodoPage } from '../pages/todo-page';

export const PLAYGROUND_ROUTES: RouteObject = {
  path: 'playground',
  element: <PlaygroundLayout />,
  children: [
    { index: true, element: <PlaygroundPage /> },
    { path: 'system', element: <SystemPage /> },
    { path: 'uplink', element: <GamePage /> },
    { path: 'todo', element: <TodoPage /> },
  ],
};

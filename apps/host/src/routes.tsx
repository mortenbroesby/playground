import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from './App';
import { ReadmePage } from './pages/readme-page';
import { TodoPage } from './pages/todo-page';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/todo" replace /> },
      { path: 'todo', element: <TodoPage /> },
      { path: 'readme', element: <ReadmePage /> },
    ],
  },
]);

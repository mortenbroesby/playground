import { Navigate, type RouteObject } from 'react-router-dom';

export const REDIRECT_ROUTES: RouteObject[] = [
  { path: 'system', element: <Navigate to="/playground/system" replace /> },
  { path: 'game', element: <Navigate to="/playground/uplink" replace /> },
  { path: 'todo', element: <Navigate to="/playground/todo" replace /> },
];

import { Navigate, type RouteObject } from 'react-router-dom';
import { PublicLayout } from '../layouts/public-layout';
import { AboutPage } from '../pages/about-page';
import { HomePage } from '../pages/home-page';
import { UsesPage } from '../pages/uses-gear-page';
import { WritingPage } from '../pages/writing-page';
import { WritingPostPage } from '../pages/writing-post-page';

export const PUBLIC_ROUTES: RouteObject = {
  path: '/',
  element: <PublicLayout />,
  children: [
    { index: true, element: <HomePage /> },
    { path: 'about', element: <AboutPage /> },
    { path: 'writing', element: <WritingPage /> },
    { path: 'writing/:slug', element: <WritingPostPage /> },
    { path: 'uses', element: <UsesPage /> },
    { path: 'uses/gear', element: <Navigate to="/uses" replace /> },
    { path: 'readme', element: <Navigate to="/about" replace /> },
  ],
};

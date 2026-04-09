import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider, type RouterProviderProps } from 'react-router-dom';
import { router as defaultRouter } from './routes';

export function HostApp({
  router = defaultRouter,
}: {
  router?: RouterProviderProps['router'];
}) {
  return (
    <HelmetProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </HelmetProvider>
  );
}
